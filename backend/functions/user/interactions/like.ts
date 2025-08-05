import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthUtil } from "@shared/utils/user-auth";
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

    // Extract user authentication using centralized utility
    const authResult = await UserAuthUtil.requireAuth(event);

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      return authResult;
    }

    const userId = authResult.userId!;

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

    if (!["album", "media", "comment"].includes(targetType)) {
      return ResponseUtil.badRequest(
        event,
        "targetType must be 'album', 'media', or 'comment'"
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
    } else if (targetType === "media") {
      // For media, verify it exists - no albumId needed in new schema
      const media = await DynamoDBService.getMedia(targetId);
      if (!media) {
        return ResponseUtil.notFound(event, "Media not found");
      }
    } else if (targetType === "comment") {
      // For comments, verify it exists
      const comment = await DynamoDBService.getComment(targetId);
      if (!comment) {
        return ResponseUtil.notFound(event, "Comment not found");
      }
    }

    const now = new Date().toISOString();

    if (action === "add") {
      // Check if already liked - use different method for comments
      let existingLike;
      if (targetType === "comment") {
        existingLike = await DynamoDBService.getUserInteractionForComment(
          userId,
          "like",
          targetId
        );
      } else {
        existingLike = await DynamoDBService.getUserInteraction(
          userId,
          "like",
          targetId
        );
      }

      if (existingLike) {
        return ResponseUtil.error(event, "Already liked", 409);
      }

      // Create like interaction - use different SK pattern for comments
      const interaction: UserInteractionEntity = {
        PK: `USER#${userId}`,
        SK:
          targetType === "comment"
            ? `COMMENT_INTERACTION#like#${targetId}`
            : `INTERACTION#like#${targetId}`,
        GSI1PK:
          targetType === "comment"
            ? `COMMENT_INTERACTION#like#${targetId}`
            : `INTERACTION#like#${targetId}`,
        GSI1SK: userId,
        EntityType: "UserInteraction",
        userId: userId,
        interactionType: "like",
        targetType,
        targetId,
        createdAt: now,
      };

      await DynamoDBService.createUserInteraction(interaction);

      // Increment like count for the target
      if (targetType === "album") {
        await DynamoDBService.incrementAlbumLikeCount(targetId, 1);

        // Get album creator and increment their totalLikesReceived metric
        const album = await DynamoDBService.getAlbum(targetId);
        if (album?.createdBy) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              album.createdBy,
              "totalLikesReceived"
            );
            console.log(
              `📈 Incremented totalLikesReceived for album creator: ${album.createdBy}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to increment totalLikesReceived for user ${album.createdBy}:`,
              error
            );
          }
        }
      } else if (targetType === "media") {
        await DynamoDBService.incrementMediaLikeCount(targetId, 1);

        // Get media creator and increment their totalLikesReceived metric
        const media = await DynamoDBService.getMedia(targetId);
        if (media?.createdBy) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              media.createdBy,
              "totalLikesReceived"
            );
            console.log(
              `📈 Incremented totalLikesReceived for media creator: ${media.createdBy}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to increment totalLikesReceived for user ${media.createdBy}:`,
              error
            );
          }
        }
      } else if (targetType === "comment") {
        await DynamoDBService.incrementCommentLikeCount(targetId, 1);

        // Get comment creator and increment their totalLikesReceived metric
        const comment = await DynamoDBService.getComment(targetId);
        if (comment?.userId) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              comment.userId,
              "totalLikesReceived"
            );
            console.log(
              `📈 Incremented totalLikesReceived for comment creator: ${comment.userId}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to increment totalLikesReceived for user ${comment.userId}:`,
              error
            );
          }
        }
      }

      console.log(`✅ Like added for ${targetType} ${targetId}`);
    } else {
      // Remove like - use different method for comments
      if (targetType === "comment") {
        await DynamoDBService.deleteUserInteractionForComment(
          userId,
          "like",
          targetId
        );
      } else {
        await DynamoDBService.deleteUserInteraction(userId, "like", targetId);
      }

      // Decrement like count for the target
      if (targetType === "album") {
        await DynamoDBService.incrementAlbumLikeCount(targetId, -1);

        // Get album creator and decrement their totalLikesReceived metric
        const album = await DynamoDBService.getAlbum(targetId);
        if (album?.createdBy) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              album.createdBy,
              "totalLikesReceived",
              -1
            );
            console.log(
              `📉 Decremented totalLikesReceived for album creator: ${album.createdBy}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to decrement totalLikesReceived for user ${album.createdBy}:`,
              error
            );
          }
        }
      } else if (targetType === "media") {
        await DynamoDBService.incrementMediaLikeCount(targetId, -1);

        // Get media creator and decrement their totalLikesReceived metric
        const media = await DynamoDBService.getMedia(targetId);
        if (media?.createdBy) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              media.createdBy,
              "totalLikesReceived",
              -1
            );
            console.log(
              `📉 Decremented totalLikesReceived for media creator: ${media.createdBy}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to decrement totalLikesReceived for user ${media.createdBy}:`,
              error
            );
          }
        }
      } else if (targetType === "comment") {
        await DynamoDBService.incrementCommentLikeCount(targetId, -1);

        // Get comment creator and decrement their totalLikesReceived metric
        const comment = await DynamoDBService.getComment(targetId);
        if (comment?.userId) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              comment.userId,
              "totalLikesReceived",
              -1
            );
            console.log(
              `📉 Decremented totalLikesReceived for comment creator: ${comment.userId}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to decrement totalLikesReceived for user ${comment.userId}:`,
              error
            );
          }
        }
      }

      console.log(`✅ Like removed for ${targetType} ${targetId}`);
    }

    return ResponseUtil.success(event, {
      userId: userId,
      interactionType: "like",
      targetType,
      targetId,
      action: action === "add" ? "added" : "removed",
    });
  } catch (error) {
    console.error("❌ Error in like function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
