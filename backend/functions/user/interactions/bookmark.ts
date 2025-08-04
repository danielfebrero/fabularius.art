import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { ResponseUtil } from "@shared/utils/response";
import { InteractionRequest, UserInteractionEntity } from "@shared/types/user";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Bookmark/Unbookmark function called");
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
      // For media, verify it exists - no albumId needed in new schema
      const media = await DynamoDBService.getMedia(targetId);
      if (!media) {
        return ResponseUtil.notFound(event, "Media not found");
      }
    }

    const now = new Date().toISOString();

    if (action === "add") {
      // Check if already bookmarked
      const existingBookmark = await DynamoDBService.getUserInteraction(
        user.userId,
        "bookmark",
        targetId
      );

      if (existingBookmark) {
        return ResponseUtil.error(event, "Already bookmarked", 409);
      }

      // Create bookmark interaction
      const interaction: UserInteractionEntity = {
        PK: `USER#${user.userId}`,
        SK: `INTERACTION#bookmark#${targetId}`,
        GSI1PK: `INTERACTION#bookmark#${targetId}`,
        GSI1SK: user.userId,
        EntityType: "UserInteraction",
        userId: user.userId,
        interactionType: "bookmark",
        targetType,
        targetId,
        createdAt: now,
      };

      await DynamoDBService.createUserInteraction(interaction);

      // Increment bookmark count for the target
      if (targetType === "album") {
        await DynamoDBService.incrementAlbumBookmarkCount(targetId, 1);

        // Get album creator and increment their totalBookmarksReceived metric
        const album = await DynamoDBService.getAlbum(targetId);
        if (album?.createdBy) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              album.createdBy,
              "totalBookmarksReceived"
            );
            console.log(
              `📈 Incremented totalBookmarksReceived for album creator: ${album.createdBy}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to increment totalBookmarksReceived for user ${album.createdBy}:`,
              error
            );
          }
        }
      } else {
        await DynamoDBService.incrementMediaBookmarkCount(targetId, 1);

        // Get media creator and increment their totalBookmarksReceived metric
        const media = await DynamoDBService.getMedia(targetId);
        if (media?.createdBy) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              media.createdBy,
              "totalBookmarksReceived"
            );
            console.log(
              `📈 Incremented totalBookmarksReceived for media creator: ${media.createdBy}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to increment totalBookmarksReceived for user ${media.createdBy}:`,
              error
            );
          }
        }
      }

      return ResponseUtil.created(event, {
        userId: user.userId,
        interactionType: "bookmark",
        targetType,
        targetId,
        createdAt: now,
      });
    } else {
      // Remove bookmark
      await DynamoDBService.deleteUserInteraction(
        user.userId,
        "bookmark",
        targetId
      );

      // Decrement bookmark count for the target
      if (targetType === "album") {
        await DynamoDBService.incrementAlbumBookmarkCount(targetId, -1);

        // Get album creator and decrement their totalBookmarksReceived metric
        const album = await DynamoDBService.getAlbum(targetId);
        if (album?.createdBy) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              album.createdBy,
              "totalBookmarksReceived",
              -1
            );
            console.log(
              `📉 Decremented totalBookmarksReceived for album creator: ${album.createdBy}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to decrement totalBookmarksReceived for user ${album.createdBy}:`,
              error
            );
          }
        }
      } else {
        await DynamoDBService.incrementMediaBookmarkCount(targetId, -1);

        // Get media creator and decrement their totalBookmarksReceived metric
        const media = await DynamoDBService.getMedia(targetId);
        if (media?.createdBy) {
          try {
            await DynamoDBService.incrementUserProfileMetric(
              media.createdBy,
              "totalBookmarksReceived",
              -1
            );
            console.log(
              `📉 Decremented totalBookmarksReceived for media creator: ${media.createdBy}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Failed to decrement totalBookmarksReceived for user ${media.createdBy}:`,
              error
            );
          }
        }
      }

      return ResponseUtil.success(event, {
        userId: user.userId,
        interactionType: "bookmark",
        targetType,
        targetId,
        action: "removed",
      });
    }
  } catch (error) {
    console.error("❌ Error in bookmark function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
