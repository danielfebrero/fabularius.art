import { User, UserWithPlanInfo } from "@/types/user";
import {
  UserWithPlan,
  UserPlan,
  UserRole,
  PLAN_DEFINITIONS,
} from "@/types/permissions";

// Utility to convert API user to permissions-compatible user
export function createUserWithPlan(
  user: User | UserWithPlanInfo
): UserWithPlan {
  const baseUser = user as UserWithPlanInfo;

  // Default values for new users or users without plan info
  const plan: UserPlan = (baseUser.plan as UserPlan) || "free";
  const role: UserRole = (baseUser.role as UserRole) || "user";

  const permissions = PLAN_DEFINITIONS[plan];

  return {
    ...user,
    role,
    planInfo: {
      plan,
      isActive: baseUser.subscriptionStatus === "active" || plan === "free",
      subscriptionId: baseUser.subscriptionId,
      startDate: baseUser.planStartDate || user.createdAt,
      endDate: baseUser.planEndDate,
      permissions,
    },
    usageStats: baseUser.usageStats || {
      imagesGeneratedThisMonth: 0,
      imagesGeneratedToday: 0,
    },
  };
}

// Mock user data for development/testing
export function createMockUser(
  plan: UserPlan = "free",
  overrides?: Partial<UserWithPlan>
): UserWithPlan {
  const baseUser: User = {
    userId: "mock-user-123",
    email: "test@example.com",
    username: "testuser",
    createdAt: new Date().toISOString(),
    isActive: true,
    isEmailVerified: true,
    lastLoginAt: new Date().toISOString(),
  };

  const mockUsage = {
    free: { month: 25, day: 0, storage: 0.1 },
    starter: { month: 150, day: 5, storage: 2.5 },
    unlimited: { month: 1200, day: 40, storage: 15.8 },
    pro: { month: 2500, day: 80, storage: 45.2 },
  };

  const usage = mockUsage[plan];

  const userWithPlan = createUserWithPlan({
    ...baseUser,
    plan,
    role: "user",
    subscriptionStatus: plan === "free" ? undefined : "active",
    usageStats: {
      imagesGeneratedThisMonth: usage.month,
      imagesGeneratedToday: usage.day,
      storageUsedGB: usage.storage,
      lastGenerationAt: new Date().toISOString(),
    },
    ...overrides,
  });

  return userWithPlan;
}
