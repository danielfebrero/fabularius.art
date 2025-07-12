import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { ResponseUtil } from "../../../shared/utils/response";
import { UpdateAlbumRequest } from "../../../shared/types";
import { AuthMiddleware } from "../auth/middleware";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate admin session
    const validation = await AuthMiddleware.validateSession(event);
    if (!validation.isValid) {
      return ResponseUtil.unauthorized("Invalid or expired session");
    }

    const albumId = event.pathParameters?.["albumId"];
    if (!albumId) {
      return ResponseUtil.badRequest("Album ID is required");
    }

    if (!event.body) {
      return ResponseUtil.badRequest("Request body is required");
    }

    const request: UpdateAlbumRequest = JSON.parse(event.body);

    // Validate request
    if (request.title !== undefined && request.title.trim().length === 0) {
      return ResponseUtil.badRequest("Album title cannot be empty");
    }

    // Check if album exists
    const existingAlbum = await DynamoDBService.getAlbum(albumId);
    if (!existingAlbum) {
      return ResponseUtil.notFound("Album not found");
    }

    // Prepare updates
    const updates: Partial<typeof existingAlbum> = {
      updatedAt: new Date().toISOString(),
    };

    if (request.title !== undefined) {
      updates.title = request.title.trim();
    }

    if (request.tags !== undefined) {
      updates.tags = request.tags;
    }

    if (request.isPublic !== undefined) {
      updates.isPublic = request.isPublic;
    }

    if (request.coverImageUrl !== undefined) {
      updates.coverImageUrl = request.coverImageUrl;
    }

    // Update album
    await DynamoDBService.updateAlbum(albumId, updates);

    // Get updated album
    const updatedAlbum = await DynamoDBService.getAlbum(albumId);
    if (!updatedAlbum) {
      return ResponseUtil.internalError("Failed to retrieve updated album");
    }

    const response = {
      id: updatedAlbum.id,
      title: updatedAlbum.title,
      tags: updatedAlbum.tags,
      coverImageUrl: updatedAlbum.coverImageUrl,
      createdAt: updatedAlbum.createdAt,
      updatedAt: updatedAlbum.updatedAt,
      mediaCount: updatedAlbum.mediaCount,
      isPublic: updatedAlbum.isPublic,
    };

    return ResponseUtil.success(response);
  } catch (error) {
    console.error("Error updating album:", error);
    return ResponseUtil.internalError("Failed to update album");
  }
};
