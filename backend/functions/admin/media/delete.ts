import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { ResponseUtil } from "../../../shared/utils/response";
import { AuthMiddleware } from "../auth/middleware";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate admin session
    const validation = await AuthMiddleware.validateSession(event);
    if (!validation.isValid) {
      return ResponseUtil.unauthorized("Invalid or expired session");
    }

    const albumId = event.pathParameters?.["albumId"];
    const mediaId = event.pathParameters?.["mediaId"];

    if (!albumId) {
      return ResponseUtil.badRequest("Album ID is required");
    }

    if (!mediaId) {
      return ResponseUtil.badRequest("Media ID is required");
    }

    // Check if album exists
    const existingAlbum = await DynamoDBService.getAlbum(albumId);
    if (!existingAlbum) {
      return ResponseUtil.notFound("Album not found");
    }

    // Check if media exists
    const existingMedia = await DynamoDBService.getMedia(albumId, mediaId);
    if (!existingMedia) {
      return ResponseUtil.notFound("Media not found");
    }

    // Delete the media
    await DynamoDBService.deleteMedia(albumId, mediaId);

    // Decrement album media count
    await DynamoDBService.decrementAlbumMediaCount(albumId);

    return ResponseUtil.success({
      message: "Media deleted successfully",
      deletedMediaId: mediaId,
      albumId: albumId,
    });
  } catch (error) {
    console.error("Error deleting media:", error);
    return ResponseUtil.internalError("Failed to delete media");
  }
};
