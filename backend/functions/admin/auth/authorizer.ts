import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { AuthMiddleware } from "./middleware";

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

  try {
    const cookieHeader = event.headers?.["Cookie"] || event.headers?.["cookie"];

    if (!cookieHeader) {
      console.log("No cookie header found, denying access.");
      return generatePolicy("user", "Deny", event.methodArn);
    }

    const mockEvent: any = {
      headers: {
        Cookie: cookieHeader,
      },
    };

    const validation = await AuthMiddleware.validateSession(mockEvent);

    if (validation.isValid && validation.admin) {
      console.log("Session is valid. Allowing access.");
      const adminContext = {
        adminId: validation.admin.adminId,
        username: validation.admin.username,
      };

      // Reconstruct the ARN to grant access to all admin endpoints for this stage
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

      // Grant access to all methods on all resources for this stage
      const wildcardResource = `arn:aws:execute-api:${region}:${accountId}:${apiId}/${stage}/*`;

      return generatePolicy(
        validation.admin.adminId,
        "Allow",
        wildcardResource,
        adminContext
      );
    } else {
      console.log("Session is invalid. Denying access.");
      return generatePolicy("user", "Deny", event.methodArn);
    }
  } catch (error) {
    console.error("Authorizer error:", error);
    return generatePolicy("user", "Deny", event.methodArn);
  }
};
