// User Plan and Permission System Types

export type UserPlan = "free" | "starter" | "unlimited" | "pro";

export type UserRole = "user" | "admin" | "moderator";

// Specific permissions for different features
export interface PlanPermissions {
  // Image generation limits
  imagesPerMonth: number | 'unlimited';
  imagesPerDay: number | 'unlimited';
  
  // Core features
  canGenerateImages: boolean;
  canUseAdvancedPrompts: boolean;
  canUseBulkGeneration: boolean;
  canUseLoRAModels: boolean;
  canSelectImageSizes: boolean;
  
  // Content management
  canCreatePrivateContent: boolean;
  canMakeContentPublic: boolean;
  
  // Quality & Processing
  maxImageQuality: 'standard' | 'high' | 'premium';
  processingPriority: 'standard' | 'high' | 'priority';
  
  // Export & Downloads
  canDownloadOriginal: boolean;
  canExportContent: boolean;
  
  // Community features
  canBookmark: boolean;
  canLike: boolean;
  canComment: boolean;
  canShare: boolean;
  
  // Support & API
  supportLevel: 'community' | 'email' | 'priority';
  hasApiAccess: boolean;
  apiRequestsPerMonth: number;
}export interface UserPlanInfo {
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

// Plan definitions matching the pricing page
export const PLAN_DEFINITIONS: Record<UserPlan, PlanPermissions> = {
  free: {
    imagesPerMonth: 30, // 1 per day
    imagesPerDay: 1,
    canGenerateImages: true,
    canUseAdvancedPrompts: false,
    canUseBulkGeneration: false,
    canUseLoRAModels: false,
    canSelectImageSizes: false,
    canCreatePrivateContent: false,
    canMakeContentPublic: true,
    maxImageQuality: "standard",
    processingPriority: "standard",
    canDownloadOriginal: true,
    canExportContent: false,
    canBookmark: true,
    canLike: true,
    canComment: true,
    canShare: true,
    supportLevel: "community",
    hasApiAccess: false,
    apiRequestsPerMonth: 0,
  },
  starter: {
    imagesPerMonth: 300,
    imagesPerDay: 20,
    canGenerateImages: true,
    canUseAdvancedPrompts: true,
    canUseBulkGeneration: false,
    canUseLoRAModels: false,
    canSelectImageSizes: false,
    canCreatePrivateContent: false,
    canMakeContentPublic: true,
    maxImageQuality: "high",
    processingPriority: "standard",
    canDownloadOriginal: true,
    canExportContent: true,
    canBookmark: true,
    canLike: true,
    canComment: true,
    canShare: true,
    supportLevel: "email",
    hasApiAccess: false,
    apiRequestsPerMonth: 0,
  },
  unlimited: {
    imagesPerMonth: "unlimited",
    imagesPerDay: "unlimited",
    canGenerateImages: true,
    canUseAdvancedPrompts: true,
    canUseBulkGeneration: false,
    canUseLoRAModels: false,
    canSelectImageSizes: true,
    canCreatePrivateContent: false,
    canMakeContentPublic: true,
    maxImageQuality: "high",
    processingPriority: "high",
    canDownloadOriginal: true,
    canExportContent: true,
    canBookmark: true,
    canLike: true,
    canComment: true,
    canShare: true,
    supportLevel: "email",
    hasApiAccess: false,
    apiRequestsPerMonth: 0,
  },
  pro: {
    imagesPerMonth: "unlimited",
    imagesPerDay: "unlimited",
    canGenerateImages: true,
    canUseAdvancedPrompts: true,
    canUseBulkGeneration: true,
    canUseLoRAModels: true,
    canSelectImageSizes: true,
    canCreatePrivateContent: true,
    canMakeContentPublic: true,
    maxImageQuality: "premium",
    processingPriority: "priority",
    canDownloadOriginal: true,
    canExportContent: true,
    canBookmark: true,
    canLike: true,
    canComment: true,
    canShare: true,
    supportLevel: "priority",
    hasApiAccess: true,
    apiRequestsPerMonth: 10000,
  },
};

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

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  user: {
    canAccessAdmin: false,
    canManageUsers: false,
    canManageContent: false,
    canViewAnalytics: false,
    canModerateContent: false,
    canManageReports: false,
    canManageSubscriptions: false,
    canAccessSystemSettings: false,
  },
  moderator: {
    canAccessAdmin: true,
    canManageUsers: false,
    canManageContent: true,
    canViewAnalytics: false,
    canModerateContent: true,
    canManageReports: true,
    canManageSubscriptions: false,
    canAccessSystemSettings: false,
  },
  admin: {
    canAccessAdmin: true,
    canManageUsers: true,
    canManageContent: true,
    canViewAnalytics: true,
    canModerateContent: true,
    canManageReports: true,
    canManageSubscriptions: true,
    canAccessSystemSettings: true,
  },
};

// Permission check helper types
export interface PermissionContext {
  feature: string;
  action: string;
  resource?: string;
}

// Import the base User interface
import { User } from "./user";
