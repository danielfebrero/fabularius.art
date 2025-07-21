import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { AdminUser } from "@shared/types";
import { AuthMiddleware } from "@shared/auth/admin-middleware";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔍 /admin/me handler called");
  console.log(
    "📋 Request context:",
    JSON.stringify(event.requestContext, null, 2)
  );

  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    let adminId = event.requestContext.authorizer?.["adminId"] as string;

    console.log("👤 AdminId from authorizer:", adminId);

    // Fallback for local development or when authorizer context is missing
    if (!adminId) {
      console.log(
        "⚠️ No adminId from authorizer, falling back to session validation"
      );
      const validation = await AuthMiddleware.validateSession(event);

      if (!validation.isValid || !validation.admin) {
        console.log("❌ Session validation failed");
        return ResponseUtil.unauthorized(event, "No admin session found");
      }

      adminId = validation.admin.adminId;
      console.log("✅ Got adminId from session validation:", adminId);
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
