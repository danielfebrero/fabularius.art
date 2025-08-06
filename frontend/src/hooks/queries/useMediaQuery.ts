import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api";
import { queryKeys, queryClient, invalidateQueries } from "@/lib/queryClient";
import { UnifiedMediaResponse } from "@/types";

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

// Use the new unified response type
type MediaResponse = UnifiedMediaResponse;

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
      return lastPage.data.pagination?.hasNext
        ? lastPage.data.pagination.cursor
        : undefined;
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
      return lastPage.data.pagination?.hasNext
        ? lastPage.data.pagination.cursor
        : undefined;
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
