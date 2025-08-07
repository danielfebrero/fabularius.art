import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { UserUtil } from "@shared/utils/user";
import { EmailService } from "@shared/utils/email";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { SessionUtil } from "@shared/utils/session";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    let token: string;

    // Handle both GET and POST requests
    if (event.httpMethod === "GET") {
      // GET request - token comes from query parameters
      token = event.queryStringParameters?.["token"] || "";
    } else {
      // POST request - token comes from request body
      const body = event.body ? JSON.parse(event.body) : {};
      token = body.token || "";
    }

    if (!token) {
      return ResponseUtil.badRequest(event, "Verification token is required");
    }

    // Verify the token
    const tokenVerification = await UserUtil.verifyEmailToken(token);

    if (!tokenVerification.isValid) {
      return ResponseUtil.badRequest(
        event,
        "Invalid or expired verification token. Please request a new verification email."
      );
    }

    const { userId, email } = tokenVerification;

    if (!userId || !email) {
      return ResponseUtil.badRequest(event, "Invalid verification token");
    }

    // Get user to check current status
    const userEntity = await DynamoDBService.getUserById(userId);

    if (!userEntity) {
      return ResponseUtil.notFound(event, "User not found");
    }

    if (userEntity.isEmailVerified) {
      return ResponseUtil.success(event, {
        message: "Email is already verified",
        user: UserUtil.sanitizeUserForResponse(userEntity),
      });
    }

    // Mark email as verified
    await UserUtil.markEmailVerified(userId);

    // Clean up the verification token
    await DynamoDBService.deleteEmailVerificationToken(token);

    // Get updated user data
    const updatedUser = await DynamoDBService.getUserById(userId);

    if (!updatedUser) {
      return ResponseUtil.internalError(event, "Failed to update user");
    }

    // Send welcome email
    try {
      const emailResult = await EmailService.sendWelcomeEmail(
        updatedUser.email,
        updatedUser.username
      );

      console.log("Welcome email sent:", {
        success: emailResult.success,
        messageId: emailResult.messageId,
        email: updatedUser.email,
      });
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      // Don't fail the verification if welcome email fails
    }

    // Create a new session to automatically log the user in
    return SessionUtil.createUserSessionResponse(
      event,
      {
        userId: updatedUser.userId,
        userEmail: updatedUser.email,
        updateLastLogin: true, // Update login timestamp since user is now logged in
      },
      "Email verified successfully! Welcome to PornSpot.ai"
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return ResponseUtil.internalError(event, "Email verification failed");
  }
};
