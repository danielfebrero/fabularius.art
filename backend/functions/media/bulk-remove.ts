import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import { RemoveMediaFromAlbumRequest } from "@shared";
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

    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    // Extract user authentication using centralized utility
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

    // Verify album exists and check ownership
    const album = await DynamoDBService.getAlbum(albumId);
    if (!album) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    // Check if user owns this album or has admin privileges
    const isOwner = album.createdBy === userId;
    const isAdmin = userRole === "admin" || userRole === "moderator";

    if (!isOwner && !isAdmin) {
      console.log("❌ User does not own album and is not admin:", {
        userId,
        albumCreatedBy: album.createdBy,
        userRole,
      });
      return ResponseUtil.forbidden(
        event,
        "Access denied: You can only remove media from your own albums"
      );
    }

    console.log("✅ User authorized to remove media from album:", {
      isOwner,
      isAdmin,
      userRole,
    });

    const request: RemoveMediaFromAlbumRequest = JSON.parse(event.body);

    // Validate request structure
    if (!request.mediaIds || !Array.isArray(request.mediaIds)) {
      return ResponseUtil.badRequest(
        event,
        "mediaIds must be provided as an array"
      );
    }

    if (request.mediaIds.length === 0) {
      return ResponseUtil.badRequest(event, "mediaIds array cannot be empty");
    }

    // Validate that all media IDs are strings
    if (
      !request.mediaIds.every(
        (id) => typeof id === "string" && id.trim().length > 0
      )
    ) {
      return ResponseUtil.badRequest(
        event,
        "All media IDs must be non-empty strings"
      );
    }

    // Limit the number of media items that can be removed in one request to avoid timeouts
    const MAX_BULK_REMOVE_SIZE = 50;
    if (request.mediaIds.length > MAX_BULK_REMOVE_SIZE) {
      return ResponseUtil.badRequest(
        event,
        `Cannot remove more than ${MAX_BULK_REMOVE_SIZE} media items at once. Please split into smaller batches.`
      );
    }

    try {
      const results = await DynamoDBService.bulkRemoveMediaFromAlbum(
        albumId,
        request.mediaIds
      );

      // Revalidate only if some media was successfully removed
      if (results.successful.length > 0) {
        await RevalidationService.revalidateAlbum(albumId);
      }

      return ResponseUtil.success(event, {
        success: true,
        message:
          results.failed.length === 0
            ? `All ${results.successful.length} media items removed from album successfully`
            : `${results.successful.length} media items removed successfully, ${results.failed.length} failed`,
        results: {
          successfullyRemoved: results.successful,
          failedRemovals: results.failed,
          totalProcessed: results.totalProcessed,
          successCount: results.successful.length,
          failureCount: results.failed.length,
        },
        albumId,
      });
    } catch (error: any) {
      console.error("Error in bulk remove media from album:", error);
      if (error.message?.includes("not found")) {
        return ResponseUtil.notFound(event, error.message);
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to bulk remove media from album:", error);
    return ResponseUtil.internalError(
      event,
      "Failed to bulk remove media from album"
    );
  }
};
