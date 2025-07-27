import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import { UpdateAlbumRequest } from "@shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle OPTIONS requests immediately before importing any heavy dependencies
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  // Import heavy dependencies only when needed (after OPTIONS check)
  const { DynamoDBService } = await import("@shared/utils/dynamodb");
  const { S3Service } = await import("@shared/utils/s3");
  const { ThumbnailService } = await import("@shared/utils/thumbnail");

  try {
    const albumId = event.pathParameters?.["albumId"];
    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    // Get user from authorizer context
    const userId = event.requestContext.authorizer?.["userId"];
    if (!userId) {
      return ResponseUtil.unauthorized(event, "User authentication required");
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

    // Check if user owns the album
    if (existingAlbum.createdBy !== userId) {
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
        try {
          console.log(
            `Generating thumbnails for album ${albumId} cover image: ${request.coverImageUrl}`
          );

          // Extract S3 key from URL
          const s3Key = S3Service.extractKeyFromUrl(request.coverImageUrl);
          if (!s3Key) {
            console.warn(
              `Could not extract S3 key from URL: ${request.coverImageUrl}`
            );
          } else {
            // Download cover image from S3
            const coverImageBuffer = await S3Service.downloadBuffer(s3Key);

            // Determine content type from URL extension or use default
            const contentType =
              s3Key.toLowerCase().endsWith(".jpg") ||
              s3Key.toLowerCase().endsWith(".jpeg")
                ? "image/jpeg"
                : s3Key.toLowerCase().endsWith(".png")
                ? "image/png"
                : s3Key.toLowerCase().endsWith(".webp")
                ? "image/webp"
                : "image/jpeg"; // default

            // Generate thumbnails using ThumbnailService
            const thumbnailUrls =
              await ThumbnailService.generateAlbumCoverThumbnails(
                coverImageBuffer,
                albumId,
                contentType
              );

            // Add thumbnailUrls to the updates
            updates.thumbnailUrls = thumbnailUrls;

            console.log(
              `Successfully generated ${
                Object.keys(thumbnailUrls).length
              } thumbnail sizes for album ${albumId}`
            );
          }
        } catch (error) {
          // Log error but don't block the update - graceful failure
          console.error(
            `Failed to generate thumbnails for album ${albumId}:`,
            error
          );
          console.log(`Continuing with album update without thumbnails`);
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
