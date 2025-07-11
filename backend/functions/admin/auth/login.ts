import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { ResponseUtil } from "../../../shared/utils/response";
import {
  LoginRequest,
  LoginResponse,
  AdminSessionEntity,
} from "../../../shared/types";
import { AuthMiddleware } from "./middleware";

const SESSION_DURATION_HOURS = 24;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return ResponseUtil.badRequest("Request body is required");
    }

    const request: LoginRequest = JSON.parse(event.body);

    if (!request.username || !request.password) {
      return ResponseUtil.badRequest("Username and password are required");
    }

    // Rate limiting check (basic implementation)
    const clientIp = event.requestContext.identity.sourceIp;
    console.log(
      `Login attempt from IP: ${clientIp} for username: ${request.username}`
    );

    // Get admin user by username
    const adminEntity = await DynamoDBService.getAdminByUsername(
      request.username
    );

    if (!adminEntity) {
      // Use a consistent delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ResponseUtil.unauthorized("Invalid username or password");
    }

    if (!adminEntity.isActive) {
      return ResponseUtil.forbidden("Account is disabled");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      request.password,
      adminEntity.passwordHash
    );

    if (!isPasswordValid) {
      console.log(`Failed login attempt for username: ${request.username}`);
      return ResponseUtil.unauthorized("Invalid username or password");
    }

    // Create new session
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

    const response: LoginResponse = {
      success: true,
      admin: {
        adminId: adminEntity.adminId,
        username: adminEntity.username,
        createdAt: adminEntity.createdAt,
        isActive: adminEntity.isActive,
      },
      sessionId,
    };

    // Create session cookie
    const sessionCookie = AuthMiddleware.createSessionCookie(
      sessionId,
      expiresAt.toISOString()
    );

    console.log(`Successful login for username: ${request.username}`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
        "Set-Cookie": sessionCookie,
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Login error:", error);
    return ResponseUtil.internalError("Login failed");
  }
};
