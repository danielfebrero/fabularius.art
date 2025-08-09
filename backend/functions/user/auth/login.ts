import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as bcrypt from "bcrypt";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { ResponseUtil } from "@shared/utils/response";
import { UserUtil } from "@shared/utils/user";
import { UserLoginRequest } from "@shared";
import { SessionUtil } from "@shared/utils/session";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const request: UserLoginRequest = JSON.parse(event.body);

    if (!request.email || !request.password) {
      return ResponseUtil.badRequest(event, "Email and password are required");
    }

    // Validate email format
    if (!UserUtil.validateEmail(request.email)) {
      return ResponseUtil.badRequest(event, "Invalid email format");
    }

    const userEntity = await DynamoDBService.getUserByEmail(request.email);

    if (!userEntity) {
      // Add delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ResponseUtil.unauthorized(event, "Invalid email or password");
    }

    if (!userEntity.isActive) {
      return ResponseUtil.forbidden(event, "Account is disabled");
    }

    // Check if email is verified
    if (!userEntity.isEmailVerified) {
      const errorResponse = ResponseUtil.forbidden(event, "");
      return {
        statusCode: 403,
        headers: errorResponse.headers,
        body: JSON.stringify({
          success: false,
          error: "EMAIL_NOT_VERIFIED",
          message:
            "Please verify your email address before logging in. Check your inbox for the verification email.",
        }),
      };
    }

    // Check if this is an email provider user with password
    if (userEntity.provider === "google" || !userEntity.passwordHash) {
      return ResponseUtil.badRequest(
        event,
        "This account uses OAuth authentication. Please sign in with Google."
      );
    }

    const isPasswordValid = await bcrypt.compare(
      request.password,
      userEntity.passwordHash
    );

    if (!isPasswordValid) {
      return ResponseUtil.unauthorized(event, "Invalid email or password");
    }

    // Create user session with auto sign-in
    return SessionUtil.createUserSessionResponse(
      event,
      {
        userId: userEntity.userId,
        userEmail: userEntity.email,
        updateLastLogin: true,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("User login error:", error);
    return ResponseUtil.internalError(event, "Login failed");
  }
};
