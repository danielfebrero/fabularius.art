import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { AdminStats } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

// Admin stats API function
const fetchAdminStats = async (): Promise<AdminStats> => {
  const response = await fetch(`${API_URL}/admin/stats`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error || "Failed to fetch statistics");
  }
};

// Hook for fetching admin statistics
export function useAdminStatsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: fetchAdminStats,
    // Keep admin stats fresh for 1 minute since they change frequently
    staleTime: 60 * 1000,
    // Enable background refetching for real-time stats
    refetchOnWindowFocus: true,
    // Refetch every 5 minutes for real-time dashboard
    refetchInterval: 5 * 60 * 1000,
    // Retry failed requests (important for admin dashboard)
    retry: 3,
    // Keep trying to fetch even if offline (will work when back online)
    retryOnMount: true,
  });
}
