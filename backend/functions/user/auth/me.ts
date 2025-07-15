import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "../../../shared/utils/response";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { UserUtil } from "../../../shared/utils/user";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    const userId = event.requestContext.authorizer?.["userId"] as string;

    if (!userId) {
      return ResponseUtil.unauthorized(event, "No user session found");
    }

    const userEntity = await DynamoDBService.getUserById(userId);
    if (!userEntity) {
      return ResponseUtil.notFound(event, "User not found");
    }

    // Return user info (without sensitive data)
    const user = UserUtil.sanitizeUserForResponse(userEntity);

    return ResponseUtil.success(event, { user });
  } catch (error) {
    console.error("Get user info error:", error);
    return ResponseUtil.internalError(event, "Failed to get user info");
  }
};
