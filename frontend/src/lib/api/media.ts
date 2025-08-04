import { Media, UnifiedMediaResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

// Media API Functions
export const mediaApi = {
  // Get user's media - NEW UNIFIED FORMAT
  getUserMedia: async (params?: {
    limit?: number;
    cursor?: string;
  }): Promise<UnifiedMediaResponse> => {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.cursor) searchParams.set("cursor", params.cursor);

    const response = await fetch(
      `${API_URL}/user/media?${searchParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user media: ${response.statusText}`);
    }

    return response.json();
  },

  // Get album media - NEW UNIFIED FORMAT
  getAlbumMedia: async (
    albumId: string,
    params?: {
      limit?: number;
      cursor?: string;
    }
  ): Promise<UnifiedMediaResponse> => {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.cursor) searchParams.set("cursor", params.cursor);

    const response = await fetch(
      `${API_URL}/albums/${albumId}/media?${searchParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch album media: ${response.statusText}`);
    }

    return response.json();
  },

  // Get media by ID
  getMediaById: async (mediaId: string): Promise<Media> => {
    const response = await fetch(`${API_URL}/media/${mediaId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || "Failed to fetch media");
    }
  },

  // Upload media to album
  uploadMedia: async (
    albumId: string,
    mediaData: {
      filename: string;
      mimeType: string;
      size: number;
    }
  ): Promise<{
    mediaId: string;
    uploadUrl: string;
    key: string;
    expiresIn: number;
  }> => {
    const response = await fetch(`${API_URL}/albums/${albumId}/media`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(mediaData),
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
        `Failed to upload media: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || "Failed to upload media");
    }
  },

  // Delete media
  deleteMedia: async (albumId: string, mediaId: string): Promise<void> => {
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
        `Failed to delete media: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to delete media");
    }
  },
};
