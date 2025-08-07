import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthUtil } from "@shared/utils/user-auth";
import { ResponseUtil } from "@shared/utils/response";
import {
  PaginationUtil,
  DEFAULT_PAGINATION_LIMITS,
  MAX_PAGINATION_LIMITS,
} from "@shared/utils/pagination";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Get user bookmarks function called");
  console.log("📝 Event:", JSON.stringify(event, null, 2));

  try {
    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
      return ResponseUtil.noContent(event);
    }

    // Extract user authentication using centralized utility
    const authResult = await UserAuthUtil.requireAuth(event);

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      return authResult;
    }

    const userId = authResult.userId!;

    // Parse pagination parameters using unified utility
    let paginationParams;
    try {
      paginationParams = PaginationUtil.parseRequestParams(
        event.queryStringParameters as Record<string, string> | null,
        DEFAULT_PAGINATION_LIMITS.interactions,
        MAX_PAGINATION_LIMITS.interactions
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid pagination parameters";
      return ResponseUtil.badRequest(event, errorMessage);
    }

    const { cursor: lastEvaluatedKey, limit } = paginationParams;

    // Get user bookmarks
    const result = await DynamoDBService.getUserInteractions(
      userId,
      "bookmark",
      limit,
      lastEvaluatedKey
    );

    // Get target details for each interaction
    const enrichedInteractions = await Promise.all(
      result.interactions.map(async (interaction) => {
        let targetDetails = null;

        if (interaction.targetType === "album") {
          targetDetails = await DynamoDBService.getAlbum(interaction.targetId);
        } else if (interaction.targetType === "media") {
          // For media, get the media details directly
          targetDetails = await DynamoDBService.getMedia(interaction.targetId);
        }

        return {
          ...interaction,
          target: targetDetails,
        };
      })
    );

    // Calculate pagination info
    const paginationMeta = PaginationUtil.createPaginationMeta(
      result.lastEvaluatedKey,
      limit
    );

    return ResponseUtil.success(event, {
      interactions: enrichedInteractions,
      pagination: paginationMeta,
    });
  } catch (error) {
    console.error("❌ Error in get-bookmarks function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
