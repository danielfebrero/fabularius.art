"use client";

import { useState, useEffect, useCallback } from "react";
import { interactionApi } from "@/lib/api";
import { UnifiedUserInteractionsResponse, UserInteraction } from "@/types/user";
import { useUser } from "./useUser";
import { useUserInteractionStatus } from "./useUserInteractionStatus";

interface UseLikesOptions {
  // User-specific options
  user?: string; // If provided, fetch likes by this username

  // Initial data for SSR/SSG
  initialLikes?: UserInteraction[];

  // Initial load flag
  initialLoad?: boolean;

  // Pagination options
  limit?: number;
}

export interface UseLikesReturn {
  // Data
  likes: UserInteraction[];
  totalCount: number;
  hasMore: boolean;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;

  // Actions
  fetchLikes: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useLikes = (
  optionsOrInitialLoad: UseLikesOptions | boolean = {}
): UseLikesReturn => {
  // Handle backward compatibility with boolean parameter
  const options =
    typeof optionsOrInitialLoad === "boolean"
      ? { initialLoad: optionsOrInitialLoad }
      : optionsOrInitialLoad;

  const {
    user: targetUser,
    initialLikes = [],
    initialLoad = true,
    limit = 20,
  } = options;

  const { user: currentUser } = useUser();
  const { preloadStatuses } = useUserInteractionStatus();
  const [likes, setLikes] = useState<UserInteraction[]>(initialLikes);
  const [totalCount, setTotalCount] = useState(initialLikes.length);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(initialLikes.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastKey, setLastKey] = useState<string | undefined>();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchLikes = useCallback(
    async (page: number = 1, reset: boolean = true) => {
      // For profile views, we don't need to check currentUser authentication
      // For authenticated user views, we do need currentUser
      if (!targetUser && !currentUser) {
        return;
      }

      const isFirstPage = page === 1;
      const loading = isFirstPage ? setIsLoading : setIsLoadingMore;

      loading(true);
      setError(null);

      try {
        const keyToUse = isFirstPage ? undefined : lastKey;
        let response: UnifiedUserInteractionsResponse;

        if (targetUser) {
          // Fetch likes for specific user by username
          response = await interactionApi.getLikesByUsername(
            targetUser,
            limit,
            keyToUse
          );
        } else {
          // Fetch current user's likes
          response = await interactionApi.getLikes(limit, keyToUse);
        }

        if (response.data) {
          const { interactions, pagination } = response.data;

          if (reset || isFirstPage) {
            setLikes(interactions);
          } else {
            setLikes((prev) => [...prev, ...interactions]);
          }

          // Preload interaction statuses for better UX
          const targets = interactions.map((interaction) => ({
            targetType: interaction.targetType,
            targetId: interaction.targetId,
          }));

          if (targets.length > 0) {
            preloadStatuses(targets).catch(console.error);
          }

          setTotalCount(interactions.length); // In cursor pagination, we don't have total count
          setHasMore(pagination.hasNext);
          setLastKey(pagination.cursor || undefined);
        }
        setCurrentPage(page);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch likes";
        setError(errorMessage);
      } finally {
        loading(false);
      }
    },
    [targetUser, currentUser, lastKey, preloadStatuses, limit]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    await fetchLikes(currentPage + 1, false);
  }, [hasMore, isLoadingMore, currentPage, fetchLikes]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
    setLastKey(undefined);
    await fetchLikes(1, true);
  }, [fetchLikes]);

  // Initial load
  useEffect(() => {
    console.log(
      "[useLikes] Effect triggered - initialLikes.length:",
      initialLikes.length
    );
    // Only fetch if we don't have initial data
    if (initialLikes.length === 0 && initialLoad) {
      fetchLikes();
    }
  }, [initialLikes.length, initialLoad, fetchLikes]);

  // Reset when user changes (only for authenticated user views)
  useEffect(() => {
    if (!targetUser && !currentUser) {
      setLikes([]);
      setTotalCount(0);
      setHasMore(false);
      setCurrentPage(1);
      setLastKey(undefined);
    }
  }, [targetUser, currentUser]);

  return {
    likes,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    fetchLikes: () => fetchLikes(),
    loadMore,
    refresh,
    error,
    clearError,
  };
};
