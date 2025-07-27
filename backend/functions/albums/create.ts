import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { RevalidationService } from "@shared/utils/revalidation";
import { CreateAlbumRequest, AlbumEntity, Album } from "@shared/types";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { PlanUtil } from "@shared/utils/plan";
import { CoverThumbnailUtil } from "@shared/utils/cover-thumbnail";
import { getPlanPermissions } from "@shared/utils/permissions";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Determine user context - check if admin authorizer or user authorizer
    let userId = event.requestContext.authorizer?.["userId"];
    let userRole = event.requestContext.authorizer?.["role"] || "user"; // Try to get role from authorizer first

    console.log("👤 UserId from authorizer:", userId);
    console.log("👤 UserRole from authorizer:", userRole);

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

      // Check if user has admin privileges through PlanUtil
      userRole = await PlanUtil.getUserRole(
        validation.user.userId,
        validation.user.email
      );
      console.log("✅ User role from PlanUtil:", userRole);
    } else {
      // If userId came from authorizer but no role was provided, check through PlanUtil as fallback
      if (!event.requestContext.authorizer?.["role"]) {
        console.log("⚠️ No role from authorizer, checking through PlanUtil");
        // We need user email for PlanUtil.getUserRole, let's try to get it from authorizer or fetch user data
        const userEmail = event.requestContext.authorizer?.["email"];
        if (userEmail) {
          userRole = await PlanUtil.getUserRole(userId, userEmail);
          console.log("✅ User role from PlanUtil fallback:", userRole);
        }
      }
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
    }

    const albumId = uuidv4();
    const now = new Date().toISOString();

    // Determine isPublic value based on user role and permissions
    let isPublicValue: boolean;
    if (userRole === "admin") {
      // Admins can set any isPublic value they want
      isPublicValue = request.isPublic ?? false;
    } else {
      // For regular users, check if they have permission to create private content
      const userPlanInfo = await PlanUtil.getUserPlanInfo(userId);
      const planPermissions = getPlanPermissions(userPlanInfo.plan);

      if (planPermissions.canCreatePrivateContent) {
        // User has permission to create private content, so they can set isPublic
        isPublicValue = request.isPublic ?? true;
      } else {
        // User doesn't have permission to create private content, force to public
        isPublicValue = true;

        // Log a warning if user tried to set isPublic to false
        if (request.isPublic === false) {
          console.warn(
            `User ${userId} with plan ${userPlanInfo.plan} attempted to create private album but lacks permission`
          );
        }
      }
    }

    // Generate thumbnails if cover image is set, before creating the album
    if (coverImageUrl) {
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
      mediaCount: 0,
      isPublic: isPublicValue.toString(),
      likeCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      createdBy: userId,
      createdByType: userRole === "admin" ? "admin" : "user",
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
      isPublic: isPublicValue,
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
    console.error("Error creating album:", error);
    return ResponseUtil.internalError(event, "Failed to create album");
  }
};
