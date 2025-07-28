import {
  InteractionRequest,
  InteractionResponse,
  UserInteractionsResponse,
  UserInteractionStatsResponse,
} from "@/types/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

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

  // Get likes by username (for profile views)
  getLikesByUsername: async (
    username: string,
    page: number = 1,
    limit: number = 20,
    lastKey?: string
  ): Promise<UserInteractionsResponse> => {
    const params = new URLSearchParams({
      user: username,
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
      throw new Error(`Failed to get likes for user: ${response.statusText}`);
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
