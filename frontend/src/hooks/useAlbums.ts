import { useState, useEffect, useCallback } from "react";
import { Album } from "../types/index";

interface UseAlbumsOptions {
  isPublic?: boolean;
  publicOnly?: boolean;
  limit?: number;
  cursor?: string;
  page?: number;
  tag?: string; // New tag filter option
  initialAlbums?: Album[];
  initialPagination?: {
    hasNext: boolean;
    hasPrev: boolean;
    cursor: string | null;
    page?: number;
  } | null;
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
  const {
    isPublic,
    publicOnly,
    limit = 12,
    page,
    tag, // Extract tag option
    initialAlbums = [],
    initialPagination = null,
  } = options;
  const effectiveIsPublic = isPublic !== undefined ? isPublic : publicOnly;
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [loading, setLoading] = useState(initialAlbums.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    hasNext: boolean;
    hasPrev: boolean;
    cursor: string | null;
    page?: number;
  } | null>(initialPagination);

  const fetchAlbums = useCallback(
    async (cursor?: string, append = false) => {
      try {
        console.log("[useAlbums] fetchAlbums called", {
          cursor,
          append,
          limit,
          isPublic: effectiveIsPublic,
          page,
          tag,
        });
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

        if (tag) {
          params.append("tag", tag);
          console.log("[useAlbums] Adding tag to request:", tag);
        }

        const apiUrl =
          process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api";
        const response = await fetch(`${apiUrl}/albums?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch albums: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[useAlbums] fetch result", data);

        if (tag) {
          console.log(
            "[useAlbums] Filtered by tag:",
            tag,
            "Results:",
            data.data?.albums?.length || 0
          );
        }

        if (data.success) {
          // Backend returns {success: true, data: {albums: Album[], pagination: {...}}}
          const newAlbums = data.data.albums;
          const newPagination = data.data.pagination;

          if (append) {
            setAlbums((prev) => {
              const updated = [...prev, ...newAlbums];
              console.log("[useAlbums] setAlbums (append)", updated.length);
              return updated;
            });
          } else {
            setAlbums(() => {
              console.log("[useAlbums] setAlbums (replace)", newAlbums.length);
              return newAlbums;
            });
          }
          setPagination(() => {
            console.log("[useAlbums] setPagination", newPagination);
            return newPagination;
          });
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
    },
    [effectiveIsPublic, limit, page, tag]
  );

  const loadMore = useCallback(() => {
    if (pagination?.hasNext && pagination.cursor && !loadingMore) {
      fetchAlbums(pagination.cursor, true);
    }
  }, [pagination, loadingMore, fetchAlbums]);

  useEffect(() => {
    console.log(
      "[useAlbums] Effect triggered - initialAlbums.length:",
      initialAlbums.length
    );
    // Only fetch if we don't have initial data
    if (initialAlbums.length === 0) {
      console.log("[useAlbums] Fetching albums because no initial data");
      fetchAlbums();
    } else {
      console.log("[useAlbums] Skipping fetch because we have initial data");
    }
  }, [initialAlbums.length, fetchAlbums]);

  useEffect(() => {
    console.log(
      "[useAlbums] state change: albums",
      albums.length,
      "pagination",
      pagination
    );
  }, [albums, pagination]);

  return {
    albums,
    loading: loading || loadingMore,
    error,
    pagination,
    refetch: useCallback(() => fetchAlbums(), [fetchAlbums]),
    refresh: useCallback(() => fetchAlbums(), [fetchAlbums]),
    loadMore,
  };
}
