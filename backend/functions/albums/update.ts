import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import { UpdateAlbumRequest } from "@shared/types";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { PlanUtil } from "@shared/utils/plan";

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
