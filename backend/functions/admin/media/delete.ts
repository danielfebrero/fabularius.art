import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { S3Service } from "@shared/utils/s3";
import { RevalidationService } from "@shared/utils/revalidation";

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

    // Check if album exists
    const existingAlbum = await DynamoDBService.getAlbum(albumId);
    if (!existingAlbum) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    // Check if media exists
    const existingMedia = await DynamoDBService.getMedia(albumId, mediaId);
    if (!existingMedia) {
      return ResponseUtil.notFound(event, "Media not found");
    }

    // Delete the media
    // Delete S3 object
    await S3Service.deleteObject(existingMedia.filename);

    // Clean up interactions for this media
    await DynamoDBService.deleteAllInteractionsForTarget(mediaId);

    // Delete the media record from DynamoDB
    await DynamoDBService.deleteMedia(albumId, mediaId);

    // Decrement album media count
    await DynamoDBService.decrementAlbumMediaCount(albumId);

    // Trigger revalidation
    await RevalidationService.revalidateAlbumMedia(albumId);

    return ResponseUtil.success(event, {
      message: "Media deleted successfully",
      deletedMediaId: mediaId,
      albumId: albumId,
    });
  } catch (error) {
    console.error("Error deleting media:", error);
    return ResponseUtil.internalError(event, "Failed to delete media");
  }
};
