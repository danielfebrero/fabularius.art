import { useQuery } from "@tanstack/react-query";
import { interactionApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import { UserInteractionStatsResponse } from "@/types/user";

// Types
export interface UserInsights {
  totalLikesReceived: number;
  totalBookmarksReceived: number;
}

// Hook for fetching user insights/analytics
export function useInsightsQuery() {
  return useQuery({
    queryKey: queryKeys.user.interactions.insights(),
    queryFn: async (): Promise<UserInsights> => {
      const response: UserInteractionStatsResponse =
        await interactionApi.getInsights();

      if (response.success && response.data) {
        return {
          totalLikesReceived: response.data.totalLikesReceived,
          totalBookmarksReceived: response.data.totalBookmarksReceived,
        };
      } else {
        throw new Error(response.error || "Failed to fetch insights");
      }
    },
    // Keep insights fresh for 5 minutes since they don't change frequently
    staleTime: 5 * 60 * 1000,
    // Enable background refetching for insights
    refetchOnWindowFocus: true,
    // Retry failed requests
    retry: 2,
  });
}
