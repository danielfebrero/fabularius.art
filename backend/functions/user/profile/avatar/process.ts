import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { S3Service } from "@shared/utils/s3";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { AvatarThumbnailService } from "@shared/utils/avatar-thumbnail";

interface ProcessAvatarRequest {
  avatarKey: string;
}

interface ProcessAvatarResponse {
  avatarUrl: string;
  avatarThumbnails: {
    originalSize?: string;
    small?: string;
    medium?: string;
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔍 /user/profile/avatar/process handler called");
  console.log("📋 Event method:", event.httpMethod);

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    console.log("⚡ Handling OPTIONS request");
    return ResponseUtil.noContent(event);
  }

  // Only allow POST method
  if (event.httpMethod !== "POST") {
    console.log("❌ Method not allowed:", event.httpMethod);
    return ResponseUtil.methodNotAllowed(event, "Only POST method allowed");
  }

  try {
    // Get user ID from authorizer context first
    let userId = event.requestContext.authorizer?.["userId"] as string;
    console.log("� UserId from authorizer:", userId);

    // Fallback to session validation if no userId from authorizer
    if (!userId) {
      console.log(
        "⚠️ No userId from authorizer, falling back to session validation"
      );
      const validation = await UserAuthMiddleware.validateSession(event);

      if (!validation.isValid || !validation.user) {
        console.log("❌ User session validation failed");
        return ResponseUtil.unauthorized(event, "User session required");
      }

      userId = validation.user.userId;
      console.log("✅ Got userId from session validation:", userId);
    }

    console.log("👤 Authenticated user ID:", userId);

    // Parse request body
    if (!event.body) {
      console.log("❌ Missing request body");
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    let processRequest: ProcessAvatarRequest;
    try {
      processRequest = JSON.parse(event.body);
    } catch (error) {
      console.log("❌ Invalid JSON in request body");
      return ResponseUtil.badRequest(event, "Invalid JSON in request body");
    }

    console.log("📝 Avatar process request:", processRequest);

    // Validate input data
    if (
      !processRequest.avatarKey ||
      typeof processRequest.avatarKey !== "string"
    ) {
      return ResponseUtil.badRequest(
        event,
        "Avatar key is required and must be a string"
      );
    }

    // Verify the avatar key belongs to the current user
    if (!processRequest.avatarKey.startsWith(`users/${userId}/avatar/`)) {
      return ResponseUtil.forbidden(
        event,
        "Avatar key does not belong to current user"
      );
    }

    console.log("📸 Processing avatar for user:", userId);

    // Download the uploaded avatar from S3
    const avatarBuffer = await S3Service.downloadBuffer(
      processRequest.avatarKey
    );
    if (!avatarBuffer) {
      return ResponseUtil.notFound(event, "Avatar file not found in S3");
    }

    // Determine content type from the file extension
    const getContentTypeFromKey = (key: string): string => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) {
        return "image/jpeg";
      }
      if (lowerKey.endsWith(".png")) {
        return "image/png";
      }
      if (lowerKey.endsWith(".webp")) {
        return "image/webp";
      }
      return "image/jpeg"; // Default fallback
    };

    const contentType = getContentTypeFromKey(processRequest.avatarKey);

    // Generate avatar thumbnails
    const avatarThumbnails =
      await AvatarThumbnailService.generateAvatarThumbnails(
        avatarBuffer,
        userId,
        contentType
      );

    console.log(
      "🎯 Generated avatar thumbnails:",
      Object.keys(avatarThumbnails)
    );

    // Update user record with avatar information
    const avatarUrl = S3Service.getRelativePath(processRequest.avatarKey);

    await DynamoDBService.updateUser(userId, {
      avatarUrl,
      avatarThumbnails,
    });

    console.log("✅ Updated user profile with avatar information");

    const response: ProcessAvatarResponse = {
      avatarUrl,
      avatarThumbnails,
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("💥 Avatar processing error:", error);
    return ResponseUtil.error(
      event,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
