import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { S3Service } from "@shared/utils/s3";
import { ResponseUtil } from "@shared/utils/response";
import { UploadMediaRequest } from "@shared/types";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { PlanUtil } from "@shared/utils/plan";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Get user ID from request context (set by the admin authorizer)
    let userId = event.requestContext.authorizer?.["userId"];

    console.log("👤 UserId from authorizer:", userId);

    // Fallback for local development or when authorizer context is missing
    if (!userId) {
      console.log(
        "⚠️ No userId from authorizer, falling back to session validation"
      );
      const validation = await UserAuthMiddleware.validateSession(event);

      if (!validation.isValid || !validation.user) {
        console.log("❌ Session validation failed");
        return ResponseUtil.unauthorized(event, "No user session found");
      }

      userId = validation.user.userId;
      console.log("✅ Got userId from session validation:", userId);

      // Verify user has admin privileges when using fallback
      const userRole = await PlanUtil.getUserRole(
        validation.user.userId,
        validation.user.email
      );

      if (userRole !== "admin") {
        console.log("❌ User does not have admin privileges:", userRole);
        return ResponseUtil.forbidden(
          event,
          "Access denied: insufficient privileges"
        );
      }

      console.log("✅ User has admin/moderator privileges:", userRole);
    }
    const albumId = event.pathParameters?.["albumId"];

    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const request = JSON.parse(event.body);

    // Check if this is a media-to-album association request
    if (request.mediaId) {
      // Association operation: Add existing media to album
      const { mediaId } = request;

      if (!mediaId) {
        return ResponseUtil.badRequest(
          event,
          "Media ID is required for association"
        );
      }

      // Verify album exists
      const album = await DynamoDBService.getAlbum(albumId);
      if (!album) {
        return ResponseUtil.notFound(event, "Album not found");
      }

      // Verify media exists
      const media = await DynamoDBService.getMedia(mediaId);
      if (!media) {
        return ResponseUtil.notFound(event, "Media not found");
      }

      // Add media to album
      await DynamoDBService.addMediaToAlbum(albumId, mediaId, userId);

      return ResponseUtil.success(event, {
        success: true,
        message: "Media added to album successfully",
        albumId,
        mediaId,
      });
    }

    // Upload operation: Create new media and add to album
    const uploadRequest: UploadMediaRequest = request;

    if (!uploadRequest.filename || !uploadRequest.mimeType) {
      return ResponseUtil.badRequest(
        event,
        "Filename and mimeType are required"
      );
    }

    // Verify album exists
    const album = await DynamoDBService.getAlbum(albumId);
    if (!album) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    // Generate presigned upload URL
    const { uploadUrl, key } = await S3Service.generatePresignedUploadUrl(
      albumId,
      uploadRequest.filename,
      uploadRequest.mimeType
    );

    const mediaId = uuidv4();
    const now = new Date().toISOString();

    // Create media record using new schema (independent of album)
    const mediaEntity = {
      PK: `MEDIA#${mediaId}`,
      SK: "METADATA",
      GSI1PK: "MEDIA_BY_CREATOR",
      GSI1SK: `${userId}#${now}#${mediaId}`, // Use actual user ID
      GSI2PK: "MEDIA_ID",
      GSI2SK: mediaId,
      EntityType: "Media" as const,
      id: mediaId,
      filename: key,
      originalFilename: uploadRequest.filename,
      mimeType: uploadRequest.mimeType,
      size: uploadRequest.size || 0,
      url: S3Service.getRelativePath(key),
      createdAt: now,
      updatedAt: now,
      createdBy: userId, // Use actual user ID
      createdByType: "user" as const,
      status: "pending" as const, // Will be updated to 'uploaded' after successful upload
    };
    console.log(
      "Generated media relative path:",
      S3Service.getRelativePath(key)
    );

    // Create the media entity
    await DynamoDBService.createMedia(mediaEntity);

    // Link media to album using new many-to-many relationship
    await DynamoDBService.addMediaToAlbum(albumId, mediaId, userId);

    const response = {
      mediaId,
      uploadUrl,
      key,
      expiresIn: 3600, // 1 hour
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Error creating media upload:", error);
    return ResponseUtil.internalError(event, "Failed to create media upload");
  }
};
