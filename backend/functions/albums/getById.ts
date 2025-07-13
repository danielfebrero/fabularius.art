import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "../../shared/utils/dynamodb";
import { ResponseUtil } from "../../shared/utils/response";
import { Album } from "../../shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const albumId = event.pathParameters?.["albumId"];

    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    const albumEntity = await DynamoDBService.getAlbum(albumId);

    if (!albumEntity) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    const album: Album = {
      id: albumEntity.id,
      title: albumEntity.title,
      createdAt: albumEntity.createdAt,
      updatedAt: albumEntity.updatedAt,
      mediaCount: albumEntity.mediaCount,
      isPublic: albumEntity.isPublic,
    };

    if (albumEntity.tags !== undefined) {
      album.tags = albumEntity.tags;
    }

    if (albumEntity.coverImageUrl !== undefined) {
      album.coverImageUrl = albumEntity.coverImageUrl;
    }

    return ResponseUtil.success(event, album);
  } catch (error) {
    console.error("Error fetching album:", error);
    return ResponseUtil.internalError(event, "Failed to fetch album");
  }
};
