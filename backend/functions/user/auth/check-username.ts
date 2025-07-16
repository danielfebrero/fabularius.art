import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "../../../shared/utils/response";
import { UserUtil } from "../../../shared/utils/user";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import {
  UsernameAvailabilityRequest,
  UsernameAvailabilityResponse,
} from "../../../shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    // Support both GET and POST methods for flexibility
    let username: string;

    if (event.httpMethod === "GET") {
      // GET method: username in query parameter
      username = event.queryStringParameters?.["username"] || "";
    } else if (event.httpMethod === "POST") {
      // POST method: username in request body
      if (!event.body) {
        return ResponseUtil.badRequest(event, "Request body is required");
      }

      const request: UsernameAvailabilityRequest = JSON.parse(event.body);
      username = request.username || "";
    } else {
      return ResponseUtil.error(event, "Method not allowed", 405);
    }

    // Validate username is provided
    if (!username || username.trim().length === 0) {
      const response: UsernameAvailabilityResponse = {
        success: false,
        available: false,
        error: "Username is required",
      };
      return ResponseUtil.success(event, response);
    }

    // Validate username format
    const usernameValidation = UserUtil.validateUsername(username);
    if (!usernameValidation.isValid) {
      const response: UsernameAvailabilityResponse = {
        success: false,
        available: false,
        message: `Username validation failed: ${usernameValidation.errors.join(
          ", "
        )}`,
      };
      return ResponseUtil.success(event, response);
    }

    // Check if username is available
    const existingUser = await DynamoDBService.getUserByUsername(
      username.trim()
    );
    const isAvailable = !existingUser;

    const response: UsernameAvailabilityResponse = {
      success: true,
      available: isAvailable,
      message: isAvailable
        ? "Username is available"
        : "Username is already taken",
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("Username availability check error:", error);

    return ResponseUtil.internalError(
      event,
      "Failed to check username availability"
    );
  }
};
