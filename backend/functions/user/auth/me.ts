import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "../../../shared/utils/response";
import { UserAuthMiddleware } from "./middleware";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Validate user session
    const authResult = await UserAuthMiddleware.validateSession(event);
    if (!authResult.isValid || !authResult.user) {
      return ResponseUtil.unauthorized(event, "User access required");
    }

    // Return user info (already validated and sanitized by middleware)
    const user = authResult.user;

    return ResponseUtil.success(event, { user });
  } catch (error) {
    console.error("Get user info error:", error);
    return ResponseUtil.internalError(event, "Failed to get user info");
  }
};
