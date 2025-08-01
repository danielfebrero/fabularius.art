import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";

interface PublicUserProfile {
  userId: string;
  username?: string;
  createdAt: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  bio?: string;
  location?: string;
  website?: string;
}

interface GetPublicProfileResponse {
  user: PublicUserProfile;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔍 /user/profile/get handler called");
  console.log("📋 Event method:", event.httpMethod);

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    console.log("⚡ Handling OPTIONS request");
    return ResponseUtil.noContent(event);
  }

  // Only allow GET method
  if (event.httpMethod !== "GET") {
    console.log("❌ Method not allowed:", event.httpMethod);
    return ResponseUtil.methodNotAllowed(event, "Only GET method allowed");
  }

  try {
    // Get user ID from request context (set by the user authorizer)
    let currentUserId = event.requestContext.authorizer?.["userId"];

    console.log("👤 CurrentUserId from authorizer:", currentUserId);
    console.log(
      "🔍 Event authorizer:",
      JSON.stringify(event.requestContext.authorizer, null, 2)
    );

    // Authentication is required - try to get user ID if available
    if (!currentUserId) {
      console.log(
        "⚠️ No userId from authorizer, attempting session validation"
      );
      const validation = await UserAuthMiddleware.validateSession(event);

      if (!validation.isValid || !validation.user) {
        console.log("❌ Session validation failed");
        return ResponseUtil.unauthorized(event, "User session required");
      }

      currentUserId = validation.user.userId;
      console.log(
        "✅ Got currentUserId from session validation:",
        currentUserId
      );
    }

    console.log("👤 Authenticated user ID:", currentUserId);

    // Get username from query parameter
    const username = event.queryStringParameters?.["username"];
    if (!username) {
      console.log("❌ Missing username parameter");
      return ResponseUtil.badRequest(event, "Username parameter is required");
    }

    console.log("🔍 Looking up user by username:", username);

    // Get user by username
    const userEntity = await DynamoDBService.getUserByUsername(username);
    if (!userEntity) {
      console.log("❌ User not found with username:", username);
      return ResponseUtil.notFound(event, "User not found");
    }

    // Check if user is active
    if (!userEntity.isActive) {
      console.log("❌ User is inactive:", username);
      return ResponseUtil.notFound(event, "User not found");
    }

    console.log("✅ Found user:", userEntity.userId, userEntity.email);

    // Prepare public profile response (excluding sensitive information)
    const publicProfile: PublicUserProfile = {
      userId: userEntity.userId,
      username: userEntity.username,
      createdAt: userEntity.createdAt,
      isActive: userEntity.isActive,
      isEmailVerified: userEntity.isEmailVerified,
      ...(userEntity.lastLoginAt && { lastLoginAt: userEntity.lastLoginAt }),
      ...(userEntity.bio && { bio: userEntity.bio }),
      ...(userEntity.location && { location: userEntity.location }),
      ...(userEntity.website && { website: userEntity.website }),
    };

    console.log("✅ Returning public profile for user:", username);

    const response: GetPublicProfileResponse = {
      user: publicProfile,
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("💥 Get public profile error:", error);
    console.error(
      "💥 Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return ResponseUtil.internalError(event, "Failed to get user profile");
  }
};
