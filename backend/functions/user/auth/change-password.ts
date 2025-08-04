import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthUtil } from "@shared/utils/user-auth";
import bcrypt from "bcryptjs";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔍 /user/auth/change-password handler called");
  console.log("📋 Event method:", event.httpMethod);

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    console.log("⚡ Handling OPTIONS request");
    return ResponseUtil.noContent(event);
  }

  // Only allow PUT method
  if (event.httpMethod !== "PUT") {
    console.log("❌ Method not allowed:", event.httpMethod);
    return ResponseUtil.methodNotAllowed(event, "Only PUT method allowed");
  }

  try {
    // Extract user authentication using centralized utility
    console.log("🔑 Validating user session...");
    const authResult = await UserAuthUtil.requireAuth(event);

    // Handle error response from authentication
    if (UserAuthUtil.isErrorResponse(authResult)) {
      console.log("❌ User session validation failed");
      return authResult;
    }

    const userId = authResult.userId!;
    console.log(`✅ User session valid: ${userId}`);

    // Get full user entity to access password information
    console.log("📋 Fetching user authentication details...");
    const userEntity = await DynamoDBService.getUserById(userId);

    if (!userEntity) {
      console.log("❌ User entity not found");
      return ResponseUtil.unauthorized(event, "User not found");
    }

    // Check if user has a password (not OAuth user)
    if (userEntity.googleId) {
      console.log("❌ OAuth user cannot change password");
      return ResponseUtil.badRequest(
        event,
        "OAuth users cannot change password. Manage your password through your OAuth provider."
      );
    }

    if (!userEntity.passwordHash) {
      console.log("❌ User has no password set");
      return ResponseUtil.badRequest(
        event,
        "No password is set for this account"
      );
    }

    // Parse request body
    let requestData: ChangePasswordRequest;
    try {
      requestData = JSON.parse(event.body || "{}");
    } catch (error) {
      console.log("❌ Invalid JSON in request body");
      return ResponseUtil.badRequest(event, "Invalid request body");
    }

    const { currentPassword, newPassword } = requestData;

    // Validate request
    if (!currentPassword || !newPassword) {
      console.log("❌ Missing required fields");
      return ResponseUtil.badRequest(
        event,
        "Current password and new password are required"
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      console.log("❌ New password too short");
      return ResponseUtil.badRequest(
        event,
        "New password must be at least 8 characters long"
      );
    }

    // Password strength validation (same as registration)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.log("❌ New password doesn't meet requirements");
      return ResponseUtil.badRequest(
        event,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
    }

    // Verify current password
    console.log("🔓 Verifying current password...");
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userEntity.passwordHash!
    );

    if (!isCurrentPasswordValid) {
      console.log("❌ Current password is incorrect");
      return ResponseUtil.badRequest(event, "Current password is incorrect");
    }

    // Hash new password
    console.log("🔐 Hashing new password...");
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    console.log("💾 Updating password in database...");
    await DynamoDBService.updateUser(userId, {
      passwordHash: newPasswordHash,
    });

    console.log("✅ Password changed successfully");

    const response: ChangePasswordResponse = {
      message: "Password changed successfully",
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("💥 Error changing password:", error);
    return ResponseUtil.internalError(event, "Failed to change password");
  }
};
