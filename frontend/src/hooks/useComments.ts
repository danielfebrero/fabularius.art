"use client";

import { useState, useEffect, useCallback } from "react";

export interface Comment {
  id: string;
  content: string;
  contentTitle: string;
  targetType: "media" | "album";
  targetId: string;
  timestamp: string;
  createdAt: string;
}

export interface UseCommentsReturn {
  // Data
  comments: Comment[];
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
        // Mock API call - in real implementation, this would be:
        // const response = await commentsApi.getUserComments(username, page, 20);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock comments data - this would come from the API
        const mockComments: Comment[] = [
          {
            id: "comment1",
            content:
              "Amazing composition and lighting! The way you captured the golden hour is absolutely stunning. This reminds me of my favorite photography spots.",
            contentTitle: "Sunset Beach Photography",
            targetType: "media",
            targetId: "media1",
            timestamp: "2 hours ago",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "comment2",
            content:
              "Love the colors in this series. Each photo tells a different story while maintaining a cohesive aesthetic.",
            contentTitle: "Abstract Art Collection",
            targetType: "album",
            targetId: "album2",
            timestamp: "5 hours ago",
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "comment3",
            content:
              "Great perspective on urban life. The contrast between old and new architecture is beautifully captured.",
            contentTitle: "City Streets",
            targetType: "media",
            targetId: "media3",
            timestamp: "1 day ago",
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "comment4",
            content:
              "This collection speaks to me on so many levels. Thank you for sharing your vision with us!",
            contentTitle: "Nature's Symphony",
            targetType: "album",
            targetId: "album4",
            timestamp: "2 days ago",
            createdAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "comment5",
            content:
              "The detail in this macro shot is incredible. You can see every droplet of water on the petals.",
            contentTitle: "Morning Dew",
            targetType: "media",
            targetId: "media5",
            timestamp: "3 days ago",
            createdAt: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "comment6",
            content:
              "Your editing style has really evolved. The mood and atmosphere in these recent photos is exceptional.",
            contentTitle: "Moody Landscapes",
            targetType: "album",
            targetId: "album6",
            timestamp: "4 days ago",
            createdAt: new Date(
              Date.now() - 4 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "comment7",
            content:
              "Perfect timing on this street photography shot. The interaction between the subjects is pure poetry.",
            contentTitle: "Human Connections",
            targetType: "media",
            targetId: "media7",
            timestamp: "1 week ago",
            createdAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "comment8",
            content:
              "This series made me see my own city in a completely different light. Fantastic work!",
            contentTitle: "Urban Exploration",
            targetType: "album",
            targetId: "album8",
            timestamp: "1 week ago",
            createdAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ];

        // Simulate pagination
        const itemsPerPage = 20;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageComments = mockComments.slice(startIndex, endIndex);
        const hasNextPage = endIndex < mockComments.length;

        if (reset || isFirstPage) {
          setComments(pageComments);
        } else {
          setComments((prev) => [...prev, ...pageComments]);
        }

        setTotalCount(mockComments.length);
        setHasMore(hasNextPage);
        setCurrentPage(page);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch comments";
        setError(errorMessage);
      } finally {
        loading(false);
      }
    },
    [username]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    await fetchComments(currentPage + 1, false);
  }, [hasMore, isLoadingMore, currentPage, fetchComments]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
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
