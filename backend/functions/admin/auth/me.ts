import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "../../../shared/utils/response";
import { DynamoDBService } from "../../../shared/utils/dynamodb";
import { AdminUser } from "../../../shared/types";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    const adminId = event.requestContext.authorizer?.["adminId"] as string;

    if (!adminId) {
      return ResponseUtil.unauthorized(event, "No admin session found");
    }

    const adminEntity = await DynamoDBService.getAdminById(adminId);
    if (!adminEntity) {
      return ResponseUtil.notFound(event, "Admin user not found");
    }

    // Return admin info (without sensitive data)
    const admin: AdminUser = {
      adminId: adminEntity.adminId,
      username: adminEntity.username,
      createdAt: adminEntity.createdAt,
      isActive: adminEntity.isActive,
    };

    return ResponseUtil.success(event, { admin });
  } catch (error) {
    console.error("Get admin info error:", error);
    return ResponseUtil.internalError(event, "Failed to get admin info");
  }
};
