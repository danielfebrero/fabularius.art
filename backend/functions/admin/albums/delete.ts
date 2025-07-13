import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { ResponseUtil } from "../../../shared/utils/response";

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

    // Check if album exists
    const existingAlbum = await DynamoDBService.getAlbum(albumId);
    if (!existingAlbum) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    // Get all media in the album to delete them first
    const { media } = await DynamoDBService.listAlbumMedia(albumId, 1000);

    // Delete all media in the album
    if (media.length > 0) {
      const deleteMediaPromises = media.map((mediaItem) =>
        DynamoDBService.deleteMedia(albumId, mediaItem.id)
      );
      await Promise.all(deleteMediaPromises);
    }

    // Delete the album
    await DynamoDBService.deleteAlbum(albumId);

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
