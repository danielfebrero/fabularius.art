import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { getPermissionsConfig } from "@shared/utils/permissions";

/**
 * Lambda function to serve permissions configuration
 * GET /api/config/permissions
 */
export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("📋 Serving permissions configuration");

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Get permissions from shared utility
    const permissions = getPermissionsConfig();

    // Return permissions with proper CORS headers
    return ResponseUtil.success(event, permissions);
  } catch (error) {
    console.error("❌ Error serving permissions config:", error);
    return ResponseUtil.internalError(
      event,
      "Failed to load permissions configuration"
    );
  }
};
