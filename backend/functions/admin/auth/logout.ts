import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { ResponseUtil } from "../../../shared/utils/response";
import { AuthMiddleware } from "./middleware";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Validate current session
    const validation = await AuthMiddleware.validateSession(event);

    if (!validation.isValid || !validation.session) {
      return ResponseUtil.unauthorized(event, "No valid session found");
    }

    // Delete the session from database
    await DynamoDBService.deleteSession(validation.session.sessionId);

    // Create clear session cookie
    const clearCookie = AuthMiddleware.createClearSessionCookie();

    console.log(`Admin logout: ${validation.admin?.username}`);

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
