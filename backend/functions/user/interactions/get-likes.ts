import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { UserAuthUtil } from "@shared/utils/user-auth";
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
    // Extract user authentication using centralized utility
    const authResult = await UserAuthUtil.requireAuth(event);

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      return authResult;
    }

    const requestingUserId = authResult.userId!;
    console.log("✅ Authenticated user:", requestingUserId);

    // Check if we're querying for a specific user's likes
    const queryParams = event.queryStringParameters || {};
    const targetUsername = queryParams["user"];

    let targetUserId = requestingUserId; // Default to requesting user's own likes

    if (targetUsername) {
      // Look up the target user by username
      const targetUser = await DynamoDBService.getUserByUsername(
        targetUsername
      );
      if (!targetUser) {
        return ResponseUtil.notFound(event, "User not found");
      }
      targetUserId = targetUser.userId;
    }

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

    // Get user's likes from DynamoDB
    const result = await DynamoDBService.getUserInteractions(
      targetUserId,
      "like",
      limit,
      lastEvaluatedKey
    );

    const { interactions } = result;

    // Get target details for each interaction
    const enrichedInteractions = await Promise.all(
      interactions.map(async (interaction) => {
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
    console.error("❌ Error in get-likes function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
