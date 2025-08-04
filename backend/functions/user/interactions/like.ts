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
      // For media, verify it exists - no albumId needed in new schema
      const media = await DynamoDBService.getMedia(targetId);
      if (!media) {
        return ResponseUtil.notFound(event, "Media not found");
      }
    }

    const now = new Date().toISOString();

    if (action === "add") {
      // Check if already liked
      const existingLike = await DynamoDBService.getUserInteraction(
        userId,
        "like",
        targetId
      );

      if (existingLike) {
        return ResponseUtil.error(event, "Already liked", 409);
      }

      // Create like interaction
      const interaction: UserInteractionEntity = {
        PK: `USER#${userId}`,
        SK: `INTERACTION#like#${targetId}`,
        GSI1PK: `INTERACTION#like#${targetId}`,
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
      } else {
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
      }

      console.log(`✅ Like added for ${targetType} ${targetId}`);
    } else {
      // Remove like
      await DynamoDBService.deleteUserInteraction(userId, "like", targetId);

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
      } else {
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
