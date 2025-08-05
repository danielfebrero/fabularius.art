"use client";

import { useViewCountsFromCache } from "@/hooks/queries/useViewCountsQuery";

interface ViewCountProps {
  targetType: "album" | "media";
  targetId: string;
  fallbackCount?: number;
  className?: string;
}

export function ViewCount({
  targetType,
  targetId,
  fallbackCount = 0,
  className = "",
}: ViewCountProps) {
  // Try to get view count from cache first (should be prefetched by page)
  const targets = [{ targetType, targetId }];
  const { data } = useViewCountsFromCache(targets);

  // Extract the count from the cached data
  const cachedCount = data?.data?.viewCounts?.[0]?.viewCount;
  const displayCount = cachedCount !== undefined ? cachedCount : fallbackCount;

  return <span className={className}>{displayCount}</span>;
}
