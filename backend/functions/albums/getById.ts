import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const albumId = event.pathParameters?.["albumId"];

    if (!albumId) {
      return ResponseUtil.badRequest(event, "Album ID is required");
    }

    const album = await DynamoDBService.getAlbumForAPI(albumId);

    if (!album) {
      return ResponseUtil.notFound(event, "Album not found");
    }

    return ResponseUtil.success(event, album);
  } catch (error) {
    console.error("Error fetching album:", error);
    return ResponseUtil.internalError(event, "Failed to fetch album");
  }
};
