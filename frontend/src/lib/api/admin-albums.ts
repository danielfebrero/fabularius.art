const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

// Admin Albums API Functions
export const adminAlbumsApi = {
  // Get all albums with pagination (admin view)
  getAlbums: async (params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{
    albums: any[];
    pagination: {
      hasNext: boolean;
      cursor: string | null;
      limit: number;
    };
  }> => {
    const searchParams = new URLSearchParams();

    if (params?.limit) {
      searchParams.set("limit", params.limit.toString());
    }

    if (params?.cursor) {
      searchParams.set("cursor", params.cursor);
    }

    const url = `${API_URL}/admin/albums${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
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
