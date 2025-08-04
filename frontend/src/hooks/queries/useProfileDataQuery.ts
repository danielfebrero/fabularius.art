import { useQuery } from "@tanstack/react-query";
import { interactionApi } from "@/lib/api";
import { UserInteractionsResponse } from "@/types/user";

// Types
interface UseProfileDataOptions {
  username?: string;
  isOwner?: boolean;
  limit?: number;
}

interface ProfileData {
  recentLikes: any[];
}

// Hook for fetching profile data including recent likes and statistics
export function useProfileDataQuery(options: UseProfileDataOptions) {
  const { username, isOwner = false, limit = 3 } = options;

  return useQuery({
    queryKey: ["profile", "data", { username, isOwner, limit }],
    queryFn: async (): Promise<ProfileData> => {
      if (!username && !isOwner) {
        return { recentLikes: [] };
      }

      let response: UserInteractionsResponse;

      if (username) {
        // Fetch likes for specific user by username
        response = await interactionApi.getLikesByUsername(username, 1, limit);
      } else {
        // Fetch current user's likes (for owner view)
        response = await interactionApi.getLikes(1, limit);
      }

      if (response.success && response.data) {
        return {
          recentLikes: response.data.interactions || [],
        };
      } else {
        throw new Error(response.error || "Failed to fetch profile data");
      }
    },
    enabled: !!(username || isOwner),
    // Keep profile data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Enable background refetching for profile data
    refetchOnWindowFocus: true,
    // Retry failed requests
    retry: 2,
  });
}
