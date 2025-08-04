import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { interactionApi } from "@/lib/api";
import {
  queryKeys,
  queryClient,
  updateCache,
  invalidateQueries,
} from "@/lib/queryClient";
import { InteractionRequest } from "@/types/user";

// Types
interface InteractionTarget {
  targetType: "album" | "media";
  targetId: string;
}

// Hook for fetching user interaction status (like/bookmark status for items)
export function useInteractionStatus(targets: InteractionTarget[]) {
  return useQuery({
    queryKey: queryKeys.user.interactions.status(targets),
    queryFn: async () => {
      if (targets.length === 0) {
        return { data: { statuses: [] } };
      }
      return await interactionApi.getInteractionStatus(targets);
    },
    enabled: targets.length > 0,
    // Keep interaction status fresh for 30 seconds
    staleTime: 30 * 1000,
    // Don't refetch on window focus (not critical for UX)
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching user's bookmarks with infinite scroll - UPDATED for unified pagination
export function useBookmarks(params: { limit?: number } = {}) {
  const { limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: queryKeys.user.interactions.bookmarks(params),
    queryFn: async ({ pageParam }) => {
      return await interactionApi.getBookmarks(limit, pageParam);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => {
      return lastPage.data?.pagination?.hasNext
        ? lastPage.data.pagination.cursor
        : undefined;
    },
    // Keep bookmarks fresh for 1 minute
    staleTime: 60 * 1000,
    // Enable background refetching for bookmarks
    refetchOnWindowFocus: true,
  });
}

// Hook for fetching user's likes with infinite scroll - UPDATED for unified pagination
export function useLikes(targetUser?: string, params: { limit?: number } = {}) {
  const { limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: queryKeys.user.interactions.likes({ ...params }),
    queryFn: async ({ pageParam }) => {
      if (targetUser) {
        return await interactionApi.getLikesByUsername(
          targetUser,
          limit,
          pageParam
        );
      } else {
        return await interactionApi.getLikes(limit, pageParam);
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => {
      return lastPage.data?.pagination?.hasNext
        ? lastPage.data.pagination.cursor
        : undefined;
    },
    enabled: !!targetUser || true, // Always enabled for own likes, enabled only if targetUser provided for others
    // Keep likes fresh for 1 minute
    staleTime: 60 * 1000,
    // Enable background refetching for likes
    refetchOnWindowFocus: true,
  });
}

// Hook for fetching user's comments with infinite scroll - UPDATED for unified pagination
export function useComments(username: string, params: { limit?: number } = {}) {
  const { limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: queryKeys.user.interactions.comments({ username, ...params }),
    queryFn: async ({ pageParam }) => {
      return await interactionApi.getCommentsByUsername(
        username,
        limit,
        pageParam
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => {
      return lastPage.data?.pagination?.hasNext
        ? lastPage.data.pagination.cursor
        : undefined;
    },
    enabled: !!username,
    // Keep comments fresh for 1 minute
    staleTime: 60 * 1000,
  });
}

// Hook for fetching target-specific comments (album/media comments)
export function useTargetComments(
  targetType: "album" | "media",
  targetId: string,
  params: { limit?: number } = {}
) {
  const { limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: queryKeys.comments.byTarget(targetType, targetId),
    queryFn: async ({ pageParam }) => {
      return await interactionApi.getComments(
        targetType,
        targetId,
        limit,
        pageParam
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => {
      return lastPage.data?.nextCursor;
    },
    enabled: !!targetType && !!targetId,
    // Keep comments fresh for 1 minute
    staleTime: 60 * 1000,
  });
}

// Hook for fetching user insights (total likes/bookmarks received)
export function useUserInsights() {
  return useQuery({
    queryKey: queryKeys.user.interactions.insights(),
    queryFn: async () => await interactionApi.getInsights(),
    // Keep insights fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Enable background refetching
    refetchOnWindowFocus: true,
  });
}

// Mutation for toggling like status
export function useToggleLike() {
  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      albumId,
      isCurrentlyLiked,
    }: {
      targetType: "album" | "media";
      targetId: string;
      albumId?: string;
      isCurrentlyLiked: boolean;
    }) => {
      const request: InteractionRequest = {
        action: isCurrentlyLiked ? "remove" : "add",
        targetType,
        targetId,
      };

      // Add albumId for media interactions only if provided
      if (targetType === "media" && albumId) {
        request.albumId = albumId;
      }

      return await interactionApi.like(request);
    },
    onMutate: async ({ targetType, targetId, isCurrentlyLiked }) => {
      // Cancel outgoing refetches
      const targets = [{ targetType, targetId }];
      await queryClient.cancelQueries({
        queryKey: queryKeys.user.interactions.status(targets),
      });

      // Optimistically update interaction status
      updateCache.userInteractionStatus(targetType, targetId, {
        userLiked: !isCurrentlyLiked,
      });

      // Optimistically update counts
      updateCache.interactionCounts(
        targetType,
        targetId,
        "like",
        isCurrentlyLiked ? -1 : 1
      );

      return { targetType, targetId, isCurrentlyLiked };
    },
    onError: (error, variables, context) => {
      console.error("Failed to toggle like:", error);

      if (context) {
        // Revert optimistic updates
        updateCache.userInteractionStatus(
          context.targetType,
          context.targetId,
          {
            userLiked: context.isCurrentlyLiked,
          }
        );

        updateCache.interactionCounts(
          context.targetType,
          context.targetId,
          "like",
          context.isCurrentlyLiked ? 1 : -1
        );
      }

      // Invalidate to refetch correct data
      invalidateQueries.userInteractions();
    },
    onSuccess: (data, { targetType, targetId }) => {
      // Invalidate related queries to ensure consistency
      const targets = [{ targetType, targetId }];
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.interactions.status(targets),
      });

      // Invalidate likes list if it's a like action
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.interactions.likes(),
      });

      // Invalidate insights to update received likes count
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.interactions.insights(),
      });
    },
  });
}

// Mutation for toggling bookmark status
export function useToggleBookmark() {
  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      albumId,
      isCurrentlyBookmarked,
    }: {
      targetType: "album" | "media";
      targetId: string;
      albumId?: string;
      isCurrentlyBookmarked: boolean;
    }) => {
      const request: InteractionRequest = {
        action: isCurrentlyBookmarked ? "remove" : "add",
        targetType,
        targetId,
      };

      // Add albumId for media interactions only if provided
      if (targetType === "media" && albumId) {
        request.albumId = albumId;
      }

      return await interactionApi.bookmark(request);
    },
    onMutate: async ({ targetType, targetId, isCurrentlyBookmarked }) => {
      // Cancel outgoing refetches
      const targets = [{ targetType, targetId }];
      await queryClient.cancelQueries({
        queryKey: queryKeys.user.interactions.status(targets),
      });

      // Optimistically update interaction status
      updateCache.userInteractionStatus(targetType, targetId, {
        userBookmarked: !isCurrentlyBookmarked,
      });

      // Optimistically update counts
      updateCache.interactionCounts(
        targetType,
        targetId,
        "bookmark",
        isCurrentlyBookmarked ? -1 : 1
      );

      return { targetType, targetId, isCurrentlyBookmarked };
    },
    onError: (error, variables, context) => {
      console.error("Failed to toggle bookmark:", error);

      if (context) {
        // Revert optimistic updates
        updateCache.userInteractionStatus(
          context.targetType,
          context.targetId,
          {
            userBookmarked: context.isCurrentlyBookmarked,
          }
        );

        updateCache.interactionCounts(
          context.targetType,
          context.targetId,
          "bookmark",
          context.isCurrentlyBookmarked ? 1 : -1
        );
      }

      // Invalidate to refetch correct data
      invalidateQueries.userInteractions();
    },
    onSuccess: (data, { targetType, targetId }) => {
      // Invalidate related queries to ensure consistency
      const targets = [{ targetType, targetId }];
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.interactions.status(targets),
      });

      // Invalidate bookmarks list
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.interactions.bookmarks(),
      });

      // Invalidate insights to update received bookmarks count
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.interactions.insights(),
      });
    },
  });
}

// Utility hook for preloading interaction statuses
export function usePrefetchInteractionStatus() {
  return {
    prefetch: (targets: InteractionTarget[]) => {
      if (targets.length === 0) return;

      queryClient.prefetchQuery({
        queryKey: queryKeys.user.interactions.status(targets),
        queryFn: () => interactionApi.getInteractionStatus(targets),
        staleTime: 30 * 1000, // 30 seconds
      });
    },
  };
}
