import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { Comment } from "@shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Get comments function called");
  console.log("📝 Event:", JSON.stringify(event, null, 2));

  try {
    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
      return ResponseUtil.noContent(event);
    }

    // Get parameters from path and query string
    const targetType = event.pathParameters?.["targetType"];
    const targetId = event.pathParameters?.["targetId"];
    const queryParams = event.queryStringParameters || {};
    const userParam = queryParams["user"]; // New: support user parameter

    // Check if this is a user-based query (when user param is provided)
    if (userParam) {
      return await getUserComments(event, userParam);
    }

    // Original target-based comments functionality
    if (!targetType || !targetId) {
      return ResponseUtil.badRequest(
        event,
        "targetType and targetId are required"
      );
    }

    if (!["album", "media"].includes(targetType)) {
      return ResponseUtil.badRequest(
        event,
        "targetType must be 'album' or 'media'"
      );
    }

    // Verify target exists
    if (targetType === "album") {
      const album = await DynamoDBService.getAlbum(targetId);
      if (!album) {
        return ResponseUtil.notFound(event, "Album not found");
      }
    } else {
      const media = await DynamoDBService.getMedia(targetId);
      if (!media) {
        return ResponseUtil.notFound(event, "Media not found");
      }
    }

    // Get pagination parameters
    const limit = parseInt(queryParams["limit"] || "20");
    const cursor = queryParams["cursor"];

    let lastEvaluatedKey: Record<string, any> | undefined;
    if (cursor) {
      try {
        lastEvaluatedKey = JSON.parse(Buffer.from(cursor, "base64").toString());
      } catch (error) {
        return ResponseUtil.badRequest(event, "Invalid cursor format");
      }
    }

    // Get comments for the target
    const result = await DynamoDBService.getCommentsForTarget(
      targetType as "album" | "media",
      targetId,
      limit,
      lastEvaluatedKey
    );

    // Convert CommentEntity to Comment format
    const comments: Comment[] = result.comments.map((comment) => ({
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

    // Prepare response
    const response: any = {
      success: true,
      data: {
        comments,
        pagination: {
          limit,
          hasNext: !!result.lastEvaluatedKey,
        },
      },
    };

    // Add cursor for next page if there are more results
    if (result.lastEvaluatedKey) {
      response.data.pagination.cursor = Buffer.from(
        JSON.stringify(result.lastEvaluatedKey)
      ).toString("base64");
    }

    console.log(
      `✅ Retrieved ${comments.length} comments for ${targetType} ${targetId}`
    );

    return ResponseUtil.success(event, response.data);
  } catch (error) {
    console.error("❌ Error in get comments function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};

// Helper function to get comments by user
async function getUserComments(
  event: APIGatewayProxyEvent,
  targetUsername: string
): Promise<APIGatewayProxyResult> {
  try {
    // Look up the target user by username
    const targetUser = await DynamoDBService.getUserByUsername(targetUsername);
    if (!targetUser) {
      return ResponseUtil.notFound(event, "User not found");
    }

    const targetUserId = targetUser.userId;

    // Get pagination parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams["page"] || "1");
    const limit = Math.min(parseInt(queryParams["limit"] || "20"), 100);

    // Calculate offset for pagination
    const lastEvaluatedKey = queryParams["lastKey"]
      ? JSON.parse(decodeURIComponent(queryParams["lastKey"]))
      : undefined;

    // Get user's comments from DynamoDB
    const result = await DynamoDBService.getCommentsByUser(
      targetUserId,
      limit,
      lastEvaluatedKey
    );

    const { comments } = result;

    // Get target details for each comment to provide context
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        let targetDetails = null;

        if (comment.targetType === "album") {
          const album = await DynamoDBService.getAlbum(comment.targetId);
          if (album) {
            targetDetails = {
              id: album.id,
              title: album.title,
              coverImageUrl: album.coverImageUrl,
              thumbnailUrls: album.thumbnailUrls,
              mediaCount: album.mediaCount,
              isPublic: album.isPublic,
              viewCount: album.viewCount,
              createdAt: album.createdAt,
              updatedAt: album.updatedAt,
            };
          }
        } else if (comment.targetType === "media") {
          // For media, get the media details directly
          const media = await DynamoDBService.getMedia(comment.targetId);
          if (media) {
            targetDetails = {
              id: media.id,
              title: media.originalFilename,
              type: "media",
              mimeType: media.mimeType,
              size: media.size,
              thumbnailUrls: media.thumbnailUrls,
              url: media.url,
              viewCount: media.viewCount,
              createdAt: media.createdAt,
              updatedAt: media.updatedAt,
            };
          } else {
            // If we can't find the media, use basic fallback
            targetDetails = {
              id: comment.targetId,
              type: "media",
              title: "Unknown Media",
            };
          }
        }

        // Convert CommentEntity to Comment format with target details
        const enrichedComment: Comment & { target?: any } = {
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
          target: targetDetails,
        };

        return enrichedComment;
      })
    );

    // Calculate pagination info
    const hasNext = !!result.lastEvaluatedKey;
    const nextKey = result.lastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.lastEvaluatedKey))
      : undefined;

    console.log(
      `✅ Retrieved ${enrichedComments.length} comments for user ${targetUsername}`
    );

    return ResponseUtil.success(event, {
      comments: enrichedComments,
      pagination: {
        page,
        limit,
        hasNext,
        nextKey,
        total: enrichedComments.length, // Note: This is count for current page, not total count
      },
    });
  } catch (error) {
    console.error("❌ Error in get user comments function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
}
