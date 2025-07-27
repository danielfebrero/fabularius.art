import { useState, useCallback, useEffect } from "react";
import { Album } from "@/types";
import { albumsApi } from "@/lib/api";

interface CreateUserAlbumData {
  title: string;
  tags?: string[];
  isPublic: boolean;
  mediaIds?: string[];
}

interface UpdateUserAlbumData {
  title?: string;
  tags?: string[];
  isPublic?: boolean;
  coverImageUrl?: string;
}

interface UseUserAlbumsReturn {
  albums: Album[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  createAlbum: (data: CreateUserAlbumData) => Promise<Album>;
  updateAlbum: (albumId: string, data: UpdateUserAlbumData) => Promise<Album>;
  deleteAlbum: (albumId: string) => Promise<void>;
  fetchUserAlbums: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useUserAlbums(userId?: string): UseUserAlbumsReturn {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUserAlbums = useCallback(async (targetUserId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await albumsApi.getUserAlbums(targetUserId, {
        limit: 100, // Get a reasonable amount of albums
      });

      setAlbums(response.albums);
      setTotalCount(response.albums.length);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch albums";
      setError(errorMessage);
      console.error("Error fetching user albums:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (userId) {
      fetchUserAlbums(userId);
    }
  }, [userId, fetchUserAlbums]);

  // Auto-fetch when userId is provided
  useEffect(() => {
    if (userId) {
      fetchUserAlbums(userId);
    }
  }, [userId, fetchUserAlbums]);

  const createAlbum = useCallback(
    async (albumData: CreateUserAlbumData): Promise<Album> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/albums`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(albumData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create album");
        }

        const data = await response.json();
        if (data.success) {
          // Refetch albums after creating a new one
          if (userId) {
            setTimeout(() => fetchUserAlbums(userId), 100);
          }
          return data.data;
        } else {
          throw new Error(data.error || "Failed to create album");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create album";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [userId, fetchUserAlbums]
  );

  const updateAlbum = useCallback(
    async (albumId: string, albumData: UpdateUserAlbumData): Promise<Album> => {
      setLoading(true);
      setError(null);

      try {
        const response = await albumsApi.updateAlbum(albumId, albumData);

        // Update the album in the local state
        setAlbums((prev) =>
          prev.map((album) =>
            album.id === albumId ? { ...album, ...response } : album
          )
        );

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update album";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteAlbum = useCallback(async (albumId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await albumsApi.deleteAlbum(albumId);

      // Remove the album from the local state
      setAlbums((prev) => prev.filter((album) => album.id !== albumId));
      setTotalCount((prev) => prev - 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete album";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    albums,
    loading,
    error,
    totalCount,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    fetchUserAlbums,
    refetch,
  };
}
