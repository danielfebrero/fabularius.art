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

    // Get user by email
    const userEntity = await DynamoDBService.getUserByEmail(request.email);

    if (!userEntity) {
      // For security, don't reveal if the email exists or not
      return ResponseUtil.success(event, {
        message:
          "If the email exists in our system, a verification email has been sent.",
      });
    }

    if (!userEntity.isActive) {
      return ResponseUtil.forbidden(event, "Account is disabled");
    }

    if (userEntity.isEmailVerified) {
      return ResponseUtil.badRequest(event, "Email is already verified");
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
        return ResponseUtil.internalError(
          event,
          "Failed to send verification email"
        );
      }

      console.log("Verification email resent successfully:", {
        messageId: emailResult.messageId,
        email: userEntity.email,
        userId: userEntity.userId,
      });
    } catch (error) {
      console.error("Email sending error:", error);
      return ResponseUtil.internalError(
        event,
        "Failed to send verification email"
      );
    }

    const responseData = {
      message: "Verification email sent successfully. Please check your inbox.",
      email: userEntity.email,
    };

    return ResponseUtil.success(event, responseData);
  } catch (error) {
    console.error("Resend verification error:", error);
    return ResponseUtil.internalError(
      event,
      "Failed to resend verification email"
    );
  }
};
