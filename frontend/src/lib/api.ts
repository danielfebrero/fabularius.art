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
  InteractionRequest,
  InteractionResponse,
  UserInteractionsResponse,
  UserInteractionStatsResponse,
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

  // Track view
  trackView: async (request: {
    targetType: "album" | "media";
    targetId: string;
  }): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_URL}/user/interactions/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      // Don't throw error for view tracking - it's not critical
      console.warn(`View tracking failed: ${response.statusText}`);
      return { success: false };
    }

    return { success: true };
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

  // Get user interaction status for multiple targets (optimized replacement for getCounts)
  getInteractionStatus: async (
    targets: Array<{ targetType: "album" | "media"; targetId: string }>
  ): Promise<{
    success: boolean;
    data: {
      statuses: Array<{
        targetType: "album" | "media";
        targetId: string;
        userLiked: boolean;
        userBookmarked: boolean;
      }>;
    };
  }> => {
    const response = await fetch(`${API_URL}/user/interactions/status`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targets }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get interaction status: ${response.statusText}`
      );
    }

    return response.json();
  },

  // Get user's interaction stats (likes and bookmarks received on user's content)
  getInsights: async (): Promise<UserInteractionStatsResponse> => {
    const response = await fetch(`${API_URL}/user/insights`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to get insights: ${response.statusText}`);
    }

    return response.json();
  },
};

// Albums API Functions
export const albumsApi = {
  // Get albums with optional filtering
  getAlbums: async (params?: {
    createdBy?: string;
    isPublic?: boolean;
    limit?: number;
    cursor?: string;
    tag?: string;
  }): Promise<{
    albums: any[];
    nextCursor?: string;
    hasNext: boolean;
  }> => {
    const searchParams = new URLSearchParams();

    if (params?.createdBy) searchParams.set("createdBy", params.createdBy);
    if (params?.isPublic !== undefined)
      searchParams.set("isPublic", params.isPublic.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.cursor) searchParams.set("cursor", params.cursor);
    if (params?.tag) searchParams.set("tag", params.tag);

    const response = await fetch(
      `${API_URL}/albums?${searchParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch albums: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || "Failed to fetch albums");
    }
  },

  // Get user's albums (convenience method)
  getUserAlbums: async (
    userIdOrParams?:
      | string
      | {
          limit?: number;
          cursor?: string;
          tag?: string;
        },
    params?: {
      limit?: number;
      cursor?: string;
      tag?: string;
    }
  ): Promise<{
    albums: any[];
    nextCursor?: string;
    hasNext: boolean;
  }> => {
    // If first parameter is a string, it's a userId for fetching specific user's albums
    if (typeof userIdOrParams === "string") {
      return albumsApi.getAlbums({
        createdBy: userIdOrParams,
        ...params,
      });
    }

    // If first parameter is an object or undefined, fetch current user's albums via session
    return albumsApi.getAlbums({
      ...userIdOrParams,
    });
  },

  // Create a new album
  createAlbum: async (albumData: {
    title: string;
    tags?: string[];
    isPublic: boolean;
    mediaIds?: string[];
    coverImageId?: string;
  }): Promise<any> => {
    const response = await fetch(`${API_URL}/albums`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(albumData),
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
        `Failed to create album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || "Failed to create album");
    }
  },

  // Update an album
  updateAlbum: async (
    albumId: string,
    updates: {
      title?: string;
      tags?: string[];
      isPublic?: boolean;
      coverImageUrl?: string;
    }
  ): Promise<any> => {
    const response = await fetch(`${API_URL}/albums/${albumId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updates),
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
        `Failed to update album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || "Failed to update album");
    }
  },

  // Delete an album
  deleteAlbum: async (albumId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/albums/${albumId}`, {
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
        `Failed to delete album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to delete album");
    }
  },

  // Add existing media to album
  addMediaToAlbum: async (albumId: string, mediaId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/albums/${albumId}/media`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ mediaId }),
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
        `Failed to add media to album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to add media to album");
    }
  },
};

// Admin Albums API Functions
export const adminAlbumsApi = {
  // Get all albums (admin view)
  getAlbums: async (): Promise<{
    albums: any[];
    pagination?: any;
    total?: number;
  }> => {
    const response = await fetch(`${API_URL}/admin/albums`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin albums: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || "Failed to fetch admin albums");
    }
  },

  // Create a new album (admin)
  createAlbum: async (albumData: {
    title: string;
    description?: string;
    isPublic: boolean;
  }): Promise<any> => {
    const response = await fetch(`${API_URL}/albums`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(albumData),
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
        `Failed to create album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || "Failed to create album");
    }
  },

  // Update an album (admin)
  updateAlbum: async (
    albumId: string,
    updates: {
      title?: string;
      tags?: string[];
      isPublic?: boolean;
      coverImageUrl?: string;
    }
  ): Promise<any> => {
    const response = await fetch(`${API_URL}/admin/albums/${albumId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updates),
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
        `Failed to update album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || "Failed to update album");
    }
  },

  // Delete an album (admin)
  deleteAlbum: async (albumId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/albums/${albumId}`, {
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
        `Failed to delete album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to delete album");
    }
  },

  // Bulk delete albums (admin)
  bulkDeleteAlbums: async (albumIds: string[]): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/albums/bulk-delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ albumIds }),
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
        `Failed to bulk delete albums: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to bulk delete albums");
    }
  },

  // Get a single album (admin)
  getAlbum: async (albumId: string): Promise<any> => {
    const response = await fetch(`${API_URL}/albums/${albumId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch album: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || "Failed to fetch album");
    }
  },
};

export default API_URL;
