import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { SessionValidationResult, AdminUser } from "../../../shared/types";

export class AuthMiddleware {
  static async validateSession(
    event: APIGatewayProxyEvent
  ): Promise<SessionValidationResult> {
    try {
      // Extract session ID from cookies
      const sessionId = this.extractSessionFromCookies(
        event.headers["Cookie"] || ""
      );

      if (!sessionId) {
        return { isValid: false };
      }

      // Get session from database
      const session = await DynamoDBService.getSession(sessionId);

      if (!session) {
        return { isValid: false };
      }

      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);

      if (now > expiresAt) {
        // Clean up expired session
        await DynamoDBService.deleteSession(sessionId);
        return { isValid: false };
      }

      // Get admin user
      const adminEntity = await DynamoDBService.getAdminById(session.adminId);

      if (!adminEntity || !adminEntity.isActive) {
        return { isValid: false };
      }

      // Update last accessed time
      await DynamoDBService.updateSessionLastAccessed(sessionId);

      const admin: AdminUser = {
        adminId: adminEntity.adminId,
        username: adminEntity.username,
        createdAt: adminEntity.createdAt,
        isActive: adminEntity.isActive,
      };

      return {
        isValid: true,
        admin,
        session: {
          sessionId: session.sessionId,
          adminId: session.adminId,
          adminUsername: session.adminUsername,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          lastAccessedAt: session.lastAccessedAt,
        },
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return { isValid: false };
    }
  }

  private static extractSessionFromCookies(
    cookieHeader: string
  ): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    const sessionCookie = cookies.find((cookie) =>
      cookie.startsWith("admin_session=")
    );

    if (!sessionCookie) return null;

    return sessionCookie.split("=")[1] || null;
  }

  static createSessionCookie(sessionId: string, expiresAt: string): string {
    const expires = new Date(expiresAt);
    return `admin_session=${sessionId}; HttpOnly; Secure; SameSite=None; Path=/; Expires=${expires.toUTCString()}`;
  }

  static createClearSessionCookie(): string {
    return "admin_session=; HttpOnly; Secure; SameSite=None; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}
