"use client";

import { useState, useEffect, useCallback } from "react";
import { interactionApi } from "@/lib/api";
import { Comment } from "@/types";

interface CommentWithTarget extends Comment {
  target?: {
    title?: string;
    type?: "media" | "album";
  };
}

export interface UseCommentsReturn {
  // Data
  comments: CommentWithTarget[];
  totalCount: number;
  hasMore: boolean;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;

  // Actions
  fetchComments: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useComments = (
  username: string,
  initialLoad: boolean = true
): UseCommentsReturn => {
  const [comments, setComments] = useState<CommentWithTarget[]>([]);
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

  const fetchComments = useCallback(
    async (page: number = 1, reset: boolean = true) => {
      if (!username) {
        return;
      }

      const isFirstPage = page === 1;
      const loading = isFirstPage ? setIsLoading : setIsLoadingMore;

      loading(true);
      setError(null);

      try {
        const keyToUse = isFirstPage ? undefined : lastKey;
        const response = await interactionApi.getCommentsByUsername(
          username,
          page,
          20,
          keyToUse
        );

        if (response.success && response.data) {
          const { comments: newComments, pagination } = response.data;

          if (reset || isFirstPage) {
            setComments(newComments);
          } else {
            setComments((prev) => [...prev, ...newComments]);
          }

          setTotalCount(pagination.total);
          setHasMore(pagination.hasNext);

          if (pagination.nextKey) {
            setLastKey(pagination.nextKey);
          }

          setCurrentPage(page);

          console.log(
            `✅ Loaded ${newComments.length} comments for user ${username}`
          );
        } else {
          throw new Error(response.error || "Failed to fetch comments");
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch comments";
        setError(errorMessage);
      } finally {
        loading(false);
      }
    },
    [username, lastKey]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    await fetchComments(currentPage + 1, false);
  }, [hasMore, isLoadingMore, currentPage, fetchComments]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
    setLastKey(undefined);
    await fetchComments(1, true);
  }, [fetchComments]);

  // Initial load
  useEffect(() => {
    if (initialLoad && username) {
      fetchComments();
    }
  }, [username, initialLoad, fetchComments]);

  // Reset when username changes
  useEffect(() => {
    if (!username) {
      setComments([]);
      setTotalCount(0);
      setHasMore(false);
      setCurrentPage(1);
      setLastKey(undefined);
    }
  }, [username]);

  return {
    comments,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    fetchComments: () => fetchComments(),
    loadMore,
    refresh,
    error,
    clearError,
  };
};
