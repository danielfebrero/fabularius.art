import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { PlanUtil } from "@shared/utils/plan";

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

    // Determine user context - check if admin authorizer or user authorizer
    let userId = event.requestContext.authorizer?.["userId"];
    let userRole = "user"; // default to user

    console.log("👤 UserId from authorizer:", userId);

    // If no userId from authorizer, try session-based validation
    if (!userId) {
      console.log(
        "⚠️ No userId from authorizer, falling back to session validation"
      );
      const validation = await UserAuthMiddleware.validateSession(event);

      if (!validation.isValid || !validation.user) {
        console.log("❌ Session validation failed");
        return ResponseUtil.unauthorized(event, "No user session found");
      }

      userId = validation.user.userId;
      console.log("✅ Got userId from session validation:", userId);

      // Check if user has admin privileges
      userRole = await PlanUtil.getUserRole(
        validation.user.userId,
        validation.user.email
      );
      console.log("✅ User role:", userRole);
    } else {
      // If userId came from authorizer, check if it's admin context
      // This would be set by admin authorizer vs user authorizer
      userRole = event.requestContext.authorizer?.["role"] || "user";
    }

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

    // Get all media in the album to delete them first
    const { media } = await DynamoDBService.listAlbumMedia(albumId, 1000);

    // Delete all media in the album
    if (media.length > 0) {
      const deleteMediaPromises = media.map((mediaItem) =>
        DynamoDBService.deleteMedia(mediaItem.id)
      );
      await Promise.all(deleteMediaPromises);

      // Clean up interactions for each media item
      const cleanupMediaPromises = media.map((mediaItem) =>
        DynamoDBService.deleteAllInteractionsForTarget(mediaItem.id)
      );
      await Promise.all(cleanupMediaPromises);
    }

    // Clean up interactions for the album itself
    await DynamoDBService.deleteAllInteractionsForTarget(albumId);

    // Delete the album
    await DynamoDBService.deleteAlbum(albumId);

    // Trigger revalidation
    await RevalidationService.revalidateAlbums();

    return ResponseUtil.success(event, {
      message: "Album and all associated media deleted successfully",
      deletedAlbumId: albumId,
      deletedMediaCount: media.length,
    });
  } catch (error) {
    console.error("Error deleting album:", error);
    return ResponseUtil.internalError(event, "Failed to delete album");
  }
};
