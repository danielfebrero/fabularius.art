import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { useLayoutEffect } from "react";
import { interactionApi } from "@/lib/api";
import {
  queryKeys,
  queryClient,
  updateCache,
  invalidateQueries,
} from "@/lib/queryClient";
import { InteractionRequest } from "@/types/user";
import { usePrefetchContext } from "@/contexts/PrefetchContext";

// Types
interface InteractionTarget {
  targetType: "album" | "media" | "comment";
  targetId: string;
}

interface InteractionStatusResponse {
  data: {
    statuses: any[];
  };
}

// Hook for fetching user interaction status (like/bookmark status for items)
export function useInteractionStatus(
  targets: InteractionTarget[],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const targetsKey =
    targets.length === 1
      ? getTargetKey(targets[0])
      : targets.map(getTargetKey).sort().join(",");
  const { isPrefetching, waitForPrefetch } = usePrefetchContext();
  const isCurrentlyPrefetching = isPrefetching(targetsKey);

  return useQuery<InteractionStatusResponse>({
    queryKey: queryKeys.user.interactions.status(targets),
    queryFn: async () => {
      if (targets.length === 0) {
        return { data: { statuses: [] } };
      }

      // If prefetching is in progress, wait for it to complete
      if (isCurrentlyPrefetching) {
        await waitForPrefetch(targetsKey);

        // Check if data is now available in cache
        const cachedData = queryClient.getQueryData(
          queryKeys.user.interactions.status(targets)
        ) as any;

        if (cachedData) {
          return cachedData;
        }
      }

      return await interactionApi.getInteractionStatus(targets);
    },
    enabled: enabled && targets.length > 0,
    // Keep interaction status fresh for 30 seconds
    staleTime: 30 * 1000,
    // Don't refetch on window focus (not critical for UX)
    refetchOnWindowFocus: false,
    // If prefetching, prefer cached data
    refetchOnMount: !isCurrentlyPrefetching,
  });
}

// Hook for reading interaction status from cache only (for buttons)
export function useInteractionStatusFromCache(targets: InteractionTarget[]) {
  return useInteractionStatus(targets, { enabled: false });
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
      targetType: "album" | "media" | "comment";
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

// Helper to create a unique key for a single target
function getTargetKey(target: InteractionTarget): string {
  return `${target.targetType}:${target.targetId}`;
}

// Utility hook for preloading interaction statuses
export function usePrefetchInteractionStatus() {
  const { isPrefetching, startPrefetch, endPrefetch } = usePrefetchContext();

  return {
    prefetch: async (targets: InteractionTarget[]) => {
      if (targets.length === 0) return;

      // Create individual keys for each target so individual queries can detect them
      const individualKeys = targets.map(getTargetKey);

      // Filter out targets that are already being prefetched
      const targetsNotPrefetching = targets.filter((target, index) => {
        const individualKey = individualKeys[index];
        return !isPrefetching(individualKey);
      });

      // If all targets are already being prefetched, skip
      if (targetsNotPrefetching.length === 0) {
        return;
      }

      // Only prefetch the targets that aren't already being prefetched
      const keysToPrefetch = targetsNotPrefetching.map(getTargetKey);

      // Create the prefetch promise
      const prefetchPromise = queryClient.prefetchQuery({
        queryKey: queryKeys.user.interactions.status(targetsNotPrefetching),
        queryFn: async () => {
          // Check if any individual targets already have cached data
          const cachedStatuses: any[] = [];
          const targetsNeedingFetch: InteractionTarget[] = [];

          targetsNotPrefetching.forEach((target) => {
            const singleTarget = [target];
            const cachedData = queryClient.getQueryData(
              queryKeys.user.interactions.status(singleTarget)
            ) as any;

            if (cachedData?.data?.statuses?.[0]) {
              // Use cached data for this target
              cachedStatuses.push(cachedData.data.statuses[0]);
            } else {
              // Need to fetch this target
              targetsNeedingFetch.push(target);
            }
          });

          let fetchedStatuses: any[] = [];

          // Only make API call if there are targets that need fetching
          if (targetsNeedingFetch.length > 0) {
            const result = await interactionApi.getInteractionStatus(
              targetsNeedingFetch
            );

            if (result.data?.statuses) {
              fetchedStatuses = result.data.statuses;

              // Populate individual query caches from bulk response
              fetchedStatuses.forEach((status: any) => {
                const singleTarget = [
                  {
                    targetType: status.targetType,
                    targetId: status.targetId,
                  },
                ];

                queryClient.setQueryData(
                  queryKeys.user.interactions.status(singleTarget),
                  {
                    data: {
                      statuses: [status],
                    },
                  }
                );
              });
            }
          }

          // Combine cached and fetched statuses
          const allStatuses = [...cachedStatuses, ...fetchedStatuses];

          return {
            data: {
              statuses: allStatuses,
            },
          };
        },
        staleTime: 30 * 1000, // 30 seconds
      });

      // Mark individual keys as prefetching with the shared promise
      startPrefetch(keysToPrefetch, prefetchPromise);

      try {
        await prefetchPromise;
      } finally {
        // Remove from prefetching set when done
        endPrefetch(keysToPrefetch);
      }
    },

    // Helper to check if targets are currently being prefetched
    isPrefetching: (targets: InteractionTarget[]) => {
      const targetKey =
        targets.length === 1
          ? getTargetKey(targets[0])
          : targets.map(getTargetKey).sort().join(",");
      return isPrefetching(targetKey);
    },
  };
}

// Convenience hook for automatically prefetching targets with proper async handling
// Uses useLayoutEffect for earliest possible execution, especially important for SSG pages
export function useAutoPrefetchInteractionStatus(targets: InteractionTarget[]) {
  const { prefetch } = usePrefetchInteractionStatus();

  useLayoutEffect(() => {
    if (targets.length > 0) {
      const prefetchData = async () => {
        try {
          await prefetch(targets);
        } catch (error) {
          console.error("Failed to prefetch interaction status:", error);
        }
      };

      prefetchData();
    }
  }, [targets, prefetch]);
}
