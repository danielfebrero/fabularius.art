import { useState, useEffect, useCallback } from "react";
import { albumsApi } from "@/lib/api";
import { Album } from "@/types";

interface UseProfileAlbumsOptions {
  username: string;
  limit?: number;
}

interface ProfileAlbumsData {
  albums: Album[];
  loading: boolean;
  error: string | null;
  hasNext: boolean;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
}

export function useProfileAlbums({
  username,
  limit = 12,
}: UseProfileAlbumsOptions): ProfileAlbumsData {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const fetchAlbums = useCallback(
    async (cursor?: string, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await albumsApi.getAlbums({
          user: username,
          limit,
          cursor,
        });

        if (response) {
          if (append) {
            setAlbums((prev) => [...prev, ...response.albums]);
          } else {
            setAlbums(response.albums);
          }

          setHasNext(response.hasNext);
          setNextCursor(response.nextCursor);
        } else {
          setError("Failed to fetch albums");
        }
      } catch (err) {
        console.error("Error fetching user albums:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [username, limit]
  );

  const loadMore = useCallback(async () => {
    if (hasNext && !loadingMore && nextCursor) {
      await fetchAlbums(nextCursor, true);
    }
  }, [hasNext, loadingMore, nextCursor, fetchAlbums]);

  useEffect(() => {
    if (username) {
      setAlbums([]);
      setNextCursor(undefined);
      fetchAlbums();
    }
  }, [username, limit, fetchAlbums]);

  return {
    albums,
    loading,
    error,
    hasNext,
    loadMore,
    loadingMore,
  };
}
