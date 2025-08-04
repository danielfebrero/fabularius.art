import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import {
  PaginationUtil,
  DEFAULT_PAGINATION_LIMITS,
  MAX_PAGINATION_LIMITS,
} from "@shared/utils/pagination";
import { Media } from "@shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const albumId = event.pathParameters?.["albumId"];

    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    // Verify album exists
    const album = await DynamoDBService.getAlbum(albumId);
    if (!album) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    // Parse pagination parameters using unified utility
    let paginationParams;
    try {
      paginationParams = PaginationUtil.parseRequestParams(
        event.queryStringParameters as Record<string, string> | null,
        DEFAULT_PAGINATION_LIMITS.media,
        MAX_PAGINATION_LIMITS.media
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid pagination parameters";
      return ResponseUtil.badRequest(event, errorMessage);
    }

    const { cursor: lastEvaluatedKey, limit } = paginationParams;

    const { media, lastEvaluatedKey: nextKey } =
      await DynamoDBService.listAlbumMedia(albumId, limit, lastEvaluatedKey);

    const mediaResponse: Media[] = media.map((item) => {
      const response: Media = {
        id: item.id,
        filename: item.filename,
        originalFilename: item.originalFilename,
        mimeType: item.mimeType,
        size: item.size,
        url: item.url,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };

      if (item.width !== undefined) {
        response.width = item.width;
      }

      if (item.height !== undefined) {
        response.height = item.height;
      }

      if (item.thumbnailUrl !== undefined) {
        response.thumbnailUrl = item.thumbnailUrl;
      }

      if (item.thumbnailUrls !== undefined) {
        response.thumbnailUrls = item.thumbnailUrls;
      }

      if (item.metadata !== undefined) {
        response.metadata = item.metadata;
      }

      if (item.likeCount !== undefined) {
        response.likeCount = item.likeCount;
      }

      if (item.bookmarkCount !== undefined) {
        response.bookmarkCount = item.bookmarkCount;
      }

      if (item.viewCount !== undefined) {
        response.viewCount = item.viewCount;
      }

      // Add creator information if available
      if (item.createdBy !== undefined) {
        response.createdBy = item.createdBy;
      }

      if (item.createdByType !== undefined) {
        response.createdByType = item.createdByType;
      }

      return response;
    });

    // Create pagination metadata using unified utility
    const paginationMeta = PaginationUtil.createPaginationMeta(nextKey, limit);

    return ResponseUtil.success(event, {
      media: mediaResponse,
      pagination: paginationMeta,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return ResponseUtil.internalError(event, "Failed to fetch media");
  }
};
