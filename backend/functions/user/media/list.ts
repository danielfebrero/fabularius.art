import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import {
  PaginationUtil,
  DEFAULT_PAGINATION_LIMITS,
  MAX_PAGINATION_LIMITS,
} from "@shared/utils/pagination";
import { Media } from "@shared/types";
import { UserAuthUtil } from "@shared/utils/user-auth";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Extract user authentication using centralized utility
    const authResult = await UserAuthUtil.requireAuth(event);

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      return authResult;
    }

    const userId = authResult.userId!;
    console.log("✅ Authenticated user:", userId);

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

    // Get user's media
    const { media, nextKey } = await DynamoDBService.getUserMedia(
      userId,
      limit,
      lastEvaluatedKey
    );

    // Convert MediaEntity to Media using shared helper
    const mediaResponse: Media[] = media.map((item) =>
      DynamoDBService.convertMediaEntityToMedia(item)
    );

    // Create pagination metadata using unified utility
    const paginationMeta = PaginationUtil.createPaginationMeta(nextKey, limit);

    return ResponseUtil.success(event, {
      media: mediaResponse,
      pagination: paginationMeta,
    });
  } catch (error) {
    console.error("Error fetching user media:", error);
    return ResponseUtil.internalError(event, "Failed to fetch user media");
  }
};
