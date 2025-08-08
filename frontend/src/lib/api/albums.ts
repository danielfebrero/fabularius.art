import { UnifiedAlbumsResponse } from "@/types";
import { ApiUtil, PaginationParams } from "../api-util";

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
    const response = await ApiUtil.get<UnifiedAlbumsResponse>("/albums", params);
    return ApiUtil.extractData(response);
  },

  // Get user's albums (convenience method)
  getUserAlbums: async (params?: PaginationParams & {
    tag?: string;
  }): Promise<UnifiedAlbumsResponse> => {
    // Fetch current user's albums via session (no user parameter = session-based lookup)
    const response = await ApiUtil.get<UnifiedAlbumsResponse>("/albums", params);
    return ApiUtil.extractData(response);
  },

  // Create a new album
  createAlbum: async (albumData: {
    title: string;
    tags?: string[];
    isPublic: boolean;
    mediaIds?: string[];
    coverImageId?: string;
  }): Promise<any> => {
    const response = await ApiUtil.post<any>("/albums", albumData);
    return ApiUtil.extractData(response);
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

    return data.data.results;
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

    return data.data.results;
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
