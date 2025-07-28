import { useState, useEffect, useCallback } from "react";
import { Album } from "../types/index";
import API_URL from "@/lib/api";

interface UseAlbumReturn {
  album: Album | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAlbum(albumId: string): UseAlbumReturn {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbum = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/albums/${albumId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Album not found");
        }
        if (response.status === 403) {
          throw new Error("Access denied - this album is private");
        }
        throw new Error(`Failed to fetch album: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setAlbum(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch album");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setAlbum(null);
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    if (albumId) {
      fetchAlbum();
    }
  }, [albumId, fetchAlbum]);

  return {
    album,
    loading,
    error,
    refetch: fetchAlbum,
  };
}
