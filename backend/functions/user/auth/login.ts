import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { ResponseUtil } from "../../../shared/utils/response";
import { UserUtil } from "../../../shared/utils/user";
import { UserLoginRequest, UserSessionEntity } from "../../../shared/types";
import { UserAuthMiddleware } from "./middleware";

const SESSION_DURATION_DAYS = 30; // Users get longer sessions than admins

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

    // Update last login timestamp
    await UserUtil.updateLastLogin(userEntity.userId);

    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
    );

    const sessionEntity: UserSessionEntity = {
      PK: `SESSION#${sessionId}`,
      SK: "METADATA",
      GSI1PK: "USER_SESSION_EXPIRY",
      GSI1SK: `${expiresAt.toISOString()}#${sessionId}`,
      EntityType: "UserSession",
      sessionId,
      userId: userEntity.userId,
      userEmail: userEntity.email,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastAccessedAt: now.toISOString(),
      ttl: Math.floor(expiresAt.getTime() / 1000), // Unix timestamp for TTL
    };

    await DynamoDBService.createUserSession(sessionEntity);

    const responseData = {
      user: UserUtil.sanitizeUserForResponse(userEntity),
      sessionId,
    };

    const sessionCookie = UserAuthMiddleware.createSessionCookie(
      sessionId,
      expiresAt.toISOString()
    );

    const successResponse = ResponseUtil.success(event, responseData);
    successResponse.headers = {
      ...successResponse.headers,
      "Set-Cookie": sessionCookie,
    };

    return successResponse;
  } catch (error) {
    console.error("User login error:", error);
    return ResponseUtil.internalError(event, "Login failed");
  }
};
