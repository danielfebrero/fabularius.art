import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { AuthMiddleware } from "./middleware";
import { UserAuthMiddleware } from "../../user/auth/middleware";

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

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Authorizer event:", JSON.stringify(event, null, 2));
  console.log("Authorizer method ARN:", event.methodArn);

  // Allow OPTIONS requests to pass through without authentication (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    console.log("OPTIONS request detected, allowing without authentication");
    try {
      const { methodArn } = event;
      const parts = methodArn.split(":");
      const region = parts[3];
      const accountId = parts[4];
      const apiGatewayArnPart = parts[5];

      if (apiGatewayArnPart && region && accountId) {
        const [apiId, stage] = apiGatewayArnPart.split("/");
        if (apiId && stage) {
          const wildcardResource = `arn:aws:execute-api:${region}:${accountId}:${apiId}/${stage}/*`;

          return generatePolicy("anonymous", "Allow", wildcardResource, {
            requestType: "OPTIONS",
          });
        }
      }

      // Fallback: allow the specific resource if ARN parsing fails
      console.log("ARN parsing failed for OPTIONS, allowing specific resource");
      return generatePolicy("anonymous", "Allow", event.methodArn, {
        requestType: "OPTIONS",
      });
    } catch (error) {
      console.error("Error handling OPTIONS request:", error);
      // Even if there's an error, allow OPTIONS to pass through
      return generatePolicy("anonymous", "Allow", event.methodArn, {
        requestType: "OPTIONS",
      });
    }
  }

  try {
    const cookieHeader = event.headers?.["Cookie"] || event.headers?.["cookie"];

    if (!cookieHeader) {
      console.log("No cookie header found, denying access.");
      return generatePolicy("anonymous", "Deny", event.methodArn);
    }

    const mockEvent: any = {
      headers: {
        Cookie: cookieHeader,
      },
    };

    // First try admin session validation (backward compatibility)
    const adminValidation = await AuthMiddleware.validateSession(mockEvent);

    if (adminValidation.isValid && adminValidation.admin) {
      console.log("Admin session is valid. Allowing access.");
      const adminContext = {
        adminId: adminValidation.admin.adminId,
        username: adminValidation.admin.username,
        sessionType: "admin",
      };

      // Reconstruct the ARN to grant access to all endpoints for this stage
      const { methodArn } = event;
      const parts = methodArn.split(":");
      const region = parts[3];
      const accountId = parts[4];
      const apiGatewayArnPart = parts[5];

      if (!apiGatewayArnPart) {
        console.error("Could not parse method ARN, denying access.");
        return generatePolicy("admin", "Deny", event.methodArn);
      }

      const [apiId, stage] = apiGatewayArnPart.split("/");

      // Grant access to all methods on all resources for this stage
      const wildcardResource = `arn:aws:execute-api:${region}:${accountId}:${apiId}/${stage}/*`;

      return generatePolicy(
        adminValidation.admin.adminId,
        "Allow",
        wildcardResource,
        adminContext
      );
    }

    // If admin session validation failed, try user session validation
    const userValidation = await UserAuthMiddleware.validateSession(mockEvent);

    if (userValidation.isValid && userValidation.user) {
      console.log("User session is valid. Allowing access.");
      const userContext = {
        userId: userValidation.user.userId,
        email: userValidation.user.email,
        sessionType: "user",
      };

      // Reconstruct the ARN to grant access to user and public endpoints
      const { methodArn } = event;
      const parts = methodArn.split(":");
      const region = parts[3];
      const accountId = parts[4];
      const apiGatewayArnPart = parts[5];

      if (!apiGatewayArnPart) {
        console.error("Could not parse method ARN, denying access.");
        return generatePolicy("user", "Deny", event.methodArn);
      }

      const [apiId, stage] = apiGatewayArnPart.split("/");

      // Grant access to user and public endpoints (exclude admin-only endpoints)
      const wildcardResource = `arn:aws:execute-api:${region}:${accountId}:${apiId}/${stage}/*`;

      return generatePolicy(
        userValidation.user.userId,
        "Allow",
        wildcardResource,
        userContext
      );
    }

    console.log("No valid session found. Denying access.");
    return generatePolicy("anonymous", "Deny", event.methodArn);
  } catch (error) {
    console.error("Authorizer error:", error);
    return generatePolicy("user", "Deny", event.methodArn);
  }
};
