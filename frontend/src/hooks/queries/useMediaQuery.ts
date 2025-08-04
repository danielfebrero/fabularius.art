import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api";
import { queryKeys, queryClient, invalidateQueries } from "@/lib/queryClient";
import { Media } from "@/types";

// Types
interface UploadMediaData {
  filename: string;
  mimeType: string;
  size: number;
}

interface MediaQueryParams {
  limit?: number;
  cursor?: string;
}

interface AlbumMediaQueryParams {
  albumId: string;
  limit?: number;
  cursor?: string;
}

interface MediaResponse {
  media: Media[];
  nextCursor?: string;
  hasNext: boolean;
}

// Hook for fetching user's media with infinite scroll support
export function useUserMedia(params: MediaQueryParams = {}) {
  const { limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: ["media", "user", params],
    queryFn: async ({ pageParam }) => {
      return await mediaApi.getUserMedia({
        limit,
        cursor: pageParam,
      });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: MediaResponse) => {
      return lastPage.hasNext ? lastPage.nextCursor : undefined;
    },
    // Keep media fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Enable background refetching
    refetchOnWindowFocus: true,
  });
}

// Hook for fetching album media with infinite scroll support
export function useAlbumMedia(params: AlbumMediaQueryParams) {
  const { albumId, limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: ["media", "album", albumId, { limit }],
    queryFn: async ({ pageParam }) => {
      return await mediaApi.getAlbumMedia(albumId, {
        limit,
        cursor: pageParam,
      });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: MediaResponse) => {
      return lastPage.hasNext ? lastPage.nextCursor : undefined;
    },
    enabled: !!albumId,
    // Keep album media fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Enable background refetching
    refetchOnWindowFocus: true,
  });
}

// Hook for fetching single media item by ID
export function useMediaById(mediaId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.media.detail(mediaId),
    queryFn: async () => {
      return await mediaApi.getMediaById(mediaId);
    },
    enabled: !!mediaId && enabled,
    // Keep media details fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Enable background refetching for media details
    refetchOnWindowFocus: true,
  });
}

// Mutation hook for uploading media to an album
export function useUploadMedia() {
  return useMutation({
    mutationFn: async ({
      albumId,
      mediaData,
    }: {
      albumId: string;
      mediaData: UploadMediaData;
    }) => {
      return await mediaApi.uploadMedia(albumId, mediaData);
    },
    onSuccess: (data, variables) => {
      // Invalidate album media queries
      queryClient.invalidateQueries({
        queryKey: ["media", "album", variables.albumId],
      });

      // Invalidate user media queries
      queryClient.invalidateQueries({
        queryKey: ["media", "user"],
      });

      // Invalidate the specific album
      invalidateQueries.album(variables.albumId);
    },
  });
}

// Mutation hook for deleting media with optimistic updates
export function useDeleteMedia() {
  return useMutation({
    mutationFn: async ({
      albumId,
      mediaId,
    }: {
      albumId: string;
      mediaId: string;
    }) => {
      return await mediaApi.deleteMedia(albumId, mediaId);
    },
    onMutate: async ({ albumId, mediaId }) => {
      // Cancel any outgoing refetches for album media
      await queryClient.cancelQueries({
        queryKey: ["media", "album", albumId],
      });

      // Snapshot the previous value
      const previousAlbumMedia = queryClient.getQueriesData({
        queryKey: ["media", "album", albumId],
      });

      // Optimistically remove the media from album media lists
      queryClient.setQueriesData(
        { queryKey: ["media", "album", albumId] },
        (old: any) => {
          if (!old?.pages) return old;

          const newPages = old.pages.map((page: any) => ({
            ...page,
            media: page.media.filter((m: any) => m.id !== mediaId),
          }));

          return {
            ...old,
            pages: newPages,
          };
        }
      );

      // Return context for rollback
      return { previousAlbumMedia, albumId, mediaId };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to undo the optimistic update
      if (context?.previousAlbumMedia) {
        context.previousAlbumMedia.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, variables) => {
      // Remove from cache completely
      queryClient.removeQueries({
        queryKey: queryKeys.media.detail(variables.mediaId),
      });

      // Invalidate related queries
      invalidateQueries.media(variables.mediaId);
      invalidateQueries.album(variables.albumId);
    },
    onSettled: (data, error, variables) => {
      // Invalidate queries to ensure we have fresh data
      queryClient.invalidateQueries({
        queryKey: ["media", "album", variables.albumId],
      });
      queryClient.invalidateQueries({
        queryKey: ["media", "user"],
      });
    },
  });
}
