import { useState, useEffect, useCallback } from "react";
import { Media } from "../types/index";
import API_URL from "@/lib/api";

interface UseMediaOptions {
  albumId: string;
  limit?: number;
  cursor?: string;
}

interface UseMediaReturn {
  media: Media[];
  loading: boolean;
  error: string | null;
  pagination: {
    hasNext: boolean;
    cursor: string | null;
  } | null;
  refetch: () => void;
  loadMore: () => void;
}

export function useMedia(options: UseMediaOptions): UseMediaReturn {
  const { albumId, limit = 20 } = options;
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    hasNext: boolean;
    cursor: string | null;
  } | null>(null);

  const fetchMedia = useCallback(
    async (cursor?: string, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setError(null);
        }

        const params = new URLSearchParams({
          limit: limit.toString(),
        });

        if (cursor) {
          params.append("cursor", cursor);
        }

        const response = await fetch(
          `${API_URL}/albums/${albumId}/media?${params}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Album not found");
          }
          if (response.status === 403) {
            throw new Error("Access denied - this album is private");
          }
          throw new Error(`Failed to fetch media: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          // Backend returns {success: true, data: {media: Media[], pagination: {...}}}
          const newMedia = data.data.media || data.data; // Handle both formats
          const newPagination = data.data.pagination;

          if (append) {
            setMedia((prev) => [...prev, ...newMedia]);
          } else {
            setMedia(newMedia);
          }
          setPagination(newPagination);
        } else {
          throw new Error(data.error || "Failed to fetch media");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        if (!append) {
          setMedia([]);
          setPagination(null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [albumId, limit]
  );

  const loadMore = useCallback(() => {
    if (pagination?.hasNext && pagination.cursor && !loadingMore) {
      fetchMedia(pagination.cursor, true);
    }
  }, [pagination, loadingMore, fetchMedia]);

  useEffect(() => {
    if (albumId) {
      fetchMedia();
    }
  }, [albumId, fetchMedia]);

  return {
    media,
    loading: loading || loadingMore,
    error,
    pagination,
    refetch: useCallback(() => fetchMedia(), [fetchMedia]),
    loadMore,
  };
}
