import { useState, useEffect, useCallback } from "react";
import { Album } from "../types/index";
import { albumsApi } from "@/lib/api";
import { useUser } from "@/hooks/useUser";

interface CreateUserAlbumData {
  title: string;
  tags?: string[];
  isPublic: boolean;
  mediaIds?: string[];
  coverImageId?: string;
}

interface UpdateUserAlbumData {
  title?: string;
  tags?: string[];
  isPublic?: boolean;
  coverImageUrl?: string;
}

interface UseAlbumsOptions {
  // User-specific options
  user?: string; // If provided, fetch albums by this username

  // Filtering options
  isPublic?: boolean; // Filter by public status (optional)
  limit?: number;
  cursor?: string;
  tag?: string;

  // Initial data for SSR/SSG
  initialAlbums?: Album[];
  initialPagination?: {
    hasNext: boolean;
    cursor: string | null;
  } | null;
}

interface UseAlbumsReturn {
  // Data
  albums: Album[];
  loading: boolean;
  loadingMore: boolean; // Add separate loadingMore state
  error: string | null;
  totalCount: number;

  // Pagination
  pagination: {
    hasNext: boolean;
    cursor: string | null;
  } | null;

  // Actions for fetching
  refetch: () => void;
  refresh: () => void;
  loadMore: () => void;

  // Actions for authenticated users (only available when no user is specified)
  createAlbum?: (data: CreateUserAlbumData) => Promise<Album>;
  updateAlbum?: (albumId: string, data: UpdateUserAlbumData) => Promise<Album>;
  deleteAlbum?: (albumId: string) => Promise<void>;
}

export function useAlbums(options: UseAlbumsOptions = {}): UseAlbumsReturn {
  const {
    user,
    isPublic,
    limit = 12,
    tag,
    initialAlbums = [],
    initialPagination = null,
  } = options;

  // Get current logged-in user for authorization checks
  const { user: currentUser } = useUser();

  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [loading, setLoading] = useState(initialAlbums.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(initialAlbums.length);
  const [pagination, setPagination] = useState<{
    hasNext: boolean;
    cursor: string | null;
  } | null>(initialPagination);

  const fetchAlbums = useCallback(
    async (cursor?: string, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setError(null);
        }

        const params: any = {
          limit,
        };

        if (user) {
          params.user = user;
        }

        if (isPublic !== undefined) {
          params.isPublic = isPublic;
        }

        if (cursor) {
          params.cursor = cursor;
        }

        if (tag) {
          params.tag = tag;
        }

        const response = await albumsApi.getAlbums(params);

        if (append) {
          setAlbums((prev) => {
            const updated = [...prev, ...response.data.albums];
            return updated;
          });
        } else {
          setAlbums(() => {
            return response.data.albums;
          });
          setTotalCount(response.data.albums.length);
        }

        setPagination(() => {
          const newPagination = {
            hasNext: response.data.pagination.hasNext,
            cursor: response.data.pagination.cursor || null,
          };
          return newPagination;
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch albums";
        setError(errorMessage);
        if (!append) {
          setAlbums([]);
          setPagination(null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, isPublic, limit, tag]
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
      fetchAlbums();
    } else {
    }
  }, [initialAlbums.length, fetchAlbums]);

  // CRUD operations - only available when user is logged in and authorized
  const createAlbum = useCallback(
    async (albumData: CreateUserAlbumData): Promise<Album> => {
      if (!currentUser) {
        throw new Error("You must be logged in to create albums");
      }

      if (user && user !== currentUser.username) {
        throw new Error("You can only create albums on your own profile");
      }

      setLoading(true);
      setError(null);

      try {
        const response = await albumsApi.createAlbum(albumData);

        // Refetch albums after creating a new one
        setTimeout(() => fetchAlbums(), 100);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create album";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, user, fetchAlbums]
  );

  const updateAlbum = useCallback(
    async (albumId: string, albumData: UpdateUserAlbumData): Promise<Album> => {
      if (!currentUser) {
        throw new Error("You must be logged in to update albums");
      }

      if (user && user !== currentUser.username) {
        throw new Error("You can only update albums on your own profile");
      }

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
    [currentUser, user]
  );

  const deleteAlbum = useCallback(
    async (albumId: string): Promise<void> => {
      if (!currentUser) {
        throw new Error("You must be logged in to delete albums");
      }

      if (user && user !== currentUser.username) {
        throw new Error("You can only delete albums on your own profile");
      }

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
    },
    [currentUser, user]
  );

  const result: UseAlbumsReturn = {
    albums,
    loading,
    loadingMore, // Also provide separate loadingMore state
    error,
    totalCount,
    pagination,
    refetch: useCallback(() => fetchAlbums(), [fetchAlbums]),
    refresh: useCallback(() => fetchAlbums(), [fetchAlbums]),
    loadMore,
  };

  // Only add CRUD operations when current user is logged in and authorized
  // Allow CRUD when: 1) No user parameter (own albums), or 2) User parameter matches current user
  if (currentUser && (!user || user === currentUser.username)) {
    result.createAlbum = createAlbum;
    result.updateAlbum = updateAlbum;
    result.deleteAlbum = deleteAlbum;
  }

  return result;
}
