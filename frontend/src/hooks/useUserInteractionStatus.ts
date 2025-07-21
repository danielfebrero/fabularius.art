"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
  ReactNode,
  useRef,
} from "react";
import { useUser } from "./useUser";
import { interactionApi } from "@/lib/api";

interface UserInteractionStatus {
  targetType: "album" | "media";
  targetId: string;
  userLiked: boolean;
  userBookmarked: boolean;
}

interface UserInteractionContextType {
  // Get status for a specific target
  getStatus: (
    targetType: "album" | "media",
    targetId: string
  ) => UserInteractionStatus | null;
  // Update status locally (for optimistic updates)
  updateStatus: (
    targetType: "album" | "media",
    targetId: string,
    updates: { userLiked?: boolean; userBookmarked?: boolean }
  ) => void;
  // Load status from API if not cached
  loadStatus: (
    targetType: "album" | "media",
    targetId: string
  ) => Promise<void>;
  // Clear all cached status (useful for logout)
  clearCache: () => void;
  // Bulk load status for multiple items
  preloadStatuses: (
    targets: Array<{ targetType: "album" | "media"; targetId: string }>
  ) => Promise<void>;
}

const UserInteractionContext = createContext<UserInteractionContextType | null>(
  null
);

export function UserInteractionProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [statusCache, setStatusCache] = useState<
    Map<string, UserInteractionStatus>
  >(new Map());
  const [loadingTargets, setLoadingTargets] = useState<Set<string>>(new Set());

  // Use refs to avoid recreating callbacks when state changes
  const statusCacheRef = useRef(statusCache);
  const loadingTargetsRef = useRef(loadingTargets);

  // Update refs when state changes
  useEffect(() => {
    statusCacheRef.current = statusCache;
  }, [statusCache]);

  useEffect(() => {
    loadingTargetsRef.current = loadingTargets;
  }, [loadingTargets]);

  // Helper to generate cache key
  const getCacheKey = (targetType: "album" | "media", targetId: string) =>
    `${targetType}:${targetId}`;

  const getStatus = useCallback(
    (
      targetType: "album" | "media",
      targetId: string
    ): UserInteractionStatus | null => {
      if (!user) return null;
      const key = getCacheKey(targetType, targetId);
      return statusCache.get(key) || null;
    },
    [user, statusCache]
  );

  const updateStatus = useCallback(
    (
      targetType: "album" | "media",
      targetId: string,
      updates: { userLiked?: boolean; userBookmarked?: boolean }
    ) => {
      if (!user) return;

      const key = getCacheKey(targetType, targetId);
      setStatusCache((prev) => {
        const newCache = new Map(prev);
        const currentStatus = newCache.get(key);

        if (currentStatus) {
          newCache.set(key, {
            ...currentStatus,
            ...updates,
          });
        } else {
          newCache.set(key, {
            targetType,
            targetId,
            userLiked: updates.userLiked ?? false,
            userBookmarked: updates.userBookmarked ?? false,
          });
        }

        return newCache;
      });
    },
    [user]
  );

  const loadStatus = useCallback(
    async (targetType: "album" | "media", targetId: string) => {
      if (!user) return;

      const key = getCacheKey(targetType, targetId);

      // Don't load if already cached or currently loading
      if (statusCacheRef.current.has(key) || loadingTargetsRef.current.has(key))
        return;

      setLoadingTargets((prev) => new Set(prev).add(key));

      try {
        const response = await interactionApi.getInteractionStatus([
          { targetType, targetId },
        ]);
        if (response.data?.statuses?.[0]) {
          const statusData = response.data.statuses[0];
          const status: UserInteractionStatus = {
            targetType,
            targetId,
            userLiked: statusData.userLiked,
            userBookmarked: statusData.userBookmarked,
          };

          setStatusCache((prev) => new Map(prev).set(key, status));
        }
      } catch (error) {
        console.error(`Failed to load interaction status for ${key}:`, error);
      } finally {
        setLoadingTargets((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    },
    [user]
  );

  const preloadStatuses = useCallback(
    async (
      targets: Array<{ targetType: "album" | "media"; targetId: string }>
    ) => {
      if (!user) return;

      // Filter out targets that are already cached or loading
      const uncachedTargets = targets.filter((target) => {
        const key = getCacheKey(target.targetType, target.targetId);
        return (
          !statusCacheRef.current.has(key) &&
          !loadingTargetsRef.current.has(key)
        );
      });

      if (uncachedTargets.length === 0) return;

      // Mark as loading
      const newLoadingKeys = uncachedTargets.map((t) =>
        getCacheKey(t.targetType, t.targetId)
      );
      setLoadingTargets((prev) => {
        const newSet = new Set(prev);
        newLoadingKeys.forEach((key) => newSet.add(key));
        return newSet;
      });

      try {
        // Load statuses in batches using the new bulk API
        const batchSize = 50; // New API can handle up to 50 targets
        const batches = [];
        for (let i = 0; i < uncachedTargets.length; i += batchSize) {
          batches.push(uncachedTargets.slice(i, i + batchSize));
        }

        for (const batch of batches) {
          try {
            const response = await interactionApi.getInteractionStatus(batch);
            if (response.data?.statuses) {
              // Update cache with all statuses from the batch
              for (const statusData of response.data.statuses) {
                const status: UserInteractionStatus = {
                  targetType: statusData.targetType,
                  targetId: statusData.targetId,
                  userLiked: statusData.userLiked,
                  userBookmarked: statusData.userBookmarked,
                };

                setStatusCache((prev) =>
                  new Map(prev).set(
                    getCacheKey(statusData.targetType, statusData.targetId),
                    status
                  )
                );
              }
            }
          } catch (error) {
            console.error(`Failed to preload status batch:`, error);
          }
        }
      } finally {
        // Remove from loading set
        setLoadingTargets((prev) => {
          const newSet = new Set(prev);
          newLoadingKeys.forEach((key) => newSet.delete(key));
          return newSet;
        });
      }
    },
    [user]
  );

  const clearCache = useCallback(() => {
    setStatusCache(new Map());
    setLoadingTargets(new Set());
  }, []);

  // Clear cache when user changes
  useEffect(() => {
    if (!user) {
      setStatusCache(new Map());
      setLoadingTargets(new Set());
    }
  }, [user]);

  const contextValue: UserInteractionContextType = {
    getStatus,
    updateStatus,
    loadStatus,
    clearCache,
    preloadStatuses,
  };

  return React.createElement(
    UserInteractionContext.Provider,
    { value: contextValue },
    children
  );
}

export function useUserInteractionStatus() {
  const context = useContext(UserInteractionContext);
  if (!context) {
    throw new Error(
      "useUserInteractionStatus must be used within a UserInteractionProvider"
    );
  }
  return context;
}

// Hook for getting a specific target's status
export function useTargetInteractionStatus(
  targetType: "album" | "media",
  targetId: string
) {
  const { getStatus, loadStatus, updateStatus } = useUserInteractionStatus();
  const [isLoading, setIsLoading] = useState(false);

  const status = getStatus(targetType, targetId);

  // Auto-load status on mount if not cached
  useEffect(() => {
    if (!status) {
      setIsLoading(true);
      loadStatus(targetType, targetId).finally(() => setIsLoading(false));
    }
  }, [targetType, targetId, status, loadStatus]);

  const updateStatusOptimistically = useCallback(
    (updates: { userLiked?: boolean; userBookmarked?: boolean }) => {
      updateStatus(targetType, targetId, updates);
    },
    [updateStatus, targetType, targetId]
  );

  return {
    userLiked: status?.userLiked ?? false,
    userBookmarked: status?.userBookmarked ?? false,
    isLoading: isLoading && !status,
    updateStatusOptimistically,
  };
}
