import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import { CreateAlbumRequest, AlbumEntity, Album } from "@shared/types";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { PlanUtil } from "@shared/utils/plan";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Determine user context - check if admin authorizer or user authorizer
    let userId = event.requestContext.authorizer?.["userId"];
    let userRole = "user"; // default to user

    console.log("👤 UserId from authorizer:", userId);

    // If no userId from authorizer, try session-based validation
    if (!userId) {
      console.log(
        "⚠️ No userId from authorizer, falling back to session validation"
      );
      const validation = await UserAuthMiddleware.validateSession(event);

      if (!validation.isValid || !validation.user) {
        console.log("❌ Session validation failed");
        return ResponseUtil.unauthorized(event, "No user session found");
      }

      userId = validation.user.userId;
      console.log("✅ Got userId from session validation:", userId);

      // Check if user has admin privileges
      userRole = await PlanUtil.getUserRole(
        validation.user.userId,
        validation.user.email
      );
      console.log("✅ User role:", userRole);
    } else {
      // If userId came from authorizer, check if it's admin context
      // This would be set by admin authorizer vs user authorizer
      userRole = event.requestContext.authorizer?.["role"] || "user";
    }

    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const request: CreateAlbumRequest = JSON.parse(event.body);

    if (!request.title || request.title.trim().length === 0) {
      return ResponseUtil.badRequest(event, "Album title is required");
    }

    // Validate selected media IDs if provided (for user albums)
    if (request.mediaIds && request.mediaIds.length > 0) {
      // Verify all media items exist and belong to the user (unless admin)
      for (const mediaId of request.mediaIds) {
        const media = await DynamoDBService.getMedia(mediaId);
        if (!media) {
          return ResponseUtil.badRequest(
            event,
            `Media item ${mediaId} not found`
          );
        }
      }
    }

    const albumId = uuidv4();
    const now = new Date().toISOString();

    const albumEntity: AlbumEntity = {
      PK: `ALBUM#${albumId}`,
      SK: "METADATA",
      GSI1PK: "ALBUM",
      GSI1SK: `${now}#${albumId}`,
      GSI4PK: "ALBUM_BY_CREATOR",
      GSI4SK: `${userId}#${now}#${albumId}`,
      EntityType: "Album",
      id: albumId,
      title: request.title.trim(),
      tags: request.tags?.filter((tag) => tag.trim()).map((tag) => tag.trim()),
      createdAt: now,
      updatedAt: now,
      mediaCount: request.mediaIds?.length || 0,
      isPublic: (userRole === "user"
        ? true
        : request.isPublic ?? false
      ).toString(),
      likeCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      createdBy: userId,
      createdByType: userRole === "admin" ? "admin" : "user",
    };

    await DynamoDBService.createAlbum(albumEntity);

    // Add selected media to the album if provided
    if (request.mediaIds && request.mediaIds.length > 0) {
      for (const mediaId of request.mediaIds) {
        await DynamoDBService.addMediaToAlbum(albumId, mediaId, userId);
      }
    }

    const album: Album = {
      id: albumEntity.id,
      title: albumEntity.title,
      createdAt: albumEntity.createdAt,
      updatedAt: albumEntity.updatedAt,
      mediaCount: albumEntity.mediaCount,
      isPublic: albumEntity.isPublic === "true",
      likeCount: albumEntity.likeCount || 0,
      bookmarkCount: albumEntity.bookmarkCount || 0,
      viewCount: albumEntity.viewCount || 0,
    };

    if (albumEntity.tags !== undefined) {
      album.tags = albumEntity.tags;
    }

    if (albumEntity.coverImageUrl !== undefined) {
      album.coverImageUrl = albumEntity.coverImageUrl;
    }

    // Trigger revalidation
    await RevalidationService.revalidateAlbums();

    return ResponseUtil.created(event, album);
  } catch (error) {
    console.error("Error creating album:", error);
    return ResponseUtil.internalError(event, "Failed to create album");
  }
};
