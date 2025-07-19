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
    const rawCursor = event.queryStringParameters?.["cursor"];

    // Parse cursor: can be DynamoDB key or virtual offset cursor
    let lastEvaluatedKey: any = undefined;
    let virtualCursor: { type: string; skip: number } | undefined = undefined;

    if (rawCursor) {
      try {
        const decoded = JSON.parse(Buffer.from(rawCursor, "base64").toString());
        if (
          decoded &&
          typeof decoded === "object" &&
          decoded.type === "offset" &&
          typeof decoded.skip === "number"
        ) {
          virtualCursor = decoded;
        } else {
          lastEvaluatedKey = decoded;
        }
      } catch {
        // Invalid cursor falls back to undefineds
      }
    }

    // If filtering by isPublic, we need to fetch more albums to account for filtering
    const fetchLimit = isPublic !== undefined ? Math.max(limit * 3, 50) : limit;

    // Modified: Fetch in loop if filtering, ensure at least 'limit' filtered albums or fully exhausted
    let albums: Album[] = [];
    let filteredAlbums: Album[] = [];
    let nextKey = lastEvaluatedKey;
    let exhausted = false;
    const responseOffset = virtualCursor?.skip ?? 0;
    let responseCursor: string | null = null;
    let hasNext = false;

    if (isPublic !== undefined) {
      const isPublicBool = isPublic === "true";
      // Loop until we have enough filtered or exhausted DB (collect extra to cover offset+limit)
      while (filteredAlbums.length < responseOffset + limit && !exhausted) {
        const fetchRes = await DynamoDBService.listAlbums(fetchLimit, nextKey);
        albums = fetchRes.albums;
        nextKey = fetchRes.lastEvaluatedKey;

        // LOG: After each DynamoDB fetch in filtered mode
        const numPublic = albums.filter((a) => a.isPublic === true).length;
        const numPrivate = albums.length - numPublic;
        console.log(
          `[AlbumPagination] DynamoDB fetch (filtered): got ${
            albums.length
          } albums (public: ${numPublic}, private: ${numPrivate}). Filter criteria: isPublic=${isPublicBool}, fetchLimit=${fetchLimit}, cursor=${
            nextKey ? JSON.stringify(nextKey) : "null"
          }`
        );

        const justFiltered = albums.filter(
          (album) => album.isPublic === isPublicBool
        );
        filteredAlbums = [...filteredAlbums, ...justFiltered];

        // LOG: After filtering, cumulative count so far
        console.log(
          `[AlbumPagination] Cumulative filteredAlbums count after fetch: ${
            filteredAlbums.length
          } (looking for offset+limit=${responseOffset + limit})`
        );

        if (!nextKey || albums.length === 0) {
          exhausted = true;
          // LOG: Exiting fetch loop (exhausted)
          console.log(
            `[AlbumPagination] Fetch loop exhausted. Total filteredAlbums: ${filteredAlbums.length}.`
          );
          break;
        }

        if (filteredAlbums.length >= responseOffset + limit) {
          // LOG: Reached requested window, breaking
          console.log(
            `[AlbumPagination] Reached filteredAlbums offset+limit=${
              responseOffset + limit
            }. Total collected: ${filteredAlbums.length}.`
          );
          break;
        }
      }

      // Compute output window after offset
      filteredAlbums = filteredAlbums.slice(
        responseOffset,
        responseOffset + limit
      );

      // Decide on next cursor & hasNext
      if (!exhausted) {
        // Still more DB, so issue DynamoDB cursor
        hasNext = true;
        responseCursor = Buffer.from(JSON.stringify(nextKey)).toString(
          "base64"
        );
      } else {
        // DynamoDB exhausted, check if more filtered remain
        const totalFiltered = responseOffset + filteredAlbums.length;
        if (
          filteredAlbums.length === limit &&
          (filteredAlbums.length > 0 || responseOffset > 0)
        ) {
          // There may be more local filtered remaining; provide offset cursor if so
          hasNext = true;
          responseCursor = Buffer.from(
            JSON.stringify({
              type: "offset",
              skip: totalFiltered,
            })
          ).toString("base64");
        } else {
          hasNext = false;
          responseCursor = null;
        }
      }
    } else {
      // No filtering, normal flow (use DynamoDB native cursor)
      const fetchRes = await DynamoDBService.listAlbums(fetchLimit, nextKey);
      albums = fetchRes.albums;
      nextKey = fetchRes.lastEvaluatedKey;

      // LOG: After DynamoDB fetch in unfiltered mode
      const numPublic = albums.filter((a) => a.isPublic === true).length;
      const numPrivate = albums.length - numPublic;
      console.log(
        `[AlbumPagination] DynamoDB fetch (unfiltered): got ${
          albums.length
        } albums (public: ${numPublic}, private: ${numPrivate}). fetchLimit=${fetchLimit}, cursor=${
          nextKey ? JSON.stringify(nextKey) : "null"
        }`
      );

      // Support offset cursor for unfiltered path if needed (optional, for API uniformity)
      filteredAlbums = albums.slice(responseOffset, responseOffset + limit);
      if (nextKey) {
        hasNext = true;
        responseCursor = Buffer.from(JSON.stringify(nextKey)).toString(
          "base64"
        );
      } else if (filteredAlbums.length === limit) {
        // More local? (Unlikely in unfiltered path unless explicitly needed)
        hasNext = true;
        responseCursor = Buffer.from(
          JSON.stringify({
            type: "offset",
            skip: responseOffset + filteredAlbums.length,
          })
        ).toString("base64");
      } else {
        hasNext = false;
        responseCursor = null;
      }
      exhausted = !nextKey;
    }

    // LOG: Final summary before mapping to response
    console.log(
      `[AlbumPagination] Final count before response mapping: filteredAlbums=${filteredAlbums.length}, isPublic=${isPublic}, exhausted=${exhausted}, final cursor=${responseCursor}`
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
        // hasNext/cursor logic is now filter-aware, see above
        hasNext,
        cursor: responseCursor,
      },
    };

    // LOG: Outgoing response pagination details
    console.log(
      `[AlbumPagination] Outgoing response: albums=${albumsResponse.length}, hasNext=${response.pagination.hasNext}, cursor=${response.pagination.cursor}`
    );
    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return ResponseUtil.internalError(event, "Failed to fetch albums");
  }
};
