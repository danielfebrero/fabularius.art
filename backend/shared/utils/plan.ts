// Plan and subscription utilities
import { DynamoDBService } from './dynamodb';
import { UserEntity } from '../types/user';

export type UserPlan = 'free' | 'starter' | 'unlimited' | 'pro';
export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserPlanInfo {
  plan: UserPlan;
  isActive: boolean;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  planStartDate?: string;
  planEndDate?: string;
}

export interface UserUsageStats {
  imagesGeneratedThisMonth: number;
  imagesGeneratedToday: number;
  lastGenerationAt?: string;
}

export interface EnhancedUser {
  userId: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  googleId?: string;
  role: UserRole;
  planInfo: UserPlanInfo;
  usageStats: UserUsageStats;
}

export class PlanUtil {
  /**
   * Get user plan information from database
   */
  static async getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
    try {
      const userEntity = await DynamoDBService.getUserById(userId);
      
      if (!userEntity) {
        // Return default free plan for non-existent users
        return {
          plan: 'free',
          isActive: true,
          subscriptionStatus: 'active',
          planStartDate: new Date().toISOString(),
        };
      }

      // Extract plan info from user entity
      const planInfo: UserPlanInfo = {
        plan: userEntity.plan || 'free',
        isActive: userEntity.subscriptionStatus === 'active' || userEntity.plan === 'free',
        subscriptionStatus: userEntity.subscriptionStatus || 'active',
        planStartDate: userEntity.planStartDate || userEntity.createdAt,
      };

      // Only include optional fields if they exist
      if (userEntity.subscriptionId) {
        planInfo.subscriptionId = userEntity.subscriptionId;
      }
      if (userEntity.planEndDate) {
        planInfo.planEndDate = userEntity.planEndDate;
      }

      return planInfo;
    } catch (error) {
      console.error('Error getting user plan info:', error);
      // Return default free plan on error
      return {
        plan: 'free',
        isActive: true,
        subscriptionStatus: 'active',
        planStartDate: new Date().toISOString(),
      };
    }
  }

  /**
   * Get user role from database or determine based on user data
   */
  static async getUserRole(userId: string, email: string): Promise<UserRole> {
    try {
      const userEntity = await DynamoDBService.getUserById(userId);
      
      if (userEntity && userEntity.role) {
        return userEntity.role;
      }

      // Fallback to email-based role assignment for admin users
      const adminEmails = [
        'admin@pornspot.ai',
        'daniel@pornspot.ai',
        'support@pornspot.ai',
      ];

      if (adminEmails.includes(email.toLowerCase())) {
        return 'admin';
      }

      // Moderator users (could be based on userId patterns or other criteria)
      if (userId.includes('mod') || email.includes('moderator')) {
        return 'moderator';
      }

      return 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user'; // Default to regular user on error
    }
  }

  /**
   * Get user usage statistics from database
   */
  static async getUserUsageStats(user: UserEntity): Promise<UserUsageStats> {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.toISOString().split('T')[0]!; // YYYY-MM-DD format

    // Check if monthly count needs to be reset
    let monthlyCount = user.imagesGeneratedThisMonth || 0;
    const lastGeneration = user.lastGenerationAt ? new Date(user.lastGenerationAt) : null;
    
    if (lastGeneration) {
      const lastMonth = lastGeneration.getMonth();
      const lastYear = lastGeneration.getFullYear();
      if (lastMonth !== currentMonth || lastYear !== currentYear) {
        monthlyCount = 0; // Reset for new month
      }
    }

    // Check if daily count needs to be reset
    let dailyCount = user.imagesGeneratedToday || 0;
    if (lastGeneration) {
      const lastDay = lastGeneration.toISOString().split('T')[0];
      if (lastDay !== today) {
        dailyCount = 0; // Reset for new day
      }
    }

    return {
      imagesGeneratedThisMonth: monthlyCount,
      imagesGeneratedToday: dailyCount,
      ...(user.lastGenerationAt && { lastGenerationAt: user.lastGenerationAt })
    };
  }

  /**
   * Convert a regular user entity to enhanced user with plan information
   */
  static async enhanceUser(userEntity: any): Promise<EnhancedUser> {
    const planInfo = await this.getUserPlanInfo(userEntity.userId);
    const role = await this.getUserRole(userEntity.userId, userEntity.email);
    const usageStats = await this.getUserUsageStats(userEntity);

    return {
      userId: userEntity.userId,
      email: userEntity.email,
      username: userEntity.username,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      createdAt: userEntity.createdAt,
      isActive: userEntity.isActive,
      isEmailVerified: userEntity.isEmailVerified,
      lastLoginAt: userEntity.lastLoginAt,
      googleId: userEntity.googleId,
      role,
      planInfo,
      usageStats,
    };
  }

  /**
   * Update user usage statistics in database
   */
  static async updateUserUsageStats(userId: string): Promise<void> {
    try {
      const user = await DynamoDBService.getUserById(userId);
      if (!user) {
        console.error(`User not found for usage update: ${userId}`);
        return;
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Check if we need to reset monthly count (new month)
      let monthlyCount = user.imagesGeneratedThisMonth || 0;
      const lastGeneration = user.lastGenerationAt ? new Date(user.lastGenerationAt) : null;
      
      if (lastGeneration) {
        const lastMonth = lastGeneration.getMonth();
        const lastYear = lastGeneration.getFullYear();
        if (lastMonth !== currentMonth || lastYear !== currentYear) {
          monthlyCount = 0; // Reset for new month
        }
      }

      // Check if we need to reset daily count (new day)
      let dailyCount = user.imagesGeneratedToday || 0;
      if (lastGeneration) {
        const lastDay = lastGeneration.toISOString().split('T')[0];
        if (lastDay !== today) {
          dailyCount = 0; // Reset for new day
        }
      }

      // Increment counts
      monthlyCount += 1;
      dailyCount += 1;

      // Update user in database
      await DynamoDBService.updateUser(userId, { 
        imagesGeneratedThisMonth: monthlyCount,
        imagesGeneratedToday: dailyCount,
        lastGenerationAt: now.toISOString()
      });
      
      console.log(`Updated usage stats for user ${userId}: monthly=${monthlyCount}, daily=${dailyCount}`);
    } catch (error) {
      console.error(`Failed to update usage stats for user ${userId}:`, error);
    }
  }
}
