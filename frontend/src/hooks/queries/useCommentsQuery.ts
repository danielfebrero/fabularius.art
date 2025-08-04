import { useInfiniteQuery } from "@tanstack/react-query";
import { interactionApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";

// Types
interface CommentsQueryParams {
  username: string;
  limit?: number;
}

// Hook for fetching user's comments with infinite scroll
export function useCommentsQuery(params: CommentsQueryParams) {
  const { username, limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: queryKeys.user.interactions.comments({ username, limit }),
    queryFn: async ({ pageParam }) => {
      const page = pageParam || 1;
      return await interactionApi.getCommentsByUsername(username, page, limit);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage.data?.pagination?.hasNext) return undefined;
      return (lastPage.data.pagination.page || 1) + 1;
    },
    enabled: !!username,
    // Keep comments fresh for 1 minute
    staleTime: 60 * 1000,
    // Enable background refetching for comments
    refetchOnWindowFocus: true,
  });
}
