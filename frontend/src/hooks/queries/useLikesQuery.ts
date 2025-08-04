import { useInfiniteQuery } from "@tanstack/react-query";
import { interactionApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";

// Types
interface LikesQueryParams {
  targetUser?: string;
  limit?: number;
}

// Hook for fetching user's likes with infinite scroll
export function useLikesQuery(params: LikesQueryParams = {}) {
  const { targetUser, limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: queryKeys.user.interactions.likes(params),
    queryFn: async ({ pageParam }) => {
      const page = pageParam || 1;
      if (targetUser) {
        return await interactionApi.getLikesByUsername(targetUser, page, limit);
      } else {
        return await interactionApi.getLikes(page, limit);
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage.data?.pagination?.hasNext) return undefined;
      return (lastPage.data.pagination.page || 1) + 1;
    },
    enabled: !targetUser || !!targetUser, // Always enabled for own likes, enabled only if targetUser provided for others
    // Keep likes fresh for 1 minute
    staleTime: 60 * 1000,
    // Enable background refetching for likes
    refetchOnWindowFocus: true,
  });
}
