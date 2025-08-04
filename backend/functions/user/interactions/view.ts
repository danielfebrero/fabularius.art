import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 View tracking function called");
  console.log("📝 Event:", JSON.stringify(event, null, 2));

  try {
    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
      return ResponseUtil.noContent(event);
    }

    // Parse request body
    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const body = JSON.parse(event.body);
    const { targetType, targetId } = body;

    // Validate input
    if (!targetType || !targetId) {
      return ResponseUtil.badRequest(
        event,
        "targetType and targetId are required"
      );
    }

    if (!["album", "media", "profile"].includes(targetType)) {
      return ResponseUtil.badRequest(
        event,
        "targetType must be 'album', 'media', or 'profile'"
      );
    }

    // Verify target exists and increment appropriate counters
    if (targetType === "album") {
      const album = await DynamoDBService.getAlbum(targetId);
      if (!album) {
        return ResponseUtil.notFound(event, "Album not found");
      }

      // Increment view count for album
      await DynamoDBService.incrementAlbumViewCount(targetId, 1);

      // Increment creator's totalMediaViews metric
      if (album.createdBy) {
        try {
          await DynamoDBService.incrementUserProfileMetric(
            album.createdBy,
            "totalMediaViews"
          );
          console.log(
            `📈 Incremented totalMediaViews for album creator: ${album.createdBy}`
          );
        } catch (error) {
          console.warn(
            `⚠️ Failed to increment totalMediaViews for user ${album.createdBy}:`,
            error
          );
        }
      }
    } else if (targetType === "media") {
      // For media, verify it exists - no album context needed in new schema
      const media = await DynamoDBService.getMedia(targetId);
      if (!media) {
        return ResponseUtil.notFound(event, "Media not found");
      }

      // Increment view count for media
      await DynamoDBService.incrementMediaViewCount(targetId, 1);

      // Increment creator's totalMediaViews metric
      if (media.createdBy) {
        try {
          await DynamoDBService.incrementUserProfileMetric(
            media.createdBy,
            "totalMediaViews"
          );
          console.log(
            `📈 Incremented totalMediaViews for media creator: ${media.createdBy}`
          );
        } catch (error) {
          console.warn(
            `⚠️ Failed to increment totalMediaViews for user ${media.createdBy}:`,
            error
          );
        }
      }
    } else if (targetType === "profile") {
      // For profile views, targetId should be the username
      const username = targetId;

      // Get user by username to verify profile exists
      const profileUser = await DynamoDBService.getUserByUsername(username);
      if (!profileUser) {
        return ResponseUtil.notFound(event, "Profile not found");
      }

      // Increment profile view count for the profile owner
      try {
        await DynamoDBService.incrementUserProfileMetric(
          profileUser.userId,
          "totalProfileViews"
        );
        console.log(
          `📈 Incremented totalProfileViews for user: ${profileUser.userId} (${username})`
        );
      } catch (error) {
        console.warn(
          `⚠️ Failed to increment totalProfileViews for user ${profileUser.userId}:`,
          error
        );
        // Don't fail the entire request if profile view tracking fails
      }
    }

    return ResponseUtil.success(event, {
      targetType,
      targetId,
      action: "view_recorded",
    });
  } catch (error) {
    console.error("❌ Error in view function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
