import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { ResponseUtil } from "@shared/utils/response";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Get interaction counts function called");
  console.log("📝 Event:", JSON.stringify(event, null, 2));

  try {
    // Handle preflight requests
    if (event.httpMethod === "OPTIONS") {
      return ResponseUtil.noContent(event);
    }

    // Get path parameters
    const pathParams = event.pathParameters;
    if (!pathParams || !pathParams["targetType"] || !pathParams["targetId"]) {
      return ResponseUtil.badRequest(
        event,
        "targetType and targetId are required"
      );
    }

    const { targetType, targetId } = pathParams;

    // Validate targetType
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
      // For media, we'd need to check if it exists
      // This is more complex due to our current structure
      // For now, we'll assume it exists if the request is made
    }

    // Get interaction counts
    const counts = await DynamoDBService.getInteractionCounts(
      targetType as "album" | "media",
      targetId
    );

    // Get user interaction status if authenticated
    let userLiked = false;
    let userBookmarked = false;

    const authResult = await UserAuthMiddleware.validateSession(event);
    if (authResult.isValid && authResult.user) {
      const userStatus = await DynamoDBService.getUserInteractionStatus(
        authResult.user.userId,
        targetId
      );
      userLiked = userStatus.userLiked;
      userBookmarked = userStatus.userBookmarked;
    }

    return ResponseUtil.success(event, {
      targetId,
      targetType,
      likeCount: counts.likeCount,
      bookmarkCount: counts.bookmarkCount,
      userLiked,
      userBookmarked,
    });
  } catch (error) {
    console.error("❌ Error in get-counts function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
