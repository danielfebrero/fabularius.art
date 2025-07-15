import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "../../../shared/utils/response";
import { AuthMiddleware } from "./middleware";
import { AdminUser } from "../../../shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Validate admin session
    const authResult = await AuthMiddleware.validateSession(event);
    if (!authResult.isValid || !authResult.admin) {
      return ResponseUtil.unauthorized(event, "Admin access required");
    }

    // Return admin info (already validated by middleware)
    const admin: AdminUser = authResult.admin;

    return ResponseUtil.success(event, { admin });
  } catch (error) {
    console.error("Get admin info error:", error);
    return ResponseUtil.internalError(event, "Failed to get admin info");
  }
};
