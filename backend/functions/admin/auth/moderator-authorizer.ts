import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { PlanUtil } from "@shared/utils/plan";

// Helper function to generate an IAM policy
const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context?: { [key: string]: any }
): APIGatewayAuthorizerResult => {
  const authResponse: any = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };

  if (context) {
    authResponse.context = context;
  }

  return authResponse;
};

/**
 * Moderator Authorizer - Allows admin and moderator roles
 * This authorizer validates user sessions and checks if the user has moderator or admin role
 */
export const handler = async (
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log("📋 ModeratorAuthorizer event:", JSON.stringify(event, null, 2));
  console.log("🎯 ModeratorAuthorizer method ARN:", event.methodArn);

  // Allow OPTIONS requests to pass through without authentication (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    console.log("OPTIONS request detected, allowing without authentication");
    return generatePolicy("anonymous", "Allow", event.methodArn, {
      requestType: "OPTIONS",
    });
  }

  try {
    const cookieHeader = event.headers?.["Cookie"] || event.headers?.["cookie"];
    console.log("🍪 Cookie header found:", !!cookieHeader);

    if (!cookieHeader) {
      console.log("❌ No cookie header found");
      throw new Error("No authentication cookie found");
    }

    console.log("🔧 Creating mock event for session validation...");
    const mockEvent: any = {
      headers: {
        Cookie: cookieHeader,
      },
    };

    console.log("⚡ Calling UserAuthMiddleware.validateSession...");
    const userValidation = await UserAuthMiddleware.validateSession(mockEvent);
    console.log("📊 User validation result:", {
      isValid: userValidation.isValid,
      hasUser: !!userValidation.user,
      userId: userValidation.user?.userId,
      email: userValidation.user?.email,
    });

    if (userValidation.isValid && userValidation.user) {
      console.log("✅ User session is valid. Checking role...");

      // Get user role
      const userRole = await PlanUtil.getUserRole(
        userValidation.user.userId,
        userValidation.user.email
      );

      console.log("👤 User role:", userRole);

      // Check if user has admin or moderator role
      if (userRole === "admin" || userRole === "moderator") {
        console.log("🎉 User has admin/moderator role. Allowing access.");

        const userContext = {
          userId: userValidation.user.userId,
          email: userValidation.user.email,
          userRole: userRole,
          sessionId: userValidation.session?.sessionId || "",
        };

        return generatePolicy(
          userValidation.user.userId,
          "Allow",
          event.methodArn,
          userContext
        );
      } else {
        console.log("❌ User does not have admin/moderator role:", userRole);
        throw new Error("Insufficient permissions");
      }
    } else {
      console.log("❌ User session validation failed");
      throw new Error("Invalid session");
    }
  } catch (error) {
    console.error("ModeratorAuthorizer: Authorization failed", error);

    // Return explicit deny policy
    return generatePolicy("unauthorized", "Deny", event.methodArn);
  }
};
