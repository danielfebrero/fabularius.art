import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "../../../shared/utils/response";
import { AuthMiddleware } from "./middleware";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate current session
    const validation = await AuthMiddleware.validateSession(event);

    if (!validation.isValid || !validation.admin) {
      return ResponseUtil.unauthorized(event, "No valid session found");
    }

    // Return admin info (without sensitive data)
    return ResponseUtil.success(event, {
      admin: validation.admin,
    });
  } catch (error) {
    console.error("Get admin info error:", error);
    return ResponseUtil.internalError(event, "Failed to get admin info");
  }
};
