import {
  UserLoginRequest,
  UserRegistrationRequest,
  UserLoginResponse,
  UserRegistrationResponse,
  UserMeResponse,
  EmailVerificationResponse,
  ResendVerificationResponse,
  GoogleOAuthResponse,
  UsernameAvailabilityRequest,
  UsernameAvailabilityResponse,
  UserProfileUpdateRequest,
  UserProfileUpdateResponse,
} from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

// User Authentication API Functions
export const userApi = {
  // User login
  login: async (credentials: UserLoginRequest): Promise<UserLoginResponse> => {
    const response = await fetch(`${API_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for HTTP-only cookies
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // response body is not JSON
      }
      const errorMessage =
        (errorData && (errorData.error || errorData.message)) ||
        `Login failed: ${response.statusText}`;
      const error = new Error(errorMessage);
      if (errorData) {
        (error as any).response = errorData;
      }
      throw error;
    }

    return response.json();
  },

  // Check username availability
  checkUsernameAvailability: async (
    request: UsernameAvailabilityRequest
  ): Promise<UsernameAvailabilityResponse> => {
    const response = await fetch(`${API_URL}/user/auth/check-username`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Username check failed: ${response.statusText}`);
    }

    return response.json();
  },

  // User registration
  register: async (
    userData: UserRegistrationRequest
  ): Promise<UserRegistrationResponse> => {
    const response = await fetch(`${API_URL}/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    return response.json();
  },

  // User logout
  logout: async (): Promise<void> => {
    const response = await fetch(`${API_URL}/user/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.statusText}`);
    }
  },

  // Get current user
  me: async (): Promise<UserMeResponse> => {
    const response = await fetch(`${API_URL}/user/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return response.json();
  },

  // Verify email
  verifyEmail: async (token: string): Promise<EmailVerificationResponse> => {
    const response = await fetch(`${API_URL}/user/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error(`Email verification failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Resend verification email
  resendVerification: async (
    email: string
  ): Promise<ResendVerificationResponse> => {
    const response = await fetch(`${API_URL}/user/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`Resend verification failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Google OAuth callback
  googleOAuthCallback: async (
    code: string,
    state?: string
  ): Promise<GoogleOAuthResponse> => {
    const response = await fetch(`${API_URL}/auth/oauth/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      throw new Error(`Google OAuth failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Update user profile
  updateProfile: async (
    profileData: UserProfileUpdateRequest
  ): Promise<UserProfileUpdateResponse> => {
    const response = await fetch(`${API_URL}/user/profile/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // response body is not JSON
      }
      const errorMessage =
        (errorData && (errorData.error || errorData.message)) ||
        `Profile update failed: ${response.statusText}`;
      const error = new Error(errorMessage);
      if (errorData) {
        (error as any).response = errorData;
      }
      throw error;
    }

    return response.json();
  },

  // Change password
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/user/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // response body is not JSON
      }
      const errorMessage =
        (errorData && (errorData.error || errorData.message)) ||
        `Password change failed: ${response.statusText}`;
      const error = new Error(errorMessage);
      if (errorData) {
        (error as any).response = errorData;
      }
      throw error;
    }

    return response.json();
  },

  // Delete account
  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/user/account/delete`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // response body is not JSON
      }
      const errorMessage =
        (errorData && (errorData.error || errorData.message)) ||
        `Account deletion failed: ${response.statusText}`;
      const error = new Error(errorMessage);
      if (errorData) {
        (error as any).response = errorData;
      }
      throw error;
    }

    return response.json();
  },

  // Cancel subscription
  cancelSubscription: async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await fetch(`${API_URL}/user/subscription/cancel`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // response body is not JSON
      }
      const errorMessage =
        (errorData && (errorData.error || errorData.message)) ||
        `Subscription cancellation failed: ${response.statusText}`;
      const error = new Error(errorMessage);
      if (errorData) {
        (error as any).response = errorData;
      }
      throw error;
    }

    return response.json();
  },

  // Update language preference
  updateLanguage: async (
    languageCode: string
  ): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> => {
    const response = await fetch(`${API_URL}/user/profile/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ preferredLanguage: languageCode }),
    });

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // response body is not JSON
      }
      const errorMessage =
        (errorData && (errorData.error || errorData.message)) ||
        `Language update failed: ${response.statusText}`;
      const error = new Error(errorMessage);
      if (errorData) {
        (error as any).response = errorData;
      }
      throw error;
    }

    return response.json();
  },
};
