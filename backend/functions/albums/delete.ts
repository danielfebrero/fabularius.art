import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import { UserAuthUtil } from "@shared/utils/user-auth";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    const albumId = event.pathParameters?.["albumId"];
    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    // Extract user authentication with role information using centralized utility
    const authResult = await UserAuthUtil.requireAuth(event, {
      includeRole: true,
    });

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      return authResult;
    }

    const userId = authResult.userId!;
    const userRole = authResult.userRole || "user";

    console.log("✅ Authenticated user:", userId);
    console.log("🎭 User role:", userRole);

    // Check if album exists
    const existingAlbum = await DynamoDBService.getAlbum(albumId);
    if (!existingAlbum) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    // Check if user owns the album (or is admin)
    if (existingAlbum.createdBy !== userId && userRole !== "admin") {
      return ResponseUtil.forbidden(
        event,
        "You can only delete your own albums"
      );
    }

    // Get all media in the album to remove them from the album (not delete them)
    const { media } = await DynamoDBService.listAlbumMedia(albumId, 1000);

    // Remove all media from the album (don't delete the media itself)
    if (media.length > 0) {
      const removeMediaPromises = media.map((mediaItem) =>
        DynamoDBService.removeMediaFromAlbum(albumId, mediaItem.id)
      );
      await Promise.all(removeMediaPromises);
    }

    // Delete all comments for the album (this also deletes likes on those comments)
    await DynamoDBService.deleteAllCommentsForTarget(albumId);

    // Clean up interactions (likes/bookmarks) for the album itself
    await DynamoDBService.deleteAllInteractionsForTarget(albumId);

    // Delete the album
    await DynamoDBService.deleteAlbum(albumId);

    // Decrement user's totalAlbums metric
    if (existingAlbum.createdBy) {
      try {
        await DynamoDBService.incrementUserProfileMetric(
          existingAlbum.createdBy,
          "totalAlbums",
          -1
        );
        console.log(
          `📉 Decremented totalAlbums for user: ${existingAlbum.createdBy}`
        );
      } catch (error) {
        console.warn(
          `⚠️ Failed to decrement totalAlbums for user ${existingAlbum.createdBy}:`,
          error
        );
      }
    }

    // Trigger revalidation
    await RevalidationService.revalidateAlbums();

    return ResponseUtil.success(event, {
      message:
        "Album deleted successfully, media removed from album but preserved",
      deletedAlbumId: albumId,
      removedMediaCount: media.length,
    });
  } catch (error) {
    console.error("Error deleting album:", error);
    return ResponseUtil.internalError(event, "Failed to delete album");
  }
};
