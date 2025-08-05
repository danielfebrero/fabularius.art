import { useQuery, useQueries } from "@tanstack/react-query";
import { contentApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";

// Types
interface ViewCountTarget {
  targetType: "album" | "media";
  targetId: string;
}

interface ViewCountResponse {
  data: {
    viewCounts: Array<{
      targetType: "album" | "media";
      targetId: string;
      viewCount: number;
    }>;
  };
}

// Hook for fetching view counts for multiple targets (bulk fetch)
export function useViewCounts(
  targets: ViewCountTarget[],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useQuery<ViewCountResponse>({
    queryKey: queryKeys.content.viewCounts(targets),
    queryFn: async () => {
      if (targets.length === 0) {
        return { data: { viewCounts: [] } };
      }

      return await contentApi.getViewCounts(targets);
    },
    enabled: enabled && targets.length > 0,
    // Keep view counts fresh for 5 minutes (they don't change as frequently as interactions)
    staleTime: 5 * 60 * 1000,
    // Don't refetch on window focus (not critical for UX and data doesn't change frequently)
    refetchOnWindowFocus: false,
  });
}

// Hook for reading view counts from cache only (for components that don't want to trigger fetches)
export function useViewCountsFromCache(targets: ViewCountTarget[]) {
  return useViewCounts(targets, { enabled: false });
}

// Hook for fetching view count for a single target
export function useViewCount(
  targetType: "album" | "media",
  targetId: string,
  options: { enabled?: boolean } = {}
) {
  const targets = [{ targetType, targetId }];
  const { data, ...rest } = useViewCounts(targets, options);

  const viewCount = data?.data?.viewCounts?.[0]?.viewCount ?? 0;

  return {
    data: viewCount,
    ...rest,
  };
}

// Hook for bulk fetching view counts for components with many items
// Automatically batches targets into reasonable chunks to avoid API limits
export function useBulkViewCounts(
  targets: ViewCountTarget[],
  options: { enabled?: boolean; chunkSize?: number } = {}
) {
  const { enabled = true, chunkSize = 50 } = options;

  // Split targets into chunks to avoid API limits
  const chunks = [];
  for (let i = 0; i < targets.length; i += chunkSize) {
    chunks.push(targets.slice(i, i + chunkSize));
  }

  // Use useQueries to fetch each chunk in parallel
  const queries = useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: queryKeys.content.viewCounts(chunk),
      queryFn: async () => {
        if (chunk.length === 0) {
          return { data: { viewCounts: [] } };
        }
        return await contentApi.getViewCounts(chunk);
      },
      enabled: enabled && chunk.length > 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  // Combine results from all chunks
  const isLoading = queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);
  const error = queries.find((query) => query.error)?.error;

  const viewCounts = queries
    .filter((query) => query.data)
    .flatMap((query) => query.data!.data.viewCounts);

  // Create a map for easy lookup
  const viewCountMap = new Map<string, number>();
  viewCounts.forEach((item) => {
    const key = `${item.targetType}:${item.targetId}`;
    viewCountMap.set(key, item.viewCount);
  });

  return {
    viewCounts,
    viewCountMap,
    isLoading,
    isError,
    error,
    // Helper function to get view count for a specific target
    getViewCount: (targetType: "album" | "media", targetId: string) => {
      const key = `${targetType}:${targetId}`;
      return viewCountMap.get(key) ?? 0;
    },
  };
}
