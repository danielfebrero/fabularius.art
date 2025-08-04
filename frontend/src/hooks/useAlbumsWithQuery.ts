import { useMemo } from "react";
import {
  useAlbums as useAlbumsQuery,
  useCreateAlbum,
  useUpdateAlbum,
  useDeleteAlbum,
} from "@/hooks/queries/useAlbumsQuery";
import { Album } from "@/types";
import { useUser } from "@/hooks/useUser";

// Keep the same interface as the original useAlbums hook for backward compatibility
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
  user?: string;

  // Filtering options
  isPublic?: boolean;
  limit?: number;
  cursor?: string;
  tag?: string;

  // Initial data for SSR/SSG compatibility
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
  loadingMore: boolean;
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

  // Actions for authenticated users
  createAlbum?: (data: CreateUserAlbumData) => Promise<Album>;
  updateAlbum?: (albumId: string, data: UpdateUserAlbumData) => Promise<Album>;
  deleteAlbum?: (albumId: string) => Promise<void>;
}

/**
 * Modern useAlbums hook powered by TanStack Query
 *
 * This provides the same interface as the original useAlbums hook but with
 * enhanced caching, background refetching, and optimistic updates.
 */
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

  // Use TanStack Query for data fetching
  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    error: queryError,
    refetch: queryRefetch,
    fetchNextPage,
    hasNextPage,
  } = useAlbumsQuery({
    user,
    isPublic,
    limit,
    tag,
  });

  // Get mutation hooks
  const createMutation = useCreateAlbum();
  const updateMutation = useUpdateAlbum();
  const deleteMutation = useDeleteAlbum();

  // Transform infinite query data to flat array
  const albums = useMemo(() => {
    if (!infiniteData?.pages) {
      return initialAlbums;
    }

    return infiniteData.pages.flatMap((page) => page.albums || []);
  }, [infiniteData?.pages, initialAlbums]);

  // Calculate pagination state
  const pagination = useMemo(() => {
    if (infiniteData?.pages?.length) {
      const lastPage = infiniteData.pages[infiniteData.pages.length - 1];
      return {
        hasNext: !!hasNextPage,
        cursor: lastPage.nextCursor || null,
      };
    }

    return initialPagination;
  }, [infiniteData?.pages, hasNextPage, initialPagination]);

  // Error handling
  const error = useMemo(() => {
    if (queryError instanceof Error) {
      return queryError.message;
    }
    return null;
  }, [queryError]);

  // Action functions
  const refetch = () => {
    queryRefetch();
  };

  const refresh = () => {
    queryRefetch();
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // CRUD operations (only available when user is logged in and authorized)
  const createAlbum = useMemo(() => {
    if (!currentUser || (user && user !== currentUser.username)) {
      return undefined;
    }

    return async (albumData: CreateUserAlbumData): Promise<Album> => {
      try {
        return await createMutation.mutateAsync(albumData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create album";
        throw new Error(errorMessage);
      }
    };
  }, [currentUser, user, createMutation]);

  const updateAlbum = useMemo(() => {
    if (!currentUser || (user && user !== currentUser.username)) {
      return undefined;
    }

    return async (
      albumId: string,
      albumData: UpdateUserAlbumData
    ): Promise<Album> => {
      try {
        return await updateMutation.mutateAsync({ albumId, data: albumData });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update album";
        throw new Error(errorMessage);
      }
    };
  }, [currentUser, user, updateMutation]);

  const deleteAlbum = useMemo(() => {
    if (!currentUser || (user && user !== currentUser.username)) {
      return undefined;
    }

    return async (albumId: string): Promise<void> => {
      try {
        await deleteMutation.mutateAsync(albumId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete album";
        throw new Error(errorMessage);
      }
    };
  }, [currentUser, user, deleteMutation]);

  // Build the return object
  const result: UseAlbumsReturn = {
    albums,
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    error,
    totalCount: albums.length, // Note: This is not the total from server, just current loaded count
    pagination,
    refetch,
    refresh,
    loadMore,
  };

  // Add CRUD operations if available
  if (createAlbum) result.createAlbum = createAlbum;
  if (updateAlbum) result.updateAlbum = updateAlbum;
  if (deleteAlbum) result.deleteAlbum = deleteAlbum;

  return result;
}
