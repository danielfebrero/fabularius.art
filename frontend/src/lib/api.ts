import {
  UserLoginRequest,
  UserRegistrationRequest,
  UserLoginResponse,
  UserRegistrationResponse,
  UserMeResponse,
  EmailVerificationResponse,
  ResendVerificationResponse,
  GoogleOAuthResponse,
  InteractionRequest,
  InteractionResponse,
  InteractionCountsResponse,
  UserInteractionsResponse,
} from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  // This error will be caught during server-side rendering and build time
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
      throw new Error(`Login failed: ${response.statusText}`);
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
};

// User Interaction API Functions
export const interactionApi = {
  // Like/Unlike content
  like: async (request: InteractionRequest): Promise<InteractionResponse> => {
    const response = await fetch(`${API_URL}/user/interactions/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Like action failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Bookmark/Unbookmark content
  bookmark: async (
    request: InteractionRequest
  ): Promise<InteractionResponse> => {
    const response = await fetch(`${API_URL}/user/interactions/bookmark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Bookmark action failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Get user's likes
  getLikes: async (
    page: number = 1,
    limit: number = 20,
    lastKey?: string
  ): Promise<UserInteractionsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (lastKey) {
      params.append("lastKey", lastKey);
    }

    const response = await fetch(
      `${API_URL}/user/interactions/likes?${params}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get likes: ${response.statusText}`);
    }

    return response.json();
  },

  // Get user's bookmarks
  getBookmarks: async (
    page: number = 1,
    limit: number = 20,
    lastKey?: string
  ): Promise<UserInteractionsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (lastKey) {
      params.append("lastKey", lastKey);
    }

    const response = await fetch(
      `${API_URL}/user/interactions/bookmarks?${params}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get bookmarks: ${response.statusText}`);
    }

    return response.json();
  },

  // Get interaction counts and user status for content
  getCounts: async (
    targetType: "album" | "media",
    targetId: string
  ): Promise<InteractionCountsResponse> => {
    const response = await fetch(
      `${API_URL}/user/interactions/counts/${targetType}/${targetId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get interaction counts: ${response.statusText}`
      );
    }

    return response.json();
  },
};

export default API_URL;
