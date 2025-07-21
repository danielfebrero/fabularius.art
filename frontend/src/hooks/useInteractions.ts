"use client";

import { useState, useCallback } from "react";
import { interactionApi } from "@/lib/api";
import {
  InteractionRequest,
} from "@/types/user";
import { useUser } from "./useUser";
import { useUserInteractionStatus } from "./useUserInteractionStatus";

export interface UseInteractionsReturn {
  // Loading states
  isToggling: boolean;

  // Actions
  toggleLike: (
    targetType: "album" | "media",
    targetId: string,
    albumId?: string,
    currentlyLiked?: boolean
  ) => Promise<void>;
  toggleBookmark: (
    targetType: "album" | "media",
    targetId: string,
    albumId?: string,
    currentlyBookmarked?: boolean
  ) => Promise<void>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useInteractions = (): UseInteractionsReturn => {
  const { user } = useUser();
  const { updateStatus } = useUserInteractionStatus();
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const toggleLike = useCallback(
    async (
      targetType: "album" | "media",
      targetId: string,
      albumId?: string,
      currentlyLiked?: boolean
    ) => {
      if (!user) {
        setError("You must be logged in to like content");
        return;
      }

      // Validate albumId for media interactions
      if (targetType === "media" && !albumId) {
        setError("Album ID is required for media interactions");
        return;
      }

      setIsToggling(true);
      setError(null);

      try {
        const request: InteractionRequest = {
          action: currentlyLiked ? "remove" : "add",
          targetType,
          targetId,
        };

        // Add albumId for media interactions
        if (targetType === "media" && albumId) {
          request.albumId = albumId;
        }

        await interactionApi.like(request);

        // Update the status cache to reflect the change
        updateStatus(targetType, targetId, { userLiked: !currentlyLiked });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to toggle like";
        setError(errorMessage);
        throw err;
      } finally {
        setIsToggling(false);
      }
    },
    [user, updateStatus]
  );

  const toggleBookmark = useCallback(
    async (
      targetType: "album" | "media",
      targetId: string,
      albumId?: string,
      currentlyBookmarked?: boolean
    ) => {
      if (!user) {
        setError("You must be logged in to bookmark content");
        return;
      }

      // Validate albumId for media interactions
      if (targetType === "media" && !albumId) {
        setError("Album ID is required for media interactions");
        return;
      }

      setIsToggling(true);
      setError(null);

      try {
        const request: InteractionRequest = {
          action: currentlyBookmarked ? "remove" : "add",
          targetType,
          targetId,
        };

        // Add albumId for media interactions
        if (targetType === "media" && albumId) {
          request.albumId = albumId;
        }

        await interactionApi.bookmark(request);

        // Update the status cache to reflect the change
        updateStatus(targetType, targetId, {
          userBookmarked: !currentlyBookmarked,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to toggle bookmark";
        setError(errorMessage);
        throw err;
      } finally {
        setIsToggling(false);
      }
    },
    [user, updateStatus]
  );

  return {
    isToggling,
    toggleLike,
    toggleBookmark,
    error,
    clearError,
  };
};
