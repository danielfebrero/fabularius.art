import {
  InteractionRequest,
  InteractionResponse,
  UnifiedUserInteractionsResponse,
  UnifiedCommentsResponse,
  UserInteractionStatsResponse,
  CommentInteractionRequest,
} from "@/types/user";
import {
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentResponse,
  CommentListResponse,
  CommentLikeStatusResponse,
} from "@/types";

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
    targetType: "album" | "media" | "profile";
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

  // Get user's likes - NEW UNIFIED FORMAT
  getLikes: async (
    limit: number = 20,
    cursor?: string
  ): Promise<UnifiedUserInteractionsResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (cursor) {
      params.append("cursor", cursor);
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

  // Get likes by username (for profile views) - NEW UNIFIED FORMAT
  getLikesByUsername: async (
    username: string,
    limit: number = 20,
    cursor?: string
  ): Promise<UnifiedUserInteractionsResponse> => {
    const params = new URLSearchParams({
      user: username,
      limit: limit.toString(),
    });

    if (cursor) {
      params.append("cursor", cursor);
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

  // Get user's bookmarks - NEW UNIFIED FORMAT
  getBookmarks: async (
    limit: number = 20,
    cursor?: string
  ): Promise<UnifiedUserInteractionsResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (cursor) {
      params.append("cursor", cursor);
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

  // Comment operations
  getComments: async (
    targetType: "album" | "media",
    targetId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<CommentListResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await fetch(
      `${API_URL}/user/interactions/comments/${targetType}/${targetId}?${params}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get comments: ${response.statusText}`);
    }

    return response.json();
  },

  // Get comments by username (for profile views) - NEW UNIFIED FORMAT
  getCommentsByUsername: async (
    username: string,
    limit: number = 20,
    cursor?: string
  ): Promise<UnifiedCommentsResponse> => {
    const params = new URLSearchParams({
      user: username,
      limit: limit.toString(),
    });

    if (cursor) {
      params.append("cursor", cursor);
    }

    const response = await fetch(
      `${API_URL}/user/interactions/comments?${params}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get comments for user: ${response.statusText}`
      );
    }

    return response.json();
  },

  createComment: async (
    request: CreateCommentRequest
  ): Promise<CommentResponse> => {
    const response = await fetch(`${API_URL}/user/interactions/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create comment: ${response.statusText}`);
    }

    return response.json();
  },

  updateComment: async (
    commentId: string,
    request: UpdateCommentRequest
  ): Promise<CommentResponse> => {
    const response = await fetch(
      `${API_URL}/user/interactions/comment/${commentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update comment: ${response.statusText}`);
    }

    return response.json();
  },

  deleteComment: async (commentId: string): Promise<{ success: boolean }> => {
    const response = await fetch(
      `${API_URL}/user/interactions/comment/${commentId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete comment: ${response.statusText}`);
    }

    return response.json();
  },

  // Like/Unlike comment
  likeComment: async (
    request: CommentInteractionRequest
  ): Promise<InteractionResponse> => {
    const response = await fetch(`${API_URL}/user/interactions/comment-like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Comment like action failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Get comment like status
  getCommentLikeStatus: async (
    commentIds: string[]
  ): Promise<CommentLikeStatusResponse> => {
    const response = await fetch(
      `${API_URL}/user/interactions/comment-like-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ commentIds }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get comment like status: ${response.statusText}`
      );
    }

    return response.json();
  },
};
