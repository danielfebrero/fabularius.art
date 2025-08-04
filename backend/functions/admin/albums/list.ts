import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import {
  PaginationUtil,
  DEFAULT_PAGINATION_LIMITS,
  MAX_PAGINATION_LIMITS,
} from "@shared/utils/pagination";
import { Album } from "@shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Parse pagination parameters using unified utility
    let paginationParams;
    try {
      paginationParams = PaginationUtil.parseRequestParams(
        event.queryStringParameters as Record<string, string> | null,
        DEFAULT_PAGINATION_LIMITS.admin,
        MAX_PAGINATION_LIMITS.admin
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid pagination parameters";
      return ResponseUtil.badRequest(event, errorMessage);
    }

    const { cursor: lastEvaluatedKey, limit } = paginationParams;

    // Get all albums (including private ones) - admin view
    const { albums, lastEvaluatedKey: nextKey } =
      await DynamoDBService.listAlbums(limit, lastEvaluatedKey);

    const albumsResponse: Album[] = albums.map((album) => {
      const response: Album = {
        id: album.id,
        title: album.title,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        mediaCount: album.mediaCount,
        isPublic: album.isPublic,
      };

      if (album.tags !== undefined) {
        response.tags = album.tags;
      }

      if (album.coverImageUrl !== undefined) {
        response.coverImageUrl = album.coverImageUrl;
      }

      if (album.thumbnailUrls !== undefined) {
        response.thumbnailUrls = album.thumbnailUrls;
      }

      return response;
    });

    // Create pagination metadata using unified utility
    const paginationMeta = PaginationUtil.createPaginationMeta(nextKey, limit);

    return ResponseUtil.success(event, {
      albums: albumsResponse,
      pagination: paginationMeta,
    });
  } catch (error) {
    console.error("Error fetching admin albums:", error);
    return ResponseUtil.internalError(event, "Failed to fetch albums");
  }
};
