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
    const queryParams = event.queryStringParameters || {};
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
