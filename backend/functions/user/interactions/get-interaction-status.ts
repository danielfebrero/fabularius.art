import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { ResponseUtil } from "@shared/utils/response";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Get user interaction status function called");
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

    // Parse request body for bulk status check
    let targets: Array<{ targetType: "album" | "media"; targetId: string }> =
      [];

    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        targets = body.targets || [];
      } catch (error) {
        return ResponseUtil.badRequest(event, "Invalid JSON body");
      }
    }

    // Validate targets
    if (!Array.isArray(targets) || targets.length === 0) {
      return ResponseUtil.badRequest(
        event,
        "targets array is required and must not be empty"
      );
    }

    if (targets.length > 50) {
      return ResponseUtil.badRequest(
        event,
        "Maximum 50 targets allowed per request"
      );
    }

    // Validate each target
    for (const target of targets) {
      if (
        !target.targetType ||
        !["album", "media"].includes(target.targetType)
      ) {
        return ResponseUtil.badRequest(
          event,
          "Each target must have a valid targetType ('album' or 'media')"
        );
      }
      if (!target.targetId || typeof target.targetId !== "string") {
        return ResponseUtil.badRequest(
          event,
          "Each target must have a valid targetId"
        );
      }
    }

    // Get user interactions for all targets
    const statusMap = new Map<
      string,
      { userLiked: boolean; userBookmarked: boolean }
    >();

    // Initialize all targets as not interacted
    for (const target of targets) {
      const key = `${target.targetType}:${target.targetId}`;
      statusMap.set(key, { userLiked: false, userBookmarked: false });
    }

    try {
      // Get user likes
      const [likesResult, bookmarksResult] = await Promise.all([
        DynamoDBService.getUserInteractions(user.userId, "like"),
        DynamoDBService.getUserInteractions(user.userId, "bookmark"),
      ]);

      // Process likes
      if (likesResult.interactions) {
        for (const interaction of likesResult.interactions) {
          const key = `${interaction.targetType}:${interaction.targetId}`;
          if (statusMap.has(key)) {
            const status = statusMap.get(key)!;
            status.userLiked = true;
            statusMap.set(key, status);
          }
        }
      }

      // Process bookmarks
      if (bookmarksResult.interactions) {
        for (const interaction of bookmarksResult.interactions) {
          const key = `${interaction.targetType}:${interaction.targetId}`;
          if (statusMap.has(key)) {
            const status = statusMap.get(key)!;
            status.userBookmarked = true;
            statusMap.set(key, status);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error fetching user interactions:", error);
      return ResponseUtil.internalError(
        event,
        "Failed to fetch interaction status"
      );
    }

    // Format response
    const statuses = targets.map((target) => ({
      targetType: target.targetType,
      targetId: target.targetId,
      ...statusMap.get(`${target.targetType}:${target.targetId}`)!,
    }));

    const response = {
      success: true,
      data: {
        statuses,
      },
    };

    console.log("✅ Successfully retrieved interaction statuses");
    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("❌ Error in get-interaction-status function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
