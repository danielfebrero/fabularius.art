// Frontend User Types based on backend types
export interface User {
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
}

export interface UserSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  expiresAt: string;
  lastAccessedAt: string;
}

// Authentication Request Types
export interface UserRegistrationRequest {
  email: string;
  password: string;
  username: string;
}

// Username availability checking
export interface UsernameAvailabilityRequest {
  username: string;
}

export interface UsernameAvailabilityResponse {
  success: boolean;
  data?: {
    available: boolean;
    message?: string;
  };
  error?: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

// Authentication Response Types
export interface UserLoginResponse {
  success: boolean;
  user?: User;
  sessionId?: string;
  error?: string;
  message?: string;
}

export interface UserRegistrationResponse {
  success: boolean;
  user: User;
  message?: string;
}

export interface UserMeResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Email Verification Types
export interface EmailVerificationRequest {
  token: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Google OAuth Types
export interface GoogleOAuthState {
  state: string;
  codeVerifier: string;
}

export interface GoogleOAuthResponse {
  success: boolean;
  user?: User;
  sessionId?: string;
  redirectUrl: string;
  error?: string;
}

// Form Validation Types
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

// Context Types
export interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isEmailVerified: boolean;
  emailVerificationRequired: boolean;
  login: (credentials: UserLoginRequest) => Promise<boolean>;
  register: (userData: UserRegistrationRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  clearError: () => void;
}

// Error Types
export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// User Interaction Types
export interface UserInteraction {
  userId: string;
  interactionType: "like" | "bookmark";
  targetType: "album" | "media";
  targetId: string;
  createdAt: string;
  target?: {
    id: string;
    title?: string;
    coverImageUrl?: string;
    thumbnailUrls?: {
      cover?: string;
      small?: string;
      medium?: string;
      large?: string;
      xlarge?: string;
    };
    mediaCount?: number;
    isPublic?: boolean;
    createdAt?: string;
    updatedAt?: string;
    type?: string;
  };
}

export interface InteractionRequest {
  targetType: "album" | "media";
  targetId: string;
  action: "add" | "remove";
}

export interface InteractionResponse {
  success: boolean;
  data?: {
    userId: string;
    interactionType: "like" | "bookmark";
    targetType: "album" | "media";
    targetId: string;
    createdAt?: string;
    action?: string;
  };
  error?: string;
}

export interface InteractionCountsResponse {
  success: boolean;
  data?: {
    targetId: string;
    targetType: "album" | "media";
    likeCount: number;
    bookmarkCount: number;
    userLiked: boolean;
    userBookmarked: boolean;
  };
  error?: string;
}

export interface UserInteractionsResponse {
  success: boolean;
  data?: {
    interactions: UserInteraction[];
    pagination: {
      page: number;
      limit: number;
      hasNext: boolean;
      nextKey?: string;
      total: number;
    };
  };
  error?: string;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
