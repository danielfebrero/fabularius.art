import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "../../shared/utils/dynamodb";
import { ResponseUtil } from "../../shared/utils/response";
import { Album } from "../../shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const limit = parseInt(event.queryStringParameters?.["limit"] || "20");
    const isPublic = event.queryStringParameters?.["isPublic"];
    const lastEvaluatedKey = event.queryStringParameters?.["cursor"]
      ? JSON.parse(
          Buffer.from(
            event.queryStringParameters["cursor"],
            "base64"
          ).toString()
        )
      : undefined;

    // If filtering by isPublic, we need to fetch more albums to account for filtering
    const fetchLimit = isPublic !== undefined ? Math.max(limit * 3, 50) : limit;

    // Modified: Fetch in loop if filtering, ensure at least 'limit' filtered albums or fully exhausted
    let albums: Album[] = [];
    let filteredAlbums: Album[] = [];
    let nextKey = lastEvaluatedKey;
    let exhausted = false;

    if (isPublic !== undefined) {
      const isPublicBool = isPublic === "true";
      // Loop until we have enough filtered or exhausted DB
      while (filteredAlbums.length < limit && !exhausted) {
        const fetchRes = await DynamoDBService.listAlbums(fetchLimit, nextKey);
        albums = fetchRes.albums;
        nextKey = fetchRes.lastEvaluatedKey;

        const justFiltered = albums.filter(
          (album) => album.isPublic === isPublicBool
        );
        filteredAlbums = [...filteredAlbums, ...justFiltered];

        if (!nextKey || albums.length === 0) {
          exhausted = true;
          break;
        }
      }
      filteredAlbums = filteredAlbums.slice(0, limit);
    } else {
      // No filtering, normal flow
      const fetchRes = await DynamoDBService.listAlbums(fetchLimit, nextKey);
      albums = fetchRes.albums;
      nextKey = fetchRes.lastEvaluatedKey;
      filteredAlbums = albums.slice(0, limit);
      // No further fetch required
      exhausted = !nextKey;
    }

    console.log(
      `Fetched ${albums.length} albums, filtered to ${filteredAlbums.length} albums (isPublic: ${isPublic})`
    );

    const albumsResponse: Album[] = filteredAlbums.map((album) => {
      const response: Album = {
        id: album.id,
        title: album.title,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        mediaCount: album.mediaCount,
        isPublic: album.isPublic,
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
        // Only hasNext if we truly exhausted all and there is a nextKey
        hasNext:
          isPublic !== undefined
            ? !exhausted || (filteredAlbums.length === limit && !!nextKey)
            : !!nextKey,
        cursor: nextKey
          ? Buffer.from(JSON.stringify(nextKey)).toString("base64")
          : null,
      },
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return ResponseUtil.internalError(event, "Failed to fetch albums");
  }
};
