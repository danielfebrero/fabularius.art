import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ResponseUtil } from "@shared/utils/response";
import { DynamoDBService } from "@shared/utils/dynamodb";
import { UserAuthMiddleware } from "@shared/auth/user-middleware";
import { UserEntity } from "@shared/types/user";

interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  preferredLanguage?: string;
}

interface UpdateProfileResponse {
  message: string;
  user?: {
    userId: string;
    email: string;
    username: string;
    bio?: string;
    location?: string;
    website?: string;
    preferredLanguage?: string;
    createdAt: string;
    lastLoginAt?: string;
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("🔍 /user/profile/edit handler called");
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
    // Validate user session
    console.log("🔑 Validating user session...");
    const validation = await UserAuthMiddleware.validateSession(event);

    if (!validation.isValid || !validation.user) {
      console.log("❌ User session validation failed");
      return ResponseUtil.unauthorized(event, "User session required");
    }

    const currentUser = validation.user;
    console.log(
      "👤 Authenticated user:",
      currentUser.userId,
      currentUser.email
    );

    // Get the full user entity to access profile fields
    const currentUserEntity = await DynamoDBService.getUserById(
      currentUser.userId
    );
    if (!currentUserEntity) {
      console.log("❌ User entity not found");
      return ResponseUtil.notFound(event, "User not found");
    }

    // Parse request body
    if (!event.body) {
      console.log("❌ Missing request body");
      return ResponseUtil.badRequest(event, "Request body is required");
    }

    let updateData: UpdateProfileRequest;
    try {
      updateData = JSON.parse(event.body);
    } catch (error) {
      console.log("❌ Invalid JSON in request body");
      return ResponseUtil.badRequest(event, "Invalid JSON in request body");
    }

    console.log("📝 Profile update data:", updateData);

    // Validate input data
    const validationErrors: string[] = [];

    // Username validation
    if (updateData.username !== undefined) {
      if (typeof updateData.username !== "string") {
        validationErrors.push("Username must be a string");
      } else if (updateData.username.trim().length === 0) {
        validationErrors.push("Username cannot be empty");
      } else if (updateData.username.trim().length < 3) {
        validationErrors.push("Username must be at least 3 characters long");
      } else if (updateData.username.trim().length > 30) {
        validationErrors.push("Username cannot be longer than 30 characters");
      } else if (!/^[a-zA-Z0-9_-]+$/.test(updateData.username.trim())) {
        validationErrors.push(
          "Username can only contain letters, numbers, underscores, and hyphens"
        );
      }
    }

    // Bio validation
    if (updateData.bio !== undefined && typeof updateData.bio !== "string") {
      validationErrors.push("Bio must be a string");
    } else if (updateData.bio && updateData.bio.length > 500) {
      validationErrors.push("Bio cannot be longer than 500 characters");
    }

    // Location validation
    if (
      updateData.location !== undefined &&
      typeof updateData.location !== "string"
    ) {
      validationErrors.push("Location must be a string");
    } else if (updateData.location && updateData.location.length > 100) {
      validationErrors.push("Location cannot be longer than 100 characters");
    }

    // Website validation
    if (
      updateData.website !== undefined &&
      typeof updateData.website !== "string"
    ) {
      validationErrors.push("Website must be a string");
    } else if (updateData.website && updateData.website.length > 200) {
      validationErrors.push("Website cannot be longer than 200 characters");
    } else if (updateData.website && updateData.website.trim().length > 0) {
      // Simple URL validation
      const urlRegex =
        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlRegex.test(updateData.website.trim())) {
        validationErrors.push("Website must be a valid URL");
      }
    }

    // Preferred language validation
    if (
      updateData.preferredLanguage !== undefined &&
      typeof updateData.preferredLanguage !== "string"
    ) {
      validationErrors.push("Preferred language must be a string");
    } else if (updateData.preferredLanguage) {
      // Validate against supported locales
      const supportedLanguages = ["de", "en", "es", "fr", "ru", "zh"];
      if (!supportedLanguages.includes(updateData.preferredLanguage)) {
        validationErrors.push(
          `Preferred language must be one of: ${supportedLanguages.join(", ")}`
        );
      }
    }

    if (validationErrors.length > 0) {
      console.log("❌ Validation errors:", validationErrors);
      return ResponseUtil.badRequest(
        event,
        `Validation failed: ${validationErrors.join(", ")}`
      );
    }

    // Check if username is being changed and if it's already taken
    if (
      updateData.username &&
      updateData.username.trim().toLowerCase() !==
        (currentUserEntity.username || "").toLowerCase()
    ) {
      console.log("🔍 Checking username availability...");
      const existingUser = await DynamoDBService.getUserByUsername(
        updateData.username.trim()
      );
      if (existingUser && existingUser.userId !== currentUserEntity.userId) {
        console.log("❌ Username already taken:", updateData.username);
        return ResponseUtil.badRequest(event, "Username is already taken");
      }
    }

    // Prepare update data
    const updates: Partial<UserEntity> = {};

    if (
      updateData.username !== undefined &&
      updateData.username.trim() !== currentUserEntity.username
    ) {
      // Username is being changed, update GSI3 fields as well
      updates.username = updateData.username.trim();
      updates.GSI3SK = updateData.username.trim().toLowerCase();
    }

    if (updateData.bio !== undefined) {
      if (updateData.bio.trim()) {
        updates.bio = updateData.bio.trim();
      } else {
        delete updates.bio; // Remove the field entirely if empty
      }
    }

    if (updateData.location !== undefined) {
      if (updateData.location.trim()) {
        updates.location = updateData.location.trim();
      } else {
        delete updates.location; // Remove the field entirely if empty
      }
    }

    if (updateData.website !== undefined) {
      let website = updateData.website.trim();
      if (website) {
        if (!website.startsWith("http://") && !website.startsWith("https://")) {
          website = `https://${website}`;
        }
        updates.website = website;
      } else {
        delete updates.website; // Remove the field entirely if empty
      }
    }

    if (updateData.preferredLanguage !== undefined) {
      if (updateData.preferredLanguage.trim()) {
        updates.preferredLanguage = updateData.preferredLanguage.trim();
      } else {
        delete updates.preferredLanguage; // Remove the field entirely if empty
      }
    }

    // Only proceed if there are actually changes to make
    if (Object.keys(updates).length === 0) {
      console.log("ℹ️ No changes to apply");
      const response: UpdateProfileResponse = {
        message: "No changes to apply",
        user: {
          userId: currentUserEntity.userId,
          email: currentUserEntity.email,
          username: currentUserEntity.username,
          ...(currentUserEntity.bio && { bio: currentUserEntity.bio }),
          ...(currentUserEntity.location && {
            location: currentUserEntity.location,
          }),
          ...(currentUserEntity.website && {
            website: currentUserEntity.website,
          }),
          ...(currentUserEntity.preferredLanguage && {
            preferredLanguage: currentUserEntity.preferredLanguage,
          }),
          createdAt: currentUserEntity.createdAt,
          ...(currentUserEntity.lastLoginAt && {
            lastLoginAt: currentUserEntity.lastLoginAt,
          }),
        },
      };

      return ResponseUtil.success(event, response);
    }

    console.log("💾 Updating user profile with:", updates);

    // Update the user in the database
    await DynamoDBService.updateUser(currentUserEntity.userId, updates);

    // Fetch the updated user data
    const updatedUser = await DynamoDBService.getUserById(
      currentUserEntity.userId
    );
    if (!updatedUser) {
      console.log("❌ Failed to fetch updated user");
      return ResponseUtil.internalError(
        event,
        "Failed to fetch updated user data"
      );
    }

    console.log("✅ Profile updated successfully");

    // Return the updated user data using ResponseUtil.success
    const response: UpdateProfileResponse = {
      message: "Profile updated successfully",
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        username: updatedUser.username,
        ...(updatedUser.bio && { bio: updatedUser.bio }),
        ...(updatedUser.location && { location: updatedUser.location }),
        ...(updatedUser.website && { website: updatedUser.website }),
        ...(updatedUser.preferredLanguage && {
          preferredLanguage: updatedUser.preferredLanguage,
        }),
        createdAt: updatedUser.createdAt,
        ...(updatedUser.lastLoginAt && {
          lastLoginAt: updatedUser.lastLoginAt,
        }),
      },
    };

    return ResponseUtil.success(event, response);
  } catch (error) {
    console.error("💥 Profile update error:", error);
    console.error(
      "💥 Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return ResponseUtil.internalError(event, "Failed to update profile");
  }
};
