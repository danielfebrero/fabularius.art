import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import {
  PaginationUtil,
  DEFAULT_PAGINATION_LIMITS,
  MAX_PAGINATION_LIMITS,
} from "@shared/utils/pagination";

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

    // Create pagination metadata using unified utility
    const paginationMeta = PaginationUtil.createPaginationMeta(nextKey, limit);

    return ResponseUtil.success(event, {
      albums: albums,
      pagination: paginationMeta,
    });
  } catch (error) {
    console.error("Error fetching admin albums:", error);
    return ResponseUtil.internalError(event, "Failed to fetch albums");
  }
};
