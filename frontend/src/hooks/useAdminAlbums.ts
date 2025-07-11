import { useState, useCallback } from "react";
import { Album } from "@/types";
import API_URL from "@/lib/api";

interface CreateAlbumData {
  title: string;
  description?: string;
  isPublic: boolean;
}

interface UpdateAlbumData {
  title?: string;
  description?: string;
  isPublic?: boolean;
}

export function useAdminAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/admin/albums`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch albums");
      }

      const data = await response.json();
      if (data.success) {
        setAlbums(data.data.albums || []);
      } else {
        throw new Error(data.error || "Failed to fetch albums");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch albums");
    } finally {
      setLoading(false);
    }
  }, []);

  const createAlbum = useCallback(
    async (albumData: CreateAlbumData): Promise<Album> => {
      setError(null);

      const response = await fetch(`${API_URL}/albums`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(albumData),
      });

      if (!response.ok) {
        throw new Error("Failed to create album");
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || "Failed to create album");
      }
    },
    []
  );

  const updateAlbum = useCallback(
    async (albumId: string, albumData: UpdateAlbumData): Promise<Album> => {
      setError(null);

      const response = await fetch(`${API_URL}/admin/albums/${albumId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(albumData),
      });

      if (!response.ok) {
        throw new Error("Failed to update album");
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || "Failed to update album");
      }
    },
    []
  );

  const deleteAlbum = useCallback(async (albumId: string): Promise<void> => {
    setError(null);

    const response = await fetch(`${API_URL}/admin/albums/${albumId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete album");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to delete album");
    }
  }, []);

  const bulkDeleteAlbums = useCallback(
    async (albumIds: string[]): Promise<void> => {
      setError(null);

      const deletePromises = albumIds.map((albumId) => deleteAlbum(albumId));
      await Promise.all(deletePromises);
    },
    [deleteAlbum]
  );

  const getAlbum = useCallback(async (albumId: string): Promise<Album> => {
    setError(null);

    const response = await fetch(`${API_URL}/albums/${albumId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch album");
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || "Failed to fetch album");
    }
  }, []);

  return {
    albums,
    loading,
    error,
    fetchAlbums,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    bulkDeleteAlbums,
    getAlbum,
  };
}
