import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { ResponseUtil } from "@shared/utils/response";
import {
  CommentInteractionRequest,
  UserInteractionEntity,
} from "@shared/types/user";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Comment Like/Unlike function called");
  console.log("📝 Event:", JSON.stringify(event, null, 2));

  try {
    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
      return ResponseUtil.noContent(event);
    }

    // Validate user session
    const authResult = await UserAuthMiddleware.validateSession(event);
    if (!authResult.isValid || !authResult.user) {
      return ResponseUtil.unauthorized(event, "Unauthorized");
    }

    const user = authResult.user;

    // Parse request body
    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const body: CommentInteractionRequest = JSON.parse(event.body);
    const { targetType, targetId, action } = body;

    // Validate input
    if (!targetType || !targetId || !action) {
      return ResponseUtil.badRequest(
        event,
        "targetType, targetId, and action are required"
      );
    }

    if (targetType !== "comment") {
      return ResponseUtil.badRequest(event, "targetType must be 'comment'");
    }

    if (!["add", "remove"].includes(action)) {
      return ResponseUtil.badRequest(event, "action must be 'add' or 'remove'");
    }

    // Verify comment exists
    const comment = await DynamoDBService.getComment(targetId);
    if (!comment) {
      return ResponseUtil.notFound(event, "Comment not found");
    }

    const now = new Date().toISOString();

    if (action === "add") {
      // Check if already liked
      const existingLike = await DynamoDBService.getUserInteractionForComment(
        user.userId,
        "like",
        targetId
      );

      if (existingLike) {
        return ResponseUtil.error(event, "Comment already liked", 409);
      }

      // Create like interaction for comment
      const interaction: UserInteractionEntity = {
        PK: `USER#${user.userId}`,
        SK: `COMMENT_INTERACTION#like#${targetId}`,
        GSI1PK: `COMMENT_INTERACTION#like#${targetId}`,
        GSI1SK: user.userId,
        EntityType: "UserInteraction",
        userId: user.userId,
        interactionType: "like",
        targetType: "comment",
        targetId,
        createdAt: now,
      };

      await DynamoDBService.createUserInteraction(interaction);

      // Increment like count for the comment
      await DynamoDBService.incrementCommentLikeCount(targetId, 1);

      console.log(`✅ Like added for comment ${targetId}`);
    } else {
      // Remove like
      await DynamoDBService.deleteUserInteractionForComment(
        user.userId,
        "like",
        targetId
      );

      // Decrement like count for the comment
      await DynamoDBService.incrementCommentLikeCount(targetId, -1);

      console.log(`✅ Like removed for comment ${targetId}`);
    }

    return ResponseUtil.success(event, {
      userId: user.userId,
      interactionType: "like",
      targetType: "comment",
      targetId,
      action: action === "add" ? "added" : "removed",
      createdAt: now,
    });
  } catch (error) {
    console.error("❌ Error in comment like function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
