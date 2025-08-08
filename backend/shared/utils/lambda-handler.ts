import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "./response";
import { UserAuthUtil } from "./user-auth";

export interface AuthResult {
  userId: string;
  userRole?: string;
}

export interface LambdaHandlerConfig {
  requireAuth?: boolean;
  includeRole?: boolean;
  requireBody?: boolean;
  validatePathParams?: string[];
}

export type AuthenticatedHandler = (
  event: APIGatewayProxyEvent,
  auth: AuthResult
) => Promise<APIGatewayProxyResult>;

export type UnauthenticatedHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

/**
 * Shared Lambda handler wrapper that handles common patterns:
 * - OPTIONS request handling
 * - Authentication validation
 * - Request body validation
 * - Path parameter validation
 * - Centralized error handling
 */
export class LambdaHandlerUtil {
  /**
   * Wrap a handler that requires authentication
   */
  static withAuth(
    handler: AuthenticatedHandler,
    config: LambdaHandlerConfig = {}
  ) {
    return async (
      event: APIGatewayProxyEvent
    ): Promise<APIGatewayProxyResult> => {
      try {
        // Handle OPTIONS requests
        if (event.httpMethod === "OPTIONS") {
          return ResponseUtil.noContent(event);
        }

        // Validate required path parameters
        if (config.validatePathParams) {
          for (const param of config.validatePathParams) {
            if (!event.pathParameters?.[param]) {
              return ResponseUtil.badRequest(
                event,
                `${param} is required in path`
              );
            }
          }
        }

        // Validate request body if required
        if (config.requireBody && !event.body) {
          return ResponseUtil.badRequest(event, "Request body is required");
        }

        // Handle authentication
        const authResult = await UserAuthUtil.requireAuth(event, {
          includeRole: config.includeRole || false,
        });

        if (UserAuthUtil.isErrorResponse(authResult)) {
          return authResult;
        }

        const auth: AuthResult = {
          userId: authResult.userId!,
          ...(authResult.userRole && { userRole: authResult.userRole }),
        };

        console.log("✅ Authenticated user:", auth.userId);
        if (auth.userRole) {
          console.log("🎭 User role:", auth.userRole);
        }

        // Call the actual handler
        return await handler(event, auth);
      } catch (error) {
        console.error("❌ Lambda handler error:", error);
        return ResponseUtil.internalError(
          event,
          error instanceof Error ? error.message : "Internal server error"
        );
      }
    };
  }

  /**
   * Wrap a handler that doesn't require authentication
   */
  static withoutAuth(
    handler: UnauthenticatedHandler,
    config: LambdaHandlerConfig = {}
  ) {
    return async (
      event: APIGatewayProxyEvent
    ): Promise<APIGatewayProxyResult> => {
      try {
        // Handle OPTIONS requests
        if (event.httpMethod === "OPTIONS") {
          return ResponseUtil.noContent(event);
        }

        // Validate required path parameters
        if (config.validatePathParams) {
          for (const param of config.validatePathParams) {
            if (!event.pathParameters?.[param]) {
              return ResponseUtil.badRequest(
                event,
                `${param} is required in path`
              );
            }
          }
        }

        // Validate request body if required
        if (config.requireBody && !event.body) {
          return ResponseUtil.badRequest(event, "Request body is required");
        }

        // Call the actual handler
        return await handler(event);
      } catch (error) {
        console.error("❌ Lambda handler error:", error);
        return ResponseUtil.internalError(
          event,
          error instanceof Error ? error.message : "Internal server error"
        );
      }
    };
  }

  /**
   * Helper to parse JSON body with error handling
   */
  static parseJsonBody<T>(event: APIGatewayProxyEvent): T {
    if (!event.body) {
      throw new Error("Request body is required");
    }

    try {
      return JSON.parse(event.body) as T;
    } catch (error) {
      throw new Error("Invalid JSON in request body");
    }
  }

  /**
   * Helper to extract path parameter with validation
   */
  static getPathParam(
    event: APIGatewayProxyEvent,
    paramName: string
  ): string {
    const value = event.pathParameters?.[paramName];
    if (!value) {
      throw new Error(`${paramName} is required in path`);
    }
    return value;
  }

  /**
   * Helper to check ownership or admin privileges
   */
  static checkOwnershipOrAdmin(
    resourceCreatedBy: string,
    userId: string,
    userRole?: string
  ): boolean {
    const isOwner = resourceCreatedBy === userId;
    const isAdmin = userRole === "admin" || userRole === "moderator";
    return isOwner || isAdmin;
  }
}