import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { Comment } from "@shared";

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

    // Fetch comments for this album
    try {
      const commentsResult = await DynamoDBService.getCommentsForTarget(
        "album",
        albumId,
        20
      );
      const comments: Comment[] = commentsResult.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        targetType: comment.targetType,
        targetId: comment.targetId,
        userId: comment.userId,
        username: comment.username || "",
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        likeCount: comment.likeCount || 0,
        isEdited: comment.isEdited || false,
      }));

      // Add comments to album response
      (album as any).comments = comments;
    } catch (error) {
      console.error("Failed to fetch comments for album:", error);
      // Don't fail the request if comments can't be fetched
      (album as any).comments = [];
    }

    return ResponseUtil.success(event, album);
  } catch (error) {
    console.error("Error fetching album:", error);
    return ResponseUtil.internalError(event, "Failed to fetch album");
  }
};
