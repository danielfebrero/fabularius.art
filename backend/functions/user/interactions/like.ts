import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { ResponseUtil } from "@shared/utils/response";
import { InteractionRequest, UserInteractionEntity } from "@shared/types/user";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Like/Unlike function called");
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

    const body: InteractionRequest = JSON.parse(event.body);
    const { targetType, targetId, action } = body;

    // Validate input
    if (!targetType || !targetId || !action) {
      return ResponseUtil.badRequest(
        event,
        "targetType, targetId, and action are required"
      );
    }

    if (!["album", "media"].includes(targetType)) {
      return ResponseUtil.badRequest(
        event,
        "targetType must be 'album' or 'media'"
      );
    }

    if (!["add", "remove"].includes(action)) {
      return ResponseUtil.badRequest(event, "action must be 'add' or 'remove'");
    }

    // Verify target exists
    if (targetType === "album") {
      const album = await DynamoDBService.getAlbum(targetId);
      if (!album) {
        return ResponseUtil.notFound(event, "Album not found");
      }
    } else {
      // For media, we need albumId to check - extract from pathParameters or validate differently
      const pathParams = event.pathParameters;
      if (!pathParams || !pathParams["albumId"]) {
        return ResponseUtil.badRequest(
          event,
          "albumId is required for media interactions"
        );
      }

      const media = await DynamoDBService.getMedia(
        pathParams["albumId"],
        targetId
      );
      if (!media) {
        return ResponseUtil.notFound(event, "Media not found");
      }
    }

    const now = new Date().toISOString();

    if (action === "add") {
      // Check if already liked
      const existingLike = await DynamoDBService.getUserInteraction(
        user.userId,
        "like",
        targetId
      );

      if (existingLike) {
        return ResponseUtil.error(event, "Already liked", 409);
      }

      // Create like interaction
      const interaction: UserInteractionEntity = {
        PK: `USER#${user.userId}`,
        SK: `INTERACTION#like#${targetId}`,
        GSI1PK: `INTERACTION#like#${targetId}`,
        GSI1SK: user.userId,
        EntityType: "UserInteraction",
        userId: user.userId,
        interactionType: "like",
        targetType,
        targetId,
        createdAt: now,
      };

      await DynamoDBService.createUserInteraction(interaction);

      // Increment like count for the target
      if (targetType === "album") {
        await DynamoDBService.incrementAlbumLikeCount(targetId, 1);
      }

      return ResponseUtil.created(event, {
        userId: user.userId,
        interactionType: "like",
        targetType,
        targetId,
        createdAt: now,
      });
    } else {
      // Remove like
      await DynamoDBService.deleteUserInteraction(
        user.userId,
        "like",
        targetId
      );

      // Decrement like count for the target
      if (targetType === "album") {
        await DynamoDBService.incrementAlbumLikeCount(targetId, -1);
      }

      return ResponseUtil.success(event, {
        userId: user.userId,
        interactionType: "like",
        targetType,
        targetId,
        action: "removed",
      });
    }
  } catch (error) {
    console.error("❌ Error in like function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
