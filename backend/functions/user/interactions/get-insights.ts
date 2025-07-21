import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { ResponseUtil } from "@shared/utils/response";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔄 Get user insights function called");
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

    // Get total likes received on user's content
    const totalLikesReceived =
      await DynamoDBService.getTotalLikesReceivedOnUserContent(user.userId);
    const totalBookmarksReceived =
      await DynamoDBService.getTotalBookmarksReceivedOnUserContent(user.userId);

    return ResponseUtil.success(event, {
      totalLikesReceived,
      totalBookmarksReceived,
    });
  } catch (error) {
    console.error("❌ Error in get-insights function:", error);
    return ResponseUtil.internalError(event, "Internal server error");
  }
};
