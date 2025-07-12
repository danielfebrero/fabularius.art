import { useState, useEffect } from "react";
import { Album } from "../types/index";

interface UseAlbumsOptions {
  isPublic?: boolean;
  publicOnly?: boolean;
  limit?: number;
  cursor?: string;
  page?: number;
}

interface UseAlbumsReturn {
  albums: Album[];
  loading: boolean;
  error: string | null;
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    cursor: string | null;
    page?: number;
  } | null;
  refetch: () => void;
  refresh: () => void;
  loadMore: () => void;
}

export function useAlbums(options: UseAlbumsOptions = {}): UseAlbumsReturn {
  const { isPublic, publicOnly, limit = 12, page } = options;
  const effectiveIsPublic = isPublic !== undefined ? isPublic : publicOnly;
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    hasNext: boolean;
    hasPrev: boolean;
    cursor: string | null;
    page?: number;
  } | null>(null);

  const fetchAlbums = async (cursor?: string, append = false) => {
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

      if (effectiveIsPublic !== undefined) {
        params.append("isPublic", effectiveIsPublic.toString());
      }

      if (page !== undefined) {
        params.append("page", page.toString());
      }

      if (cursor) {
        params.append("cursor", cursor);
      }

      const apiUrl =
        process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api";
      const response = await fetch(`${apiUrl}/albums?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch albums: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Backend returns {success: true, data: {albums: Album[], pagination: {...}}}
        const newAlbums = data.data.albums;
        const newPagination = data.data.pagination;

        if (append) {
          setAlbums((prev) => [...prev, ...newAlbums]);
        } else {
          setAlbums(newAlbums);
        }
        setPagination(newPagination);
      } else {
        throw new Error(data.error || "Failed to fetch albums");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      if (!append) {
        setAlbums([]);
        setPagination(null);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (pagination?.hasNext && pagination.cursor && !loadingMore) {
      fetchAlbums(pagination.cursor, true);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, [effectiveIsPublic, limit, page, fetchAlbums]);

  return {
    albums,
    loading: loading || loadingMore,
    error,
    pagination,
    refetch: () => fetchAlbums(),
    refresh: () => fetchAlbums(),
    loadMore,
  };
}
