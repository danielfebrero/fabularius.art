import { useInfiniteQuery } from "@tanstack/react-query";
import { interactionApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import { UnifiedCommentsResponse } from "@/types/user";

// Types
interface CommentsQueryParams {
  username: string;
  limit?: number;
}

// Use the new unified response type
type CommentsResponse = UnifiedCommentsResponse;

// Hook for fetching user's comments with infinite scroll
export function useCommentsQuery(params: CommentsQueryParams) {
  const { username, limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: queryKeys.user.interactions.comments({ username, limit }),
    queryFn: async ({ pageParam }): Promise<CommentsResponse> => {
      return await interactionApi.getCommentsByUsername(
        username,
        limit,
        pageParam
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: CommentsResponse) => {
      return lastPage.data.pagination.hasNext
        ? lastPage.data.pagination.cursor
        : undefined;
    },
    enabled: !!username,
    // Keep comments fresh for 1 minute
    staleTime: 60 * 1000,
    // Enable background refetching for comments
    refetchOnWindowFocus: true,
  });
}
