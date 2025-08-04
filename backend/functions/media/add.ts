import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { S3Service } from "@shared/utils/s3";
import { ResponseUtil } from "@shared/utils/response";
import { UploadMediaRequest } from "@shared/types";
import { UserAuthUtil } from "@shared/utils/user-auth";
import { RevalidationService } from "@shared/utils/revalidation";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Extract user authentication with role information using centralized utility
    const authResult = await UserAuthUtil.requireAuth(event, {
      includeRole: true,
    });

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      return authResult;
    }

    const userId = authResult.userId!;
    const userRole = authResult.userRole || "user";

    console.log("✅ Authenticated user:", userId);
    console.log("🎭 User role:", userRole);

    const albumId = event.pathParameters?.["albumId"];

    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    // Verify album exists and check ownership
    const album = await DynamoDBService.getAlbum(albumId);
    if (!album) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    // Check if user owns this album or has admin privileges
    const isOwner = album.createdBy === userId;
    const isAdmin = userRole === "admin" || userRole === "moderator";

    if (!isOwner && !isAdmin) {
      console.log("❌ User does not own album and is not admin:", {
        userId,
        albumCreatedBy: album.createdBy,
        userRole,
      });
      return ResponseUtil.forbidden(
        event,
        "Access denied: You can only add media to your own albums"
      );
    }

    console.log("✅ User authorized to add media to album:", {
      isOwner,
      isAdmin,
      userRole,
    });

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

      // Album was already verified above, so we can proceed
      // Verify media exists
      const media = await DynamoDBService.getMedia(mediaId);
      if (!media) {
        return ResponseUtil.notFound(event, "Media not found");
      }

      console.log("✅ User authorized to add media to their album");

      // Add media to album
      try {
        await DynamoDBService.addMediaToAlbum(albumId, mediaId, userId);
      } catch (error: any) {
        if (error.message?.includes("already in album")) {
          return ResponseUtil.badRequest(event, error.message);
        }
        throw error;
      }

      await RevalidationService.revalidateMedia(mediaId);
      await RevalidationService.revalidateAlbum(albumId);

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

    // Album was already verified above, so we can proceed directly
    // Generate presigned upload URL
    const { uploadUrl, key } = await S3Service.generateMediaPresignedUploadUrl(
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

    // Increment user's totalGeneratedMedias metric
    try {
      await DynamoDBService.incrementUserProfileMetric(
        userId,
        "totalGeneratedMedias"
      );
      console.log(`📈 Incremented totalGeneratedMedias for user: ${userId}`);
    } catch (error) {
      console.warn(
        `⚠️ Failed to increment totalGeneratedMedias for user ${userId}:`,
        error
      );
    }

    // Link media to album using new many-to-many relationship
    await DynamoDBService.addMediaToAlbum(albumId, mediaId, userId);

    const response = {
      mediaId,
      uploadUrl,
      key,
      expiresIn: 3600, // 1 hour
    };

    await RevalidationService.revalidateAlbum(albumId);

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Error creating media upload:", error);
    return ResponseUtil.internalError(event, "Failed to create media upload");
  }
};
