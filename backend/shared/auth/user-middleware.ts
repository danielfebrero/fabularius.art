import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserSessionValidationResult, User } from "@shared/types";

export class UserAuthMiddleware {
  static async validateSession(
    event: APIGatewayProxyEvent
  ): Promise<UserSessionValidationResult> {
    try {
      // Extract session ID from cookies
      const cookieHeader =
        event.headers["Cookie"] || event.headers["cookie"] || "";
      console.log("User cookie header received:", cookieHeader);

      const sessionId = this.extractSessionFromCookies(cookieHeader);
      console.log("Extracted user session ID:", sessionId);

      if (!sessionId) {
        console.log("No user session ID found in cookies");
        return { isValid: false };
      }

      // Get session from database
      const session = await DynamoDBService.getUserSession(sessionId);

      if (!session) {
        return { isValid: false };
      }

      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);

      if (now > expiresAt) {
        // Clean up expired session
        await DynamoDBService.deleteUserSession(sessionId);
        return { isValid: false };
      }

      // Get user
      const userEntity = await DynamoDBService.getUserById(session.userId);

      if (!userEntity || !userEntity.isActive) {
        return { isValid: false };
      }

      // Update last accessed time
      await DynamoDBService.updateUserSessionLastAccessed(sessionId);

      const user: User = {
        userId: userEntity.userId,
        email: userEntity.email,
        createdAt: userEntity.createdAt,
        isActive: userEntity.isActive,
        isEmailVerified: userEntity.isEmailVerified,
        ...(userEntity.username && { username: userEntity.username }),
        ...(userEntity.firstName && { firstName: userEntity.firstName }),
        ...(userEntity.lastName && { lastName: userEntity.lastName }),
        ...(userEntity.lastLoginAt && { lastLoginAt: userEntity.lastLoginAt }),
        ...(userEntity.googleId && { googleId: userEntity.googleId }),
      };

      return {
        isValid: true,
        user,
        session: {
          sessionId: session.sessionId,
          userId: session.userId,
          userEmail: session.userEmail,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          lastAccessedAt: session.lastAccessedAt,
        },
      };
    } catch (error) {
      console.error("User session validation error:", error);
      return { isValid: false };
    }
  }

  static extractSessionFromCookies(cookieHeader: string): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    const sessionCookie = cookies.find((cookie) =>
      cookie.startsWith("user_session=")
    );

    if (!sessionCookie) return null;

    return sessionCookie.split("=")[1] || null;
  }

  static createSessionCookie(sessionId: string, expiresAt: string): string {
    const expires = new Date(expiresAt);
    const isOffline = process.env["IS_OFFLINE"] === "true";

    const cookieParts = [
      `user_session=${sessionId}`,
      "HttpOnly",
      "Path=/",
      `Expires=${expires.toUTCString()}`,
    ];

    if (isOffline) {
      cookieParts.push("SameSite=Lax");
    } else {
      cookieParts.push("Secure", "SameSite=None");
    }

    return cookieParts.join("; ");
  }

  static createClearSessionCookie(): string {
    const isOffline = process.env["IS_OFFLINE"] === "true";

    const cookieParts = [
      "user_session=",
      "HttpOnly",
      "Path=/",
      "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ];

    if (isOffline) {
      cookieParts.push("SameSite=Lax");
    } else {
      cookieParts.push("Secure", "SameSite=None");
    }

    return cookieParts.join("; ");
  }
}
