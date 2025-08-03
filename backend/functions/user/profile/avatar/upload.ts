import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { S3Service } from "@shared/utils/s3";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";

interface AvatarUploadRequest {
  filename: string;
  contentType: string;
}

interface AvatarUploadResponse {
  uploadUrl: string;
  avatarKey: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔍 /user/profile/avatar/upload handler called");
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

    let uploadRequest: AvatarUploadRequest;
    try {
      uploadRequest = JSON.parse(event.body);
    } catch (error) {
      console.log("❌ Invalid JSON in request body");
      return ResponseUtil.badRequest(event, "Invalid JSON in request body");
    }

    console.log("📝 Avatar upload request:", uploadRequest);

    // Validate input data
    const validationErrors: string[] = [];

    if (!uploadRequest.filename || typeof uploadRequest.filename !== "string") {
      validationErrors.push("Filename is required and must be a string");
    }

    if (
      !uploadRequest.contentType ||
      typeof uploadRequest.contentType !== "string"
    ) {
      validationErrors.push("Content type is required and must be a string");
    }

    // Validate file type - only allow image files
    if (
      uploadRequest.contentType &&
      !uploadRequest.contentType.startsWith("image/")
    ) {
      validationErrors.push("Only image files are allowed for avatars");
    }

    // Validate supported image types
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (
      uploadRequest.contentType &&
      !supportedTypes.includes(uploadRequest.contentType)
    ) {
      validationErrors.push(
        `Unsupported image type. Supported types: ${supportedTypes.join(", ")}`
      );
    }

    if (validationErrors.length > 0) {
      console.log("❌ Validation errors:", validationErrors);
      return ResponseUtil.badRequest(event, validationErrors.join(", "));
    }

    // Generate presigned upload URL using S3Service
    console.log("🔑 Generating presigned upload URL for avatar");
    const { uploadUrl, key: avatarKey } =
      await S3Service.generateAvatarPresignedUploadUrl(
        userId,
        uploadRequest.filename,
        uploadRequest.contentType
      );

    console.log("✅ Generated presigned upload URL for avatar");

    const response: AvatarUploadResponse = {
      uploadUrl,
      avatarKey,
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("💥 Avatar upload endpoint error:", error);
    return ResponseUtil.error(
      event,
      error instanceof Error ? error.message : "Internal server error"
    );
  }
};
