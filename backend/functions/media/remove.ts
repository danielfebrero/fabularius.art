import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { UserAuthUtil } from "@shared/utils/user-auth";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    const albumId = event.pathParameters?.["albumId"];
    const mediaId = event.pathParameters?.["mediaId"];

    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    if (!mediaId) {
      return ResponseUtil.badRequest(event, "Media ID is required");
    }

    // Extract user authentication using centralized utility
    const authResult = await UserAuthUtil.requireAuth(event);

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      return authResult;
    }

    const userId = authResult.userId!;
    console.log("✅ Authenticated user:", userId);

    // Check if album exists
    const existingAlbum = await DynamoDBService.getAlbum(albumId);
    if (!existingAlbum) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    // Check if user owns the album
    if (existingAlbum.createdBy !== userId) {
      return ResponseUtil.forbidden(event, "You can only edit your own albums");
    }

    // Check if media exists
    const existingMedia = await DynamoDBService.getMedia(mediaId);
    if (!existingMedia) {
      return ResponseUtil.notFound(event, "Media not found");
    }

    // Remove media from album
    await DynamoDBService.removeMediaFromAlbum(albumId, mediaId);

    return ResponseUtil.success(event, {
      message: "Media removed from album successfully",
      albumId,
      mediaId,
    });
  } catch (error) {
    console.error("Failed to remove media from album:", error);
    return ResponseUtil.error(event, "Failed to remove media from album");
  }
};
