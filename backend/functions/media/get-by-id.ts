import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { Media } from "@shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    const mediaId = event.pathParameters?.["mediaId"];

    if (!mediaId) {
      return ResponseUtil.badRequest(event, "Media ID is required");
    }

    // Find media by ID using GSI2
    const mediaEntity = await DynamoDBService.findMediaById(mediaId);

    if (!mediaEntity) {
      return ResponseUtil.notFound(event, "Media not found");
    }

    // Convert to response format
    const mediaResponse: Media = {
      id: mediaEntity.id,
      filename: mediaEntity.filename,
      originalFilename: mediaEntity.originalFilename,
      mimeType: mediaEntity.mimeType,
      size: mediaEntity.size,
      url: mediaEntity.url,
      createdAt: mediaEntity.createdAt,
      updatedAt: mediaEntity.updatedAt,
    };

    // Add optional fields if they exist
    if (mediaEntity.width !== undefined) {
      mediaResponse.width = mediaEntity.width;
    }

    if (mediaEntity.height !== undefined) {
      mediaResponse.height = mediaEntity.height;
    }

    if (mediaEntity.thumbnailUrl !== undefined) {
      mediaResponse.thumbnailUrl = mediaEntity.thumbnailUrl;
    }

    if (mediaEntity.thumbnailUrls !== undefined) {
      mediaResponse.thumbnailUrls = mediaEntity.thumbnailUrls;
    }

    if (mediaEntity.metadata !== undefined) {
      mediaResponse.metadata = mediaEntity.metadata;
    }

    return ResponseUtil.success(event, mediaResponse);
  } catch (error) {
    console.error("Error fetching media by ID:", error);
    return ResponseUtil.internalError(event, "Failed to fetch media");
  }
};
