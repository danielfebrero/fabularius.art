import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { Album } from "@shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

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

    // Get all albums (including private ones) - admin view
    const { albums, lastEvaluatedKey: nextKey } =
      await DynamoDBService.listAlbums(limit, lastEvaluatedKey);

    const albumsResponse: Album[] = albums.map((album) => {
      const response: Album = {
        id: album.id,
        title: album.title,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        mediaCount: album.mediaCount,
        isPublic: album.isPublic === "true",
      };

      if (album.tags !== undefined) {
        response.tags = album.tags;
      }

      if (album.coverImageUrl !== undefined) {
        response.coverImageUrl = album.coverImageUrl;
      }

      if (album.thumbnailUrls !== undefined) {
        response.thumbnailUrls = album.thumbnailUrls;
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
      total: albumsResponse.length,
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Error fetching admin albums:", error);
    return ResponseUtil.internalError(event, "Failed to fetch albums");
  }
};
