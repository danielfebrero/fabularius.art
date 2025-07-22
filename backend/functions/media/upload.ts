import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { S3Service } from "@shared/utils/s3";
import { ResponseUtil } from "@shared/utils/response";
import { UploadMediaRequest } from "@shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Get user ID from request context (set by the admin authorizer)
    const userId = event.requestContext.authorizer?.['userId'];
    
    if (!userId) {
      return ResponseUtil.unauthorized(event, "User ID not found in request context");
    }
    const albumId = event.pathParameters?.["albumId"];

    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const request: UploadMediaRequest = JSON.parse(event.body);

    if (!request.filename || !request.mimeType) {
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
      request.filename,
      request.mimeType
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
      originalFilename: request.filename,
      mimeType: request.mimeType,
      size: request.size || 0,
      url: S3Service.getRelativePath(key),
      createdAt: now,
      updatedAt: now,
      createdBy: userId, // Use actual admin user ID
      createdByType: "admin" as const,
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
