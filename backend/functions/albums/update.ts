import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import { UpdateAlbumRequest } from "@shared/types";
import { UserAuthUtil } from "@shared/utils/user-auth";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS requests immediately before importing any heavy dependencies
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  // Import heavy dependencies only when needed (after OPTIONS check)
  const { DynamoDBService } = await import("@shared/utils/dynamodb");
  const { CoverThumbnailUtil } = await import("@shared/utils/cover-thumbnail");

  try {
    const albumId = event.pathParameters?.["albumId"];
    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
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

    const request: UpdateAlbumRequest = JSON.parse(event.body);

    // Validate request
    if (request.title !== undefined && request.title.trim().length === 0) {
      return ResponseUtil.badRequest(event, "Album title cannot be empty");
    }

    // Check if album exists
    const existingAlbum = await DynamoDBService.getAlbum(albumId);
    if (!existingAlbum) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    // Check if user owns the album (or is admin)
    if (existingAlbum.createdBy !== userId && userRole !== "admin") {
      return ResponseUtil.forbidden(event, "You can only edit your own albums");
    }

    // Prepare updates
    const updates: Partial<typeof existingAlbum> = {
      updatedAt: new Date().toISOString(),
    };

    if (request.title !== undefined) {
      updates.title = request.title.trim();
    }

    if (request.tags !== undefined) {
      updates.tags = request.tags;
    }

    if (request.isPublic !== undefined) {
      updates.isPublic = request.isPublic.toString();
    }

    if (request.coverImageUrl !== undefined) {
      updates.coverImageUrl = request.coverImageUrl;

      // Generate thumbnails when cover image is updated
      if (request.coverImageUrl) {
        const thumbnailUrls =
          await CoverThumbnailUtil.processCoverImageThumbnails(
            request.coverImageUrl,
            albumId
          );

        if (thumbnailUrls) {
          // Add thumbnailUrls to the updates
          updates.thumbnailUrls = thumbnailUrls;
        } else {
          console.warn(
            `Failed to generate thumbnails for album ${albumId}, continuing without them`
          );
        }
      } else {
        // If coverImageUrl is being cleared, also clear thumbnailUrls
        updates.thumbnailUrls = undefined;
      }
    }

    // Update album
    await DynamoDBService.updateAlbum(albumId, updates);

    // Get updated album
    const updatedAlbum = await DynamoDBService.getAlbum(albumId);
    if (!updatedAlbum) {
      return ResponseUtil.internalError(
        event,
        "Failed to retrieve updated album"
      );
    }

    const response = {
      id: updatedAlbum.id,
      title: updatedAlbum.title,
      tags: updatedAlbum.tags,
      coverImageUrl: updatedAlbum.coverImageUrl,
      thumbnailUrls: updatedAlbum.thumbnailUrls,
      createdAt: updatedAlbum.createdAt,
      updatedAt: updatedAlbum.updatedAt,
      mediaCount: updatedAlbum.mediaCount,
      isPublic: updatedAlbum.isPublic === "true",
    };

    // Trigger revalidation
    await RevalidationService.revalidateAlbum(albumId);

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Error updating album:", error);
    return ResponseUtil.internalError(event, "Failed to update album");
  }
};
