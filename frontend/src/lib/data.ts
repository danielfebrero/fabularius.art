import { Album, Media } from "@/types";
import API_URL from "./api";

// Helper function to handle API responses
async function handleResponse<T>(
  response: Response
): Promise<{ success: boolean; data?: T; error?: string }> {
  const data = await response.json();
  if (response.ok) {
    if (data.success) {
      return { success: true, data: data.data };
    } else {
      throw new Error(data.error || "API returned an error");
    }
  } else {
    throw new Error(
      data.error || `Request failed with status ${response.status}`
    );
  }
}

// Fetch a list of albums
export async function getAlbums(
  options: { isPublic?: boolean; limit?: number; cursor?: string } = {}
) {
  const { isPublic = true, limit = 12, cursor } = options;
  const params = new URLSearchParams({
    isPublic: String(isPublic),
    limit: String(limit),
  });
  if (cursor) {
    params.append("cursor", cursor);
  }

  const response = await fetch(`${API_URL}/albums?${params}`, {
    next: { revalidate: 3600, tags: ["albums"] },
  });
  return handleResponse<{ albums: Album[]; pagination: any }>(response);
}
// Fetch all public albums, handling pagination
export async function fetchAllPublicAlbums(): Promise<Album[]> {
  let allAlbums: Album[] = [];
  let cursor: string | undefined = undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const params: { isPublic: boolean; limit: number; cursor?: string } = {
        isPublic: true,
        limit: 100,
      };
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await getAlbums(params);

      if (response.data) {
        allAlbums = allAlbums.concat(response.data.albums);
        cursor = response.data.pagination?.cursor;
        hasNextPage = !!cursor;
      } else {
        hasNextPage = false;
      }
    } catch (error) {
      console.error("Failed to fetch a page of albums:", error);
      // On error, stop fetching and return what we have so far
      hasNextPage = false;
    }
  }

  return allAlbums;
}

// Fetch a single album by ID
export async function getAlbumById(albumId: string) {
  const response = await fetch(`${API_URL}/albums/${albumId}`, {
    next: { revalidate: 3600, tags: ["album"] },
  });
  return handleResponse<Album>(response);
}

// Fetch media for a specific album
export async function getMediaForAlbum(
  albumId: string,
  options: { limit?: number; cursor?: string } = {}
) {
  const { limit = 50, cursor } = options;
  const params = new URLSearchParams({
    limit: String(limit),
  });
  if (cursor) {
    params.append("cursor", cursor);
  }

  const response = await fetch(`${API_URL}/albums/${albumId}/media?${params}`, {
    next: { revalidate: 3600, tags: ["media"] },
  });
  return handleResponse<{ media: Media[]; pagination: any }>(response);
}
