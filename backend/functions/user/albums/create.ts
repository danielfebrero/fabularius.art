import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import { CreateAlbumRequest, AlbumEntity, Album } from "@shared/types";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { CoverThumbnailUtil } from "@shared/utils/cover-thumbnail";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Get user ID from request context (set by the user authorizer)
    let userId = event.requestContext.authorizer?.["userId"];

    console.log("👤 UserId from authorizer:", userId);

    // Fallback for local development or when authorizer context is missing
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
    }

    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const request: CreateAlbumRequest = JSON.parse(event.body);

    if (!request.title || request.title.trim().length === 0) {
      return ResponseUtil.badRequest(event, "Album title is required");
    }

    // Validate selected media IDs if provided
    if (request.mediaIds && request.mediaIds.length > 0) {
      // Verify all media items exist and belong to the user
      for (const mediaId of request.mediaIds) {
        const media = await DynamoDBService.getMedia(mediaId);
        if (!media) {
          return ResponseUtil.badRequest(
            event,
            `Media item ${mediaId} not found`
          );
        }
        if (media.createdBy !== userId) {
          return ResponseUtil.forbidden(
            event,
            `Media item ${mediaId} does not belong to you`
          );
        }
      }
    }

    const albumId = uuidv4();
    const now = new Date().toISOString();

    // Validate cover image ID if provided and generate thumbnails
    let coverImageUrl: string | undefined;
    let thumbnailUrls:
      | {
          cover?: string;
          small?: string;
          medium?: string;
          large?: string;
          xlarge?: string;
        }
      | undefined;

    if (request.coverImageId) {
      const coverMedia = await DynamoDBService.getMedia(request.coverImageId);
      if (!coverMedia) {
        return ResponseUtil.badRequest(
          event,
          `Cover image ${request.coverImageId} not found`
        );
      }
      coverImageUrl = coverMedia.url;

      // Generate thumbnails before creating the album
      const generatedThumbnails =
        await CoverThumbnailUtil.processCoverImageThumbnails(
          coverImageUrl,
          albumId
        );

      if (generatedThumbnails) {
        thumbnailUrls = generatedThumbnails;
      } else {
        console.warn(
          `Failed to generate thumbnails for album ${albumId}, continuing without them`
        );
      }
    }

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
      isPublic: (request.isPublic ?? false).toString(),
      likeCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      createdBy: userId,
      createdByType: "user" as const,
      ...(coverImageUrl && { coverImageUrl }),
      ...(thumbnailUrls && { thumbnailUrls }),
    };

    await DynamoDBService.createAlbum(albumEntity);

    // Add selected media to the album if provided
    if (request.mediaIds && request.mediaIds.length > 0) {
      for (const mediaId of request.mediaIds) {
        await DynamoDBService.addMediaToAlbum(albumId, mediaId, userId);
      }
    }

    // Prepare the album response using the data we already have
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

    if (albumEntity.thumbnailUrls !== undefined) {
      album.thumbnailUrls = albumEntity.thumbnailUrls;
    }

    // Trigger revalidation
    await RevalidationService.revalidateAlbums();

    return ResponseUtil.created(event, album);
  } catch (error) {
    console.error("Error creating user album:", error);
    return ResponseUtil.internalError(event, "Failed to create album");
  }
};
