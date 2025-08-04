import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthUtil } from "@shared/utils/user-auth";
import { ResponseUtil } from "@shared/utils/response";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Get comment like status function called");
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

    // Parse request body for bulk comment like status check
    let commentIds: string[] = [];

    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        commentIds = body.commentIds || [];
      } catch (error) {
        return ResponseUtil.badRequest(event, "Invalid JSON body");
      }
    }

    // Validate commentIds
    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return ResponseUtil.badRequest(
        event,
        "commentIds array is required and must not be empty"
      );
    }

    if (commentIds.length > 50) {
      return ResponseUtil.badRequest(
        event,
        "Maximum 50 comment IDs allowed per request"
      );
    }

    // Validate each commentId
    for (const commentId of commentIds) {
      if (!commentId || typeof commentId !== "string") {
        return ResponseUtil.badRequest(
          event,
          "Each commentId must be a valid string"
        );
      }
    }

    // Get user's like status for each comment
    const statusMap = new Map<string, boolean>();

    // Initialize all comments as not liked
    for (const commentId of commentIds) {
      statusMap.set(commentId, false);
    }

    try {
      // Check each comment for user's like status
      const statusChecks = commentIds.map(async (commentId) => {
        const interaction = await DynamoDBService.getUserInteractionForComment(
          userId,
          "like",
          commentId
        );
        return { commentId, isLiked: interaction !== null };
      });

      const results = await Promise.all(statusChecks);

      // Update status map with actual results
      for (const result of results) {
        statusMap.set(result.commentId, result.isLiked);
      }
    } catch (error) {
      console.error("❌ Error fetching comment like status:", error);
      return ResponseUtil.internalError(
        event,
        "Failed to fetch comment like status"
      );
    }

    // Format response
    const statuses = commentIds.map((commentId) => ({
      commentId,
      isLiked: statusMap.get(commentId)!,
    }));

    const responseData = {
      statuses,
    };

    console.log(
      `✅ Successfully retrieved like status for ${commentIds.length} comments`
    );
    return ResponseUtil.success(event, responseData);
  } catch (error) {
    console.error("❌ Error in get-comment-like-status function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
