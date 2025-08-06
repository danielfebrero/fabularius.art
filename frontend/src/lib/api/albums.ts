const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

// Import the new unified types
import { UnifiedAlbumsResponse } from "@/types";

// Albums API Functions
export const albumsApi = {
  // Get albums with optional filtering
  getAlbums: async (params?: {
    user?: string; // Parameter for username lookup
    isPublic?: boolean;
    limit?: number;
    cursor?: string;
    tag?: string;
  }): Promise<UnifiedAlbumsResponse> => {
    const searchParams = new URLSearchParams();

    if (params?.user) searchParams.set("user", params.user);
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

    return response.json();
  },

  // Get user's albums (convenience method)
  getUserAlbums: async (params?: {
    limit?: number;
    cursor?: string;
    tag?: string;
  }): Promise<UnifiedAlbumsResponse> => {
    // Fetch current user's albums via session (no user parameter = session-based lookup)
    return albumsApi.getAlbums({
      ...params,
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

  // Add existing media to album (single)
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

  // Add multiple existing media to album (bulk)
  bulkAddMediaToAlbum: async (
    albumId: string,
    mediaIds: string[]
  ): Promise<{
    successfullyAdded: string[];
    failedAdditions: { mediaId: string; error: string }[];
    totalProcessed: number;
    successCount: number;
    failureCount: number;
  }> => {
    const response = await fetch(`${API_URL}/albums/${albumId}/media`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ mediaIds }),
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
        `Failed to bulk add media to album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to bulk add media to album");
    }

    return data.results;
  },

  // Remove media from album
  removeMediaFromAlbum: async (
    albumId: string,
    mediaId: string
  ): Promise<void> => {
    const response = await fetch(
      `${API_URL}/albums/${albumId}/media/${mediaId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // response body is not JSON
      }
      const errorMessage =
        (errorData && (errorData.error || errorData.message)) ||
        `Failed to remove media from album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to remove media from album");
    }
  },

  // Remove multiple media from album (bulk)
  bulkRemoveMediaFromAlbum: async (
    albumId: string,
    mediaIds: string[]
  ): Promise<{
    successfullyRemoved: string[];
    failedRemovals: { mediaId: string; error: string }[];
    totalProcessed: number;
    successCount: number;
    failureCount: number;
  }> => {
    const response = await fetch(
      `${API_URL}/albums/${albumId}/media/bulk-remove`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ mediaIds }),
      }
    );

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // response body is not JSON
      }
      const errorMessage =
        (errorData && (errorData.error || errorData.message)) ||
        `Failed to bulk remove media from album: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to bulk remove media from album");
    }

    return data.results;
  },

  // Get a single album
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
