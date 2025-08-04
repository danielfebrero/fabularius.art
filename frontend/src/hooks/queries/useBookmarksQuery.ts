import { useInfiniteQuery } from "@tanstack/react-query";
import { interactionApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import { UserInteraction } from "@/types/user";

// Types
interface BookmarksQueryParams {
  limit?: number;
}

interface BookmarksResponse {
  success: boolean;
  data?: {
    interactions: UserInteraction[];
    pagination: {
      page: number;
      limit: number;
      hasNext: boolean;
      total: number;
    };
  };
  error?: string;
}

// Hook for fetching user's bookmarks with infinite scroll
export function useBookmarksQuery(params: BookmarksQueryParams = {}) {
  const { limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: queryKeys.user.interactions.bookmarks(params),
    queryFn: async ({ pageParam }): Promise<BookmarksResponse> => {
      const page = pageParam || 1;
      return await interactionApi.getBookmarks(page, limit);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: BookmarksResponse) => {
      if (!lastPage.data?.pagination?.hasNext) return undefined;
      return (lastPage.data.pagination.page || 1) + 1;
    },
    // Keep bookmarks fresh for 1 minute
    staleTime: 60 * 1000,
    // Enable background refetching for bookmarks
    refetchOnWindowFocus: true,
  });
}
