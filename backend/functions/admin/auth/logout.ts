import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { ResponseUtil } from "../../../shared/utils/response";
import { AuthMiddleware } from "./middleware";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate current session
    const validation = await AuthMiddleware.validateSession(event);

    if (!validation.isValid || !validation.session) {
      return ResponseUtil.unauthorized("No valid session found");
    }

    // Delete the session from database
    await DynamoDBService.deleteSession(validation.session.sessionId);

    // Create clear session cookie
    const clearCookie = AuthMiddleware.createClearSessionCookie();

    console.log(`Admin logout: ${validation.admin?.username}`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
        "Set-Cookie": clearCookie,
      },
      body: JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
    };
  } catch (error) {
    console.error("Logout error:", error);
    return ResponseUtil.internalError("Logout failed");
  }
};
