import { useState, useCallback } from "react";
import { Album } from "@/types";
import API_URL from "@/lib/api";

interface CreateUserAlbumData {
  title: string;
  tags?: string[];
  isPublic: boolean;
  mediaIds?: string[];
}

export function useUserAlbums() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAlbum = useCallback(
    async (albumData: CreateUserAlbumData): Promise<Album> => {
      setLoading(true);
      setError(null);

      try {
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
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create album";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createAlbum,
    loading,
    error,
  };
}
