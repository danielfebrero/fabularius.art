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

    if (!["album", "media"].includes(targetType)) {
      return ResponseUtil.badRequest(
        event,
        "targetType must be 'album' or 'media'"
      );
    }

    // Verify target exists
    if (targetType === "album") {
      const album = await DynamoDBService.getAlbum(targetId);
      if (!album) {
        return ResponseUtil.notFound(event, "Album not found");
      }

      // Increment view count for album
      await DynamoDBService.incrementAlbumViewCount(targetId, 1);
    } else {
      // For media, verify it exists - no album context needed in new schema
      const media = await DynamoDBService.getMedia(targetId);
      if (!media) {
        return ResponseUtil.notFound(event, "Media not found");
      }

      // For now, we only track album views
      // TODO: Add media view tracking if needed
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
