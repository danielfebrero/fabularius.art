import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { S3Service } from "@shared/utils/s3";
import { ResponseUtil } from "@shared/utils/response";
import { UploadMediaRequest } from "@shared/types";

interface ExtendedUploadRequest extends UploadMediaRequest {
  albumId?: string; // Optional - if not provided, media goes to NO_ALBUM
  createdBy?: string; // userId or adminId
  createdByType?: "user" | "admin";
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const request: ExtendedUploadRequest = JSON.parse(event.body);

    if (!request.filename || !request.mimeType) {
      return ResponseUtil.badRequest(
        event,
        "Filename and mimeType are required"
      );
    }

    // Use albumId from request body or path parameter, default to NO_ALBUM
    const albumId =
      request.albumId || event.pathParameters?.["albumId"] || "NO_ALBUM";

    // If targeting a real album, verify it exists
    if (albumId !== "NO_ALBUM") {
      const album = await DynamoDBService.getAlbum(albumId);
      if (!album) {
        return ResponseUtil.notFound(event, "Album not found");
      }
    }

    // Generate presigned upload URL
    const { uploadUrl, key } = await S3Service.generatePresignedUploadUrl(
      albumId,
      request.filename,
      request.mimeType
    );

    const mediaId = uuidv4();
    const now = new Date().toISOString();

    // Create media record
    const mediaEntity = {
      PK: `ALBUM#${albumId}`,
      SK: `MEDIA#${mediaId}`,
      GSI1PK: `MEDIA#${albumId}`,
      GSI1SK: `${now}#${mediaId}`,
      GSI2PK: "MEDIA_ID",
      GSI2SK: mediaId,
      EntityType: "Media" as const,
      id: mediaId,
      albumId,
      filename: key,
      originalFilename: request.filename,
      mimeType: request.mimeType,
      size: request.size || 0,
      url: S3Service.getRelativePath(key),
      createdAt: now,
      updatedAt: now,
      status: "pending" as const,
      // User tracking
      createdBy: request.createdBy,
      createdByType: request.createdByType,
    };

    console.log(
      "Generated media relative path:",
      S3Service.getRelativePath(key)
    );

    await DynamoDBService.createMedia(mediaEntity);

    // Only increment album count for real albums
    if (albumId !== "NO_ALBUM") {
      await DynamoDBService.incrementAlbumMediaCount(albumId);
    }

    const response = {
      mediaId,
      uploadUrl,
      key,
      albumId,
      expiresIn: 3600, // 1 hour
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Error creating media upload:", error);
    return ResponseUtil.internalError(event, "Failed to create media upload");
  }
};
