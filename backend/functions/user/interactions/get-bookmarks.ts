import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { ResponseUtil } from "@shared/utils/response";
import { UserInteraction } from "@shared/types/user";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Get user bookmarks function called");
  console.log("📝 Event:", JSON.stringify(event, null, 2));

  try {
    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
      return ResponseUtil.noContent(event);
    }

    // Validate user session
    const authResult = await UserAuthMiddleware.validateSession(event);
    if (!authResult.isValid || !authResult.user) {
      return ResponseUtil.unauthorized(event, "Unauthorized");
    }

    const user = authResult.user;

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams["page"] || "1", 10);
    const limit = Math.min(parseInt(queryParams["limit"] || "20", 10), 100); // Max 100 items per page

    if (page < 1) {
      return ResponseUtil.badRequest(event, "Page must be >= 1");
    }

    if (limit < 1) {
      return ResponseUtil.badRequest(event, "Limit must be >= 1");
    }

    // Handle pagination with lastEvaluatedKey
    let lastEvaluatedKey: Record<string, any> | undefined;
    if (queryParams["lastKey"]) {
      try {
        lastEvaluatedKey = JSON.parse(
          decodeURIComponent(queryParams["lastKey"])
        );
      } catch (error) {
        return ResponseUtil.badRequest(event, "Invalid lastKey parameter");
      }
    }

    // Get user bookmarks
    const result = await DynamoDBService.getUserInteractions(
      user.userId,
      "bookmark",
      limit,
      lastEvaluatedKey
    );

    // Transform to response format
    const interactions: UserInteraction[] = result.interactions.map((item) => ({
      userId: item.userId,
      interactionType: item.interactionType,
      targetType: item.targetType,
      targetId: item.targetId,
      createdAt: item.createdAt,
    }));

    // Get target details for each interaction
    const enrichedInteractions = await Promise.all(
      interactions.map(async (interaction) => {
        let targetDetails = null;

        if (interaction.targetType === "album") {
          const album = await DynamoDBService.getAlbum(interaction.targetId);
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
        } else if (interaction.targetType === "media") {
          // For media, get the media details directly
          const media = await DynamoDBService.getMedia(interaction.targetId);
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
              id: interaction.targetId,
              type: "media",
              title: "Unknown Media",
            };
          }
        }

        return {
          ...interaction,
          target: targetDetails,
        };
      })
    );

    // Calculate pagination info
    const hasNext = !!result.lastEvaluatedKey;
    const nextKey = result.lastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.lastEvaluatedKey))
      : undefined;

    return ResponseUtil.success(event, {
      interactions: enrichedInteractions,
      pagination: {
        page,
        limit,
        hasNext,
        nextKey,
        total: enrichedInteractions.length, // Note: This is count for current page, not total count
      },
    });
  } catch (error) {
    console.error("❌ Error in get-bookmarks function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
