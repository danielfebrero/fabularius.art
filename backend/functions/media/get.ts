import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { Media } from "@shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const albumId = event.pathParameters?.["albumId"];

    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    // Verify album exists
    const album = await DynamoDBService.getAlbum(albumId);
    if (!album) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    const limit = parseInt(event.queryStringParameters?.["limit"] || "50");
    const lastEvaluatedKey = event.queryStringParameters?.["cursor"]
      ? JSON.parse(
          Buffer.from(
            event.queryStringParameters["cursor"],
            "base64"
          ).toString()
        )
      : undefined;

    const { media, lastEvaluatedKey: nextKey } =
      await DynamoDBService.listAlbumMedia(albumId, limit, lastEvaluatedKey);

    const mediaResponse: Media[] = media.map((item) => {
      const response: Media = {
        id: item.id,
        albumId: item.albumId,
        filename: item.filename,
        originalFilename: item.originalFilename,
        mimeType: item.mimeType,
        size: item.size,
        url: item.url,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };

      if (item.width !== undefined) {
        response.width = item.width;
      }

      if (item.height !== undefined) {
        response.height = item.height;
      }

      if (item.thumbnailUrl !== undefined) {
        response.thumbnailUrl = item.thumbnailUrl;
      }

      if (item.thumbnailUrls !== undefined) {
        response.thumbnailUrls = item.thumbnailUrls;
      }

      if (item.metadata !== undefined) {
        response.metadata = item.metadata;
      }

      return response;
    });

    const response = {
      media: mediaResponse,
      pagination: {
        hasNext: !!nextKey,
        cursor: nextKey
          ? Buffer.from(JSON.stringify(nextKey)).toString("base64")
          : null,
      },
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Error fetching media:", error);
    return ResponseUtil.internalError(event, "Failed to fetch media");
  }
};
