import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthUtil } from "@shared/utils/user-auth";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import {
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentEntity,
} from "@shared/types";
import { v4 as uuidv4 } from "uuid";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Comment function called");
  console.log("📝 Event:", JSON.stringify(event, null, 2));

  try {
    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
      return ResponseUtil.noContent(event);
    }

    // Extract user authentication using centralized utility
    const authResult = await UserAuthUtil.requireAuth(event);

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      return authResult;
    }

    const userId = authResult.userId!;

    // Route to appropriate handler based on HTTP method
    switch (event.httpMethod) {
      case "POST":
        return await createComment(event, userId);
      case "PUT":
        return await updateComment(event, userId);
      case "DELETE":
        return await deleteComment(event, userId);
      default:
        return ResponseUtil.error(event, "Method not allowed", 405);
    }
  } catch (error) {
    console.error("❌ Error in comment function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};

async function createComment(
  event: APIGatewayProxyEvent,
  userId: string
): Promise<APIGatewayProxyResult> {
  // Parse request body
  if (!event.body) {
    return ResponseUtil.badRequest(event, "Request body is required");
  }

  const body: CreateCommentRequest = JSON.parse(event.body);
  const { targetType, targetId, content } = body;

  // Validate input
  if (!targetType || !targetId || !content) {
    return ResponseUtil.badRequest(
      event,
      "targetType, targetId, and content are required"
    );
  }

  if (!["album", "media"].includes(targetType)) {
    return ResponseUtil.badRequest(
      event,
      "targetType must be 'album' or 'media'"
    );
  }

  if (content.trim().length === 0) {
    return ResponseUtil.badRequest(event, "Comment content cannot be empty");
  }

  if (content.trim().length > 500) {
    return ResponseUtil.badRequest(
      event,
      "Comment content must be 500 characters or less"
    );
  }

  // Get user data for username
  const user = await DynamoDBService.getUserById(userId);
  if (!user || !user.isActive) {
    return ResponseUtil.unauthorized(event, "User not found or inactive");
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

  const now = new Date().toISOString();
  const commentId = uuidv4();

  // Create comment entity
  const commentEntity: CommentEntity = {
    PK: `COMMENT#${commentId}`,
    SK: "METADATA",
    GSI1PK: `COMMENTS_BY_TARGET#${targetType}#${targetId}`,
    GSI1SK: now,
    GSI2PK: `COMMENTS_BY_USER#${user.userId}`,
    GSI2SK: now,
    EntityType: "Comment",
    id: commentId,
    content: content.trim(),
    targetType,
    targetId,
    userId: user.userId,
    username: user.username,
    createdAt: now,
    updatedAt: now,
    likeCount: 0,
    isEdited: false,
  };

  // Create the comment
  await DynamoDBService.createComment(commentEntity);

  // Increment comment count for the target
  if (targetType === "album") {
    await DynamoDBService.incrementAlbumCommentCount(targetId, 1);
  } else {
    await DynamoDBService.incrementMediaCommentCount(targetId, 1);
  }

  // Trigger page revalidation for the target
  if (targetType === "media") {
    await RevalidationService.revalidateMedia(targetId);
  } else {
    await RevalidationService.revalidateAlbum(targetId);
  }

  console.log(`✅ Comment created for ${targetType} ${targetId}`);

  return ResponseUtil.success(event, {
    id: commentId,
    content: commentEntity.content,
    targetType,
    targetId,
    userId: user.userId,
    username: user.username,
    createdAt: now,
    updatedAt: now,
    likeCount: 0,
    isEdited: false,
  });
}

async function updateComment(
  event: APIGatewayProxyEvent,
  userId: string
): Promise<APIGatewayProxyResult> {
  // Get comment ID from path parameters
  const commentId = event.pathParameters?.["commentId"];
  if (!commentId) {
    return ResponseUtil.badRequest(event, "Comment ID is required");
  }

  // Parse request body
  if (!event.body) {
    return ResponseUtil.badRequest(event, "Request body is required");
  }

  const body: UpdateCommentRequest = JSON.parse(event.body);
  const { content } = body;

  // Validate input
  if (!content) {
    return ResponseUtil.badRequest(event, "Content is required");
  }

  if (content.trim().length === 0) {
    return ResponseUtil.badRequest(event, "Comment content cannot be empty");
  }

  if (content.length > 1000) {
    return ResponseUtil.badRequest(
      event,
      "Comment content cannot exceed 1000 characters"
    );
  }

  // Get existing comment
  const existingComment = await DynamoDBService.getComment(commentId);
  if (!existingComment) {
    return ResponseUtil.notFound(event, "Comment not found");
  }

  // Check if user owns the comment
  if (existingComment.userId !== userId) {
    return ResponseUtil.forbidden(event, "You can only edit your own comments");
  }

  // Get user data for username
  const user = await DynamoDBService.getUserById(userId);
  if (!user || !user.isActive) {
    return ResponseUtil.unauthorized(event, "User not found or inactive");
  }

  const now = new Date().toISOString();

  // Update the comment
  await DynamoDBService.updateComment(commentId, {
    content: content.trim(),
    updatedAt: now,
    isEdited: true,
  });

  // Trigger page revalidation for the target
  if (existingComment.targetType === "media") {
    await RevalidationService.revalidateMedia(existingComment.targetId);
  } else {
    await RevalidationService.revalidateAlbum(existingComment.targetId);
  }

  console.log(`✅ Comment ${commentId} updated`);

  return ResponseUtil.success(event, {
    id: commentId,
    content: content.trim(),
    targetType: existingComment.targetType,
    targetId: existingComment.targetId,
    userId: user.userId,
    username: user.username,
    createdAt: existingComment.createdAt,
    updatedAt: now,
    likeCount: existingComment.likeCount,
    isEdited: true,
  });
}

async function deleteComment(
  event: APIGatewayProxyEvent,
  userId: string
): Promise<APIGatewayProxyResult> {
  // Get comment ID from path parameters
  const commentId = event.pathParameters?.["commentId"];
  if (!commentId) {
    return ResponseUtil.badRequest(event, "Comment ID is required");
  }

  // Get existing comment
  const existingComment = await DynamoDBService.getComment(commentId);
  if (!existingComment) {
    return ResponseUtil.notFound(event, "Comment not found");
  }

  // Check if user owns the comment
  if (existingComment.userId !== userId) {
    return ResponseUtil.forbidden(
      event,
      "You can only delete your own comments"
    );
  }

  // Delete the comment
  await DynamoDBService.deleteComment(commentId);

  // Decrement comment count for the target
  if (existingComment.targetType === "album") {
    await DynamoDBService.incrementAlbumCommentCount(
      existingComment.targetId,
      -1
    );
  } else {
    await DynamoDBService.incrementMediaCommentCount(
      existingComment.targetId,
      -1
    );
  }

  // Trigger page revalidation for the target
  if (existingComment.targetType === "media") {
    await RevalidationService.revalidateMedia(existingComment.targetId);
  } else {
    await RevalidationService.revalidateAlbum(existingComment.targetId);
  }

  console.log(`✅ Comment ${commentId} deleted`);

  return ResponseUtil.success(event, {
    id: commentId,
    message: "Comment deleted successfully",
  });
}
