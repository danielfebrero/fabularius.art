import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { AuthMiddleware } from "@shared/auth/admin-middleware";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Extract session from cookie and delete it, even if expired
    const cookieHeader =
      event.headers["Cookie"] || event.headers["cookie"] || "";
    const sessionId = AuthMiddleware.extractSessionFromCookies(cookieHeader);

    if (sessionId) {
      // Delete the session from database, ignoring if it doesn't exist
      await DynamoDBService.deleteSession(sessionId);
      console.log(`Admin logout for session: ${sessionId}`);
    }

    // Create clear session cookie
    const clearCookie = AuthMiddleware.createClearSessionCookie();

    const successResponse = ResponseUtil.success(event, {
      message: "Logged out successfully",
    });

    successResponse.headers = {
      ...successResponse.headers,
      "Set-Cookie": clearCookie,
    };

    return successResponse;
  } catch (error) {
    console.error("Logout error:", error);
    return ResponseUtil.internalError(event, "Logout failed");
  }
};
