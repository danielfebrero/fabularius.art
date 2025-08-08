// Re-export shared types from the shared types package
export * from "@pornspot-ai/shared-types";

// Import types we need to reference
import type { ApiResponse, Album, Media } from "@pornspot-ai/shared-types";

// Frontend-specific pagination types that extend the base types
export interface UnifiedPaginationMeta {
  hasNext: boolean; // Whether more pages exist
  cursor: string | null; // Base64-encoded cursor for next page
  limit: number; // Actual limit used
}

// Base unified paginated response type
export interface UnifiedPaginatedResponse<T = any> extends ApiResponse {
  data: {
    pagination: UnifiedPaginationMeta;
  } & Record<string, T[] | UnifiedPaginationMeta>;
}

// Specific unified response types for type safety
export interface UnifiedAlbumsResponse extends ApiResponse {
  data: {
    albums: Album[];
    pagination: UnifiedPaginationMeta;
  };
}

export interface UnifiedMediaResponse extends ApiResponse {
  data: {
    media: Media[];
    pagination: UnifiedPaginationMeta;
  };
}

// Frontend-specific thumbnail system types
export type ThumbnailSize =
  | "cover"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "originalSize";

export type ThumbnailContext =
  | "cover-selector"
  | "create-album"
  | "discover"
  | "albums"
  | "admin"
  | "default";

export interface ThumbnailUrls {
  cover?: string;
  small?: string;
  medium?: string;
  large?: string;
  xlarge?: string;
  originalSize?: string;
}

// Frontend-specific permission and plan types
export * from "./permissions";

// Re-export frontend-specific user types
export type {
  FrontendMedia,
  CommentWithTarget,
  InteractionRequest,
  UserInteraction,
  UserRegistrationFormData,
  UserLoginFormData,
  UserLoginResponse,
  UserContextType,
  AuthError,
  ValidationError,
  GoogleOAuthState,
  GoogleOAuthResponse,
  UsernameAvailabilityResponse,
  UserWithPlanInfo,
  UserProfileUpdateRequest,
  UserProfileUpdateResponse,
  PublicUserProfile,
  GetPublicProfileResponse,
  UnifiedUserInteractionsResponse,
  UnifiedCommentsResponse,
  UserInteractionStatsResponse,
  UserRegistrationResponse,
  UserMeResponse,
  EmailVerificationRequest,
  EmailVerificationResponse,
  ResendVerificationRequest,
  ResendVerificationResponse
} from "./user";

// Re-export shared types that are needed directly
export type { 
  UserLoginRequest,
  UserRegistrationRequest 
} from "@pornspot-ai/shared-types";
