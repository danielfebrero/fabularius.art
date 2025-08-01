import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { UserUtil } from "@shared/utils/user";
import { EmailService } from "@shared/utils/email";
import { DynamoDBService } from "@shared/utils/dynamodb";

interface ResendVerificationRequest {
  email: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return ResponseUtil.noContent(event);
  }

  try {
    if (!event.body) {
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    const request: ResendVerificationRequest = JSON.parse(event.body);

    if (!request.email) {
      return ResponseUtil.badRequest(event, "Email is required");
    }

    // Validate email format
    if (!UserUtil.validateEmail(request.email)) {
      return ResponseUtil.badRequest(event, "Invalid email format");
    }

    // Always return the same response for security, regardless of whether email exists
    const standardResponse = {
      message:
        "If the email exists in our system, a verification email has been sent.",
    };

    // Get user by email
    const userEntity = await DynamoDBService.getUserByEmail(request.email);

    // If user doesn't exist, just return the standard response
    if (!userEntity) {
      console.log(
        "Resend verification attempt for non-existent email:",
        request.email
      );
      return ResponseUtil.success(event, standardResponse);
    }

    // If user is disabled, still return standard response to avoid revealing account status
    if (!userEntity.isActive) {
      console.log(
        "Resend verification attempt for disabled account:",
        userEntity.userId
      );
      return ResponseUtil.success(event, standardResponse);
    }

    // If email is already verified, still return standard response
    if (userEntity.isEmailVerified) {
      console.log(
        "Resend verification attempt for already verified email:",
        userEntity.userId
      );
      return ResponseUtil.success(event, standardResponse);
    }

    // Note: Rate limiting implementation is simplified for now
    // In production, implement proper rate limiting with Redis or DynamoDB TTL
    console.log("Sending verification email for user:", userEntity.userId);

    // Generate new verification token
    const verificationToken = await UserUtil.generateEmailVerificationToken(
      userEntity.userId,
      userEntity.email
    );

    // Send verification email
    try {
      const emailResult = await EmailService.sendVerificationEmail(
        userEntity.email,
        verificationToken,
        userEntity.firstName
      );

      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error);
        // Still return standard response to avoid revealing system errors
        return ResponseUtil.success(event, standardResponse);
      }

      console.log("Verification email resent successfully:", {
        messageId: emailResult.messageId,
        email: userEntity.email,
        userId: userEntity.userId,
      });
    } catch (error) {
      console.error("Email sending error:", error);
      // Still return standard response to avoid revealing system errors
      return ResponseUtil.success(event, standardResponse);
    }

    // Always return the same response regardless of the actual outcome
    return ResponseUtil.success(event, standardResponse);
  } catch (error) {
    console.error("Resend verification error:", error);
    return ResponseUtil.internalError(
      event,
      "Failed to resend verification email"
    );
  }
};
