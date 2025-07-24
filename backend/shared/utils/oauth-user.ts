import { v4 as uuidv4 } from "uuid";
import { DynamoDBService } from "./dynamodb";
import { UserEntity } from "@shared/types/user";

export class OAuthUserUtil {
  /**
   * Update user's last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await DynamoDBService.updateUser(userId, {
      lastLoginAt: new Date().toISOString(),
    });
  }

  /**
   * Create a new Google user (without password)
   */
  static async createGoogleUser(
    googleId: string,
    email: string,
    isActive: boolean = true
  ): Promise<string> {
    // Check if Google ID already exists
    const existingGoogleUser = await DynamoDBService.getUserByGoogleId(
      googleId
    );
    if (existingGoogleUser) {
      throw new Error("Google account already linked to another user");
    }

    // Generate a unique username from email
    const baseUsername = email
      ? email
          .split("@")[0]
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "google_user"
      : "user";
    let username = baseUsername;
    let counter = 1;

    // Ensure username is unique
    while (await DynamoDBService.getUserByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const userId = uuidv4();
    const now = new Date().toISOString();

    const userEntity: Partial<UserEntity> = {
      PK: `USER#${userId}`,
      SK: "METADATA",
      GSI1PK: "USER_EMAIL",
      GSI1SK: email.toLowerCase(),
      GSI2PK: "USER_GOOGLE",
      GSI2SK: googleId,
      GSI3PK: "USER_USERNAME",
      GSI3SK: username.toLowerCase(),
      EntityType: "User",
      userId,
      email: email.toLowerCase(),
      username,
      provider: "google",
      createdAt: now,
      isActive,
      isEmailVerified: true, // Google accounts are pre-verified
      googleId,
    };

    await DynamoDBService.createUser(userEntity as UserEntity);

    return userId;
  }

  /**
   * Link Google account to existing user
   */
  static async linkGoogleToUser(
    userId: string,
    googleId: string
  ): Promise<void> {
    const user = await DynamoDBService.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if Google ID already exists
    const existingGoogleUser = await DynamoDBService.getUserByGoogleId(
      googleId
    );
    if (existingGoogleUser && existingGoogleUser.userId !== userId) {
      throw new Error("Google account already linked to another user");
    }

    const updateData: Partial<UserEntity> = {
      googleId,
      GSI2PK: "USER_GOOGLE",
      GSI2SK: googleId,
      isEmailVerified: true, // Mark email as verified when linking Google
    };

    await DynamoDBService.updateUser(userId, updateData);
  }

  /**
   * Create or link Google user account
   */
  static async createOrLinkGoogleUser(
    googleId: string,
    email: string
  ): Promise<{ userId: string; isNewUser: boolean }> {
    // Check if user exists by email
    const existingEmailUser = await DynamoDBService.getUserByEmail(email);

    if (existingEmailUser) {
      // Link Google account to existing user
      await this.linkGoogleToUser(existingEmailUser.userId, googleId);

      return {
        userId: existingEmailUser.userId,
        isNewUser: false,
      };
    } else {
      // Create new Google user
      const userId = await this.createGoogleUser(googleId, email);

      return {
        userId,
        isNewUser: true,
      };
    }
  }

  /**
   * Generate OAuth state parameter for CSRF protection
   */
  static generateOAuthState(): string {
    return uuidv4();
  }

  /**
   * Validate OAuth state parameter
   */
  static validateOAuthState(
    receivedState: string,
    expectedState: string
  ): boolean {
    return receivedState === expectedState && receivedState.length > 0;
  }
}
