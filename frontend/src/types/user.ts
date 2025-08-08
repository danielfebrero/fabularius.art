import { Album, Media, User as BaseUser, UserProfileInsights as BaseUserProfileInsights } from ".";

// Frontend-specific user type extensions
export interface User extends BaseUser {
  // Profile insights - optional for public profiles
  profileInsights?: BaseUserProfileInsights;
}

// Frontend-specific authentication response types (not in backend shared types)
export interface UserRegistrationResponse {
  success: boolean;
  data?: {
    userId: string;
    email: string;
    username: string;
    message: string;
  };
  error?: string;
}

export interface UserMeResponse {
  success: boolean;
  data?: {
    user: User;
  };
  error?: string;
}

// Email verification types (not in backend shared types)
export interface EmailVerificationRequest {
  token: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  data?: {
    message: string;
    user?: User;
  };
  error?: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  data?: {
    message: string;
    email: string;
  };
  error?: string;
}

// Frontend-specific authentication form types
export interface UserRegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
}

export interface UserLoginFormData {
  email: string;
  password: string;
}

// Frontend-specific context types
export interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  initializing: boolean;
  isEmailVerified: boolean;
  emailVerificationRequired: boolean;
  login: (credentials: UserLoginRequest) => Promise<boolean>;
  register: (userData: UserRegistrationRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  clearError: () => void;
  clearUser: () => void;
}

// Frontend-specific error types
export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Frontend-specific Google OAuth types
export interface GoogleOAuthState {
  state: string;
  codeVerifier: string;
}

// Extended user with plan information - frontend specific
export interface UserWithPlanInfo extends User {
  role?: string; // 'user', 'admin', 'moderator'
  planInfo?: {
    plan: string; // 'free', 'starter', 'unlimited', 'pro'
    isActive: boolean;
    subscriptionId?: string;
    subscriptionStatus?: "active" | "canceled" | "expired";
    planStartDate?: string;
    planEndDate?: string;
  };
  usageStats?: {
    imagesGeneratedThisMonth: number;
    imagesGeneratedToday: number;
    storageUsedGB?: number;
    lastGenerationAt?: string;
  };
}

// Profile update types - frontend specific
export interface UserProfileUpdateRequest {
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  preferredLanguage?: string;
}

export interface UserProfileUpdateResponse {
  success: boolean;
  data?: {
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

      // Avatar information
      avatarUrl?: string;
      avatarThumbnails?: {
        originalSize?: string;
        small?: string;
        medium?: string;
        large?: string;
      };
    };
  };
  error?: string;
}

// Public profile types - frontend specific
export interface PublicUserProfile {
  userId: string;
  username?: string;
  createdAt: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  bio?: string;
  location?: string;
  website?: string;

  // Avatar information
  avatarUrl?: string; // Original avatar image URL
  avatarThumbnails?: {
    originalSize?: string; // WebP optimized version of original (full resolution)
    small?: string; // Small size (max 32px, preserves aspect ratio)
    medium?: string; // Medium size (max 96px, preserves aspect ratio)
    large?: string; // Large size (max 128px, preserves aspect ratio)
  };

  // Profile insights
  profileInsights?: BaseUserProfileInsights;
}

export interface GetPublicProfileResponse {
  success: boolean;
  data?: {
    user: PublicUserProfile;
  };
  error?: string;
}

// Frontend-specific unified response types for user interactions
export interface UnifiedUserInteractionsResponse {
  success: boolean;
  data: {
    interactions: UserInteraction[];
    pagination: {
      hasNext: boolean;
      cursor: string | null;
      limit: number;
    };
  };
  error?: string;
}

export interface UnifiedCommentsResponse {
  success: boolean;
  data: {
    comments: CommentWithTarget[];
    pagination: {
      hasNext: boolean;
      cursor: string | null;
      limit: number;
    };
  };
  error?: string;
}

// Comment type with target enrichment for frontend display
export interface CommentWithTarget extends Comment {
  target?: Media | Album; // Added for enriched comments from getUserComments API
}

// User interaction stats - frontend specific
export interface UserInteractionStatsResponse {
  success: boolean;
  data?: {
    totalLikesReceived: number;
    totalBookmarksReceived: number;
  };
  error?: string;
}

// Re-export types from shared package that are used in frontend (that actually exist)
export type {
  User as BaseUser,
  UserSession,
  UserRegistrationRequest,
  UserLoginRequest,
  UserLoginResponse,
  UserProfileInsights,
  UserInsightsResponse,
  UserInteraction,
  InteractionRequest,
  InteractionResponse,
  InteractionCountsResponse,
  UserInteractionsResponse,
  ApiResponse,
  UsernameAvailabilityRequest,
  UsernameAvailabilityResponse,
  Comment,
  GoogleOAuthResponse
} from "@pornspot-ai/shared-types";
