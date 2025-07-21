"use client";

import { useState, useEffect, useCallback } from "react";
import { interactionApi } from "@/lib/api";
import { UserInteractionsResponse, UserInteraction } from "@/types/user";
import { useUser } from "./useUser";
import { useUserInteractionStatus } from "./useUserInteractionStatus";

export interface UseBookmarksReturn {
  // Data
  bookmarks: UserInteraction[];
  totalCount: number;
  hasMore: boolean;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;

  // Actions
  fetchBookmarks: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useBookmarks = (
  initialLoad: boolean = true
): UseBookmarksReturn => {
  const { user } = useUser();
  const { preloadStatuses } = useUserInteractionStatus();
  const [bookmarks, setBookmarks] = useState<UserInteraction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastKey, setLastKey] = useState<string | undefined>();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchBookmarks = useCallback(
    async (page: number = 1, reset: boolean = true) => {
      if (!user) {
        return;
      }

      const isFirstPage = page === 1;
      const loading = isFirstPage ? setIsLoading : setIsLoadingMore;

      loading(true);
      setError(null);

      try {
        const keyToUse = isFirstPage ? undefined : lastKey;
        const response: UserInteractionsResponse =
          await interactionApi.getBookmarks(page, 20, keyToUse);

        if (response.data) {
          const { interactions, pagination } = response.data;

          if (reset || isFirstPage) {
            setBookmarks(interactions);
          } else {
            setBookmarks((prev) => [...prev, ...interactions]);
          }

          // Preload interaction statuses for better UX
          const targets = interactions.map((interaction) => ({
            targetType: interaction.targetType,
            targetId: interaction.targetId,
          }));

          if (targets.length > 0) {
            preloadStatuses(targets).catch(console.error);
          }

          setTotalCount(pagination.total);
          setHasMore(pagination.hasNext);
          setLastKey(pagination.nextKey);
        }
        setCurrentPage(page);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch bookmarks";
        setError(errorMessage);
      } finally {
        loading(false);
      }
    },
    [user, lastKey, preloadStatuses]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    await fetchBookmarks(currentPage + 1, false);
  }, [hasMore, isLoadingMore, currentPage, fetchBookmarks]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
    setLastKey(undefined);
    await fetchBookmarks(1, true);
  }, [fetchBookmarks]);

  // Initial load
  useEffect(() => {
    if (initialLoad && user) {
      fetchBookmarks();
    }
  }, [user, initialLoad, fetchBookmarks]);

  // Reset when user changes
  useEffect(() => {
    if (!user) {
      setBookmarks([]);
      setTotalCount(0);
      setHasMore(false);
      setCurrentPage(1);
      setLastKey(undefined);
    }
  }, [user]);

  return {
    bookmarks,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    fetchBookmarks: () => fetchBookmarks(),
    loadMore,
    refresh,
    error,
    clearError,
  };
};
