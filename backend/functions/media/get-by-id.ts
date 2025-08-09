import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { Comment } from "@shared";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    const mediaId = event.pathParameters?.["mediaId"];

    if (!mediaId) {
      return ResponseUtil.badRequest(event, "Media ID is required");
    }

    // Find media by ID using GSI2
    const mediaEntity = await DynamoDBService.findMediaById(mediaId);

    if (!mediaEntity) {
      return ResponseUtil.notFound(event, "Media not found");
    }

    // Convert to response format
    // Convert MediaEntity to Media using shared helper
    const mediaResponse =
      DynamoDBService.convertMediaEntityToMedia(mediaEntity);

    // Fetch creator username if createdBy exists
    if (mediaEntity.createdBy) {
      try {
        let creator = null;

        // Try to get user by ID first (new unified system)
        creator = await DynamoDBService.getUserById(mediaEntity.createdBy);

        if (creator && creator.username) {
          // Add creator information to metadata if it doesn't exist
          if (!mediaResponse.metadata) {
            mediaResponse.metadata = {};
          }
          mediaResponse.metadata["creatorUsername"] = creator.username;
        }
      } catch (error) {
        console.error("Failed to fetch creator info:", error);
        // Don't fail the request if creator info can't be fetched
      }
    }

    // Fetch albums containing this media
    try {
      const albums = await DynamoDBService.getAlbumsForMedia(mediaId);
      if (albums.length > 0) {
        mediaResponse.albums = albums.filter((album) => album.isPublic);
      }
    } catch (error) {
      console.error("Failed to fetch albums for media:", error);
      // Don't fail the request if albums can't be fetched
    }

    // Fetch comments for this media
    try {
      const commentsResult = await DynamoDBService.getCommentsForTarget(
        "media",
        mediaId,
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

      // Add comments to media response
      (mediaResponse as any).comments = comments;
    } catch (error) {
      console.error("Failed to fetch comments for media:", error);
      // Don't fail the request if comments can't be fetched
      (mediaResponse as any).comments = [];
    }

    return ResponseUtil.success(event, mediaResponse);
  } catch (error) {
    console.error("Error fetching media by ID:", error);
    return ResponseUtil.internalError(event, "Failed to fetch media");
  }
};
