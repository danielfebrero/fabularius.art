import { useState, useEffect, useCallback, useRef } from "react";
import { Album } from "../types";

interface UseAlbumsOptions {
  publicOnly?: boolean;
  page?: number;
  limit?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UseAlbumsReturn {
  albums: Album[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refresh: () => void;
}

export function useAlbums(options: UseAlbumsOptions = {}): UseAlbumsReturn {
  const { publicOnly = false, page = 1, limit = 12 } = options;

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Use ref to track the latest request to handle race conditions
  const latestRequestRef = useRef<number>(0);

  const fetchAlbums = useCallback(async () => {
    const requestId = ++latestRequestRef.current;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(publicOnly && { publicOnly: "true" }),
      });

      const response = await fetch(`/api/albums?${params}`);
      const data = await response.json();

      // Only update state if this is still the latest request
      if (requestId === latestRequestRef.current) {
        if (data.success) {
          setAlbums(data.data);
          setPagination(data.pagination);
        } else {
          setError(data.error || "Failed to fetch albums");
          setAlbums([]);
          setPagination(null);
        }
      }
    } catch (err) {
      // Only update state if this is still the latest request
      if (requestId === latestRequestRef.current) {
        setError("Failed to fetch albums");
        setAlbums([]);
        setPagination(null);
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (requestId === latestRequestRef.current) {
        setLoading(false);
      }
    }
  }, [publicOnly, page, limit]);

  const refresh = useCallback(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    return () => {
      latestRequestRef.current = -1;
    };
  }, []);

  return {
    albums,
    loading,
    error,
    pagination,
    refresh,
  };
}
