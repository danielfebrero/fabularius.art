import { useState, useEffect } from "react";
import { interactionApi } from "@/lib/api";
import { UserInteractionStatsResponse } from "@/types/user";

export interface UserInsights {
  totalLikesReceived: number;
  totalBookmarksReceived: number;
}

export const useInsights = () => {
  const [insights, setInsights] = useState<UserInsights>({
    totalLikesReceived: 0,
    totalBookmarksReceived: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response: UserInteractionStatsResponse =
        await interactionApi.getInsights();

      if (response.success && response.data) {
        setInsights({
          totalLikesReceived: response.data.totalLikesReceived,
          totalBookmarksReceived: response.data.totalBookmarksReceived,
        });
      } else {
        throw new Error(response.error || "Failed to fetch insights");
      }
    } catch (err) {
      console.error("Error fetching user insights:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return {
    insights,
    isLoading,
    error,
    refetch: fetchInsights,
  };
};
