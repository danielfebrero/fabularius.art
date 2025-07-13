import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { ResponseUtil } from "../../../shared/utils/response";
import { LoginRequest, AdminSessionEntity } from "../../../shared/types";
import { AuthMiddleware } from "./middleware";

const SESSION_DURATION_HOURS = 24;

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

    const request: LoginRequest = JSON.parse(event.body);

    if (!request.username || !request.password) {
      return ResponseUtil.badRequest(
        event,
        "Username and password are required"
      );
    }

    const adminEntity = await DynamoDBService.getAdminByUsername(
      request.username
    );

    if (!adminEntity) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ResponseUtil.unauthorized(event, "Invalid username or password");
    }

    if (!adminEntity.isActive) {
      return ResponseUtil.forbidden(event, "Account is disabled");
    }

    const isPasswordValid = await bcrypt.compare(
      request.password,
      adminEntity.passwordHash
    );

    if (!isPasswordValid) {
      return ResponseUtil.unauthorized(event, "Invalid username or password");
    }

    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000
    );

    const sessionEntity: AdminSessionEntity = {
      PK: `SESSION#${sessionId}`,
      SK: "METADATA",
      GSI1PK: "SESSION_EXPIRY",
      GSI1SK: `${expiresAt.toISOString()}#${sessionId}`,
      EntityType: "AdminSession",
      sessionId,
      adminId: adminEntity.adminId,
      adminUsername: adminEntity.username,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastAccessedAt: now.toISOString(),
    };

    await DynamoDBService.createSession(sessionEntity);

    const responseData = {
      admin: {
        adminId: adminEntity.adminId,
        username: adminEntity.username,
        createdAt: adminEntity.createdAt,
        isActive: adminEntity.isActive,
      },
      sessionId,
    };

    const sessionCookie = AuthMiddleware.createSessionCookie(
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
    console.error("Login error:", error);
    return ResponseUtil.internalError(event, "Login failed");
  }
};
