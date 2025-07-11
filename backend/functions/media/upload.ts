import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "../../shared/utils/dynamodb";
import { S3Service } from "../../shared/utils/s3";
import { ResponseUtil } from "../../shared/utils/response";
import { UploadMediaRequest } from "../../shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const albumId = event.pathParameters?.["albumId"];

    if (!albumId) {
      return ResponseUtil.badRequest("Album ID is required");
    }

    if (!event.body) {
      return ResponseUtil.badRequest("Request body is required");
    }

    const request: UploadMediaRequest = JSON.parse(event.body);

    if (!request.filename || !request.mimeType) {
      return ResponseUtil.badRequest("Filename and mimeType are required");
    }

    // Verify album exists
    const album = await DynamoDBService.getAlbum(albumId);
    if (!album) {
      return ResponseUtil.notFound("Album not found");
    }

    // Generate presigned upload URL
    const { uploadUrl, key } = await S3Service.generatePresignedUploadUrl(
      albumId,
      request.filename,
      request.mimeType
    );

    const mediaId = uuidv4();
    const now = new Date().toISOString();

    // Create media record (will be updated after successful upload)
    const mediaEntity = {
      PK: `ALBUM#${albumId}`,
      SK: `MEDIA#${mediaId}`,
      GSI1PK: `MEDIA#${albumId}`,
      GSI1SK: `${now}#${mediaId}`,
      EntityType: "Media" as const,
      id: mediaId,
      albumId,
      filename: key,
      originalFilename: request.filename,
      mimeType: request.mimeType,
      size: request.size || 0,
      url: S3Service.getPublicUrl(key),
      createdAt: now,
      updatedAt: now,
      status: "pending", // Will be updated to 'uploaded' after successful upload
    };

    await DynamoDBService.createMedia(mediaEntity);

    const response = {
      mediaId,
      uploadUrl,
      key,
      expiresIn: 3600, // 1 hour
    };

    return ResponseUtil.success(response);
  } catch (error) {
    console.error("Error creating media upload:", error);
    return ResponseUtil.internalError("Failed to create media upload");
  }
};
