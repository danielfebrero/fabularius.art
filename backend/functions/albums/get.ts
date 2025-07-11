import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "../../shared/utils/dynamodb";
import { ResponseUtil } from "../../shared/utils/response";
import { Album } from "../../shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const limit = parseInt(event.queryStringParameters?.["limit"] || "20");
    const lastEvaluatedKey = event.queryStringParameters?.["cursor"]
      ? JSON.parse(
          Buffer.from(
            event.queryStringParameters["cursor"],
            "base64"
          ).toString()
        )
      : undefined;

    const { albums, lastEvaluatedKey: nextKey } =
      await DynamoDBService.listAlbums(limit, lastEvaluatedKey);

    const albumsResponse: Album[] = albums.map((album) => {
      const response: Album = {
        id: album.id,
        title: album.title,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        mediaCount: album.mediaCount,
        isPublic: album.isPublic,
      };

      if (album.description !== undefined) {
        response.description = album.description;
      }

      if (album.coverImageUrl !== undefined) {
        response.coverImageUrl = album.coverImageUrl;
      }

      return response;
    });

    const response = {
      albums: albumsResponse,
      pagination: {
        hasNext: !!nextKey,
        cursor: nextKey
          ? Buffer.from(JSON.stringify(nextKey)).toString("base64")
          : null,
      },
    };

    return ResponseUtil.success(response);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return ResponseUtil.internalError("Failed to fetch albums");
  }
};
