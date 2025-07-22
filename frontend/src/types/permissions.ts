// User Plan and Permission System Types

export type UserPlan = "free" | "starter" | "unlimited" | "pro";

export type UserRole = "user" | "admin" | "moderator";

// Specific permissions for different features
export interface PlanPermissions {
  // Image generation limits
  imagesPerMonth: number | "unlimited";
  imagesPerDay: number | "unlimited";

  // Core features
  canGenerateImages: boolean;
  canUseAdvancedPrompts: boolean;
  canUseNegativePrompt: boolean;
  canUseBulkGeneration: boolean;
  canUseLoRAModels: boolean;
  canSelectImageSizes: boolean;

  // Content management
  canCreatePrivateContent: boolean;
  canMakeContentPublic: boolean;

  // Quality & Processing
  maxImageQuality: "standard" | "high" | "premium";
  processingPriority: "standard" | "high" | "priority";

  // Export & Downloads
  canDownloadOriginal: boolean;
  canExportContent: boolean;

  // Community features
  canBookmark: boolean;
  canLike: boolean;
  canComment: boolean;
  canShare: boolean;

  // Support & API
  supportLevel: "community" | "email" | "priority";
  hasApiAccess: boolean;
  apiRequestsPerMonth: number;
}
export interface UserPlanInfo {
  plan: UserPlan;
  isActive: boolean;
  subscriptionId?: string;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  canceledAt?: string;
  permissions: PlanPermissions;
}

export interface UserWithPlan extends User {
  role: UserRole;
  planInfo: UserPlanInfo;
  // Usage tracking
  usageStats: {
    imagesGeneratedThisMonth: number;
    imagesGeneratedToday: number;
    lastGenerationAt?: string;
  };
}

import { loadPermissionsConfig } from "@/utils/permissions";

// Load permissions from centralized API instead of static config
// This is now a dynamic function that loads from backend API
async function getPermissionsConfig() {
  return await loadPermissionsConfig();
}

// Plan definitions - these will be loaded dynamically now
// export const PLAN_DEFINITIONS: Record<UserPlan, PlanPermissions> = permissionsConfig.planPermissions;

// Role-based permissions (for admin functions)
export interface RolePermissions {
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canManageContent: boolean;
  canViewAnalytics: boolean;
  canModerateContent: boolean;
  canManageReports: boolean;
  canManageSubscriptions: boolean;
  canAccessSystemSettings: boolean;
}

// Role-based permissions - these will also be loaded dynamically now
// export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = permissionsConfig.rolePermissions;

// Permission check helper types
export interface PermissionContext {
  feature: string;
  action: string;
  resource?: string;
}

// Import the base User interface
import { User } from "./user";
