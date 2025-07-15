import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "../../../shared/utils/response";
import { UserUtil } from "../../../shared/utils/user";
import { EmailService } from "../../../shared/utils/email";
import { UserRegistrationRequest } from "../../../shared/types";

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

    const request: UserRegistrationRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.email || !request.password) {
      return ResponseUtil.badRequest(event, "Email and password are required");
    }

    // Validate email format
    if (!UserUtil.validateEmail(request.email)) {
      return ResponseUtil.badRequest(event, "Invalid email format");
    }

    // Validate password strength
    const passwordValidation = UserUtil.validatePassword(request.password);
    if (!passwordValidation.isValid) {
      return ResponseUtil.badRequest(
        event,
        `Password validation failed: ${passwordValidation.errors.join(", ")}`
      );
    }

    // Validate optional username if provided
    if (request.username && request.username.trim().length < 3) {
      return ResponseUtil.badRequest(
        event,
        "Username must be at least 3 characters long"
      );
    }

    try {
      const userId = await UserUtil.createUser(
        request.email,
        request.password,
        request.username?.trim(),
        request.firstName?.trim(),
        request.lastName?.trim()
      );

      // Generate email verification token
      const verificationToken = await UserUtil.generateEmailVerificationToken(
        userId,
        request.email
      );

      // Send verification email
      try {
        const emailResult = await EmailService.sendVerificationEmail(
          request.email,
          verificationToken,
          request.firstName?.trim()
        );

        if (!emailResult.success) {
          console.error(
            "Failed to send verification email:",
            emailResult.error
          );
          // Don't fail registration if email sending fails
        } else {
          console.log("Verification email sent successfully:", {
            messageId: emailResult.messageId,
            email: request.email,
            userId,
          });
        }
      } catch (emailError) {
        console.error("Email sending error during registration:", emailError);
        // Don't fail registration if email sending fails
      }

      const responseData = {
        userId,
        email: request.email.toLowerCase(),
        username: request.username?.trim(),
        firstName: request.firstName?.trim(),
        lastName: request.lastName?.trim(),
        message:
          "User registered successfully. Please check your email for verification.",
      };

      return ResponseUtil.created(event, responseData);
    } catch (error: any) {
      if (error.message === "Email already exists") {
        return ResponseUtil.badRequest(event, "Email is already registered");
      }
      throw error;
    }
  } catch (error) {
    console.error("User registration error:", error);
    return ResponseUtil.internalError(event, "Registration failed");
  }
};
