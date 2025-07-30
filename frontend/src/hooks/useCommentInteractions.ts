"use client";

import { useState, useCallback } from "react";
import { interactionApi } from "@/lib/api";
import { useUser } from "./useUser";
import { Comment } from "@/types";

interface CommentLikeState {
  isLiked: boolean;
  likeCount: number;
  hasBeenChecked?: boolean;
}

interface CommentLikeStates {
  [commentId: string]: CommentLikeState;
}

export const useCommentInteractions = () => {
  const { user } = useUser();
  const [commentLikes, setCommentLikes] = useState<CommentLikeStates>({});
  const [loading, setLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize like states for comments (fetch user's like status for comments with likes > 0)
  const initializeCommentLikes = useCallback(
    async (comments: Comment[]) => {
      if (!user) return;

      console.log(
        `[initializeCommentLikes] Called with ${comments.length} comments`
      );

      // Only fetch like status for comments that have likes > 0 (optimization)
      const commentsWithLikes = comments.filter((c) => (c.likeCount || 0) > 0);

      // Initialize all comments with default state first
      // Only initialize comments that don't already have state to avoid overwriting existing states
      const newCommentStates: Record<string, CommentLikeState> = {};
      comments.forEach((comment) => {
        // Don't overwrite existing state
        if (!commentLikes[comment.id]) {
          newCommentStates[comment.id] = {
            isLiked: false,
            likeCount: comment.likeCount || 0,
            hasBeenChecked: (comment.likeCount || 0) === 0, // Comments with 0 likes are "checked" immediately
          };
          console.log(
            `[initializeCommentLikes] Adding new state for ${comment.id}:`,
            newCommentStates[comment.id]
          );
        } else {
          console.log(
            `[initializeCommentLikes] Skipping ${comment.id} - already has state:`,
            commentLikes[comment.id]
          );
        }
      });

      // Only update if we have new states to add
      if (Object.keys(newCommentStates).length > 0) {
        console.log(
          `[initializeCommentLikes] Setting ${
            Object.keys(newCommentStates).length
          } new comment states`
        );
        setCommentLikes((prev) => ({
          ...prev,
          ...newCommentStates,
        }));
      }

      // If no comments have likes, we're done
      if (commentsWithLikes.length === 0) {
        console.log(`[initializeCommentLikes] No comments with likes, done`);
        return;
      }

      try {
        setLoading(true);

        // Get user's like status for comments with likes
        const commentIds = commentsWithLikes.map((c) => c.id);
        console.log(
          `[initializeCommentLikes] Fetching like status for comments:`,
          commentIds
        );
        const response = await interactionApi.getCommentLikeStatus(commentIds);

        if (response.success && response.data) {
          const updatedStates: Record<string, CommentLikeState> = {};

          // Update states based on API response
          response.data.statuses.forEach(
            (status: { commentId: string; isLiked: boolean }) => {
              const comment = commentsWithLikes.find(
                (c) => c.id === status.commentId
              );
              if (comment) {
                updatedStates[status.commentId] = {
                  isLiked: status.isLiked,
                  likeCount: comment.likeCount || 0,
                  hasBeenChecked: true,
                };
                console.log(
                  `[initializeCommentLikes] API response for ${status.commentId}: isLiked=${status.isLiked}`
                );
              }
            }
          );

          setCommentLikes((prev) => ({
            ...prev,
            ...updatedStates,
          }));
        } else {
          throw new Error(
            response.error || "Failed to get comment like status"
          );
        }
      } catch (err) {
        console.error("Error initializing comment likes:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load comment like states"
        );
      } finally {
        setLoading(false);
      }
    },
    [user, commentLikes]
  );
  const toggleCommentLike = useCallback(
    async (commentId: string) => {
      if (!user) {
        setError("You must be logged in to like comments");
        return;
      }

      setIsToggling(true);
      setError(null);

      try {
        const currentState = commentLikes[commentId];
        const currentlyLiked = currentState?.isLiked || false;
        const currentLikeCount = currentState?.likeCount || 0;

        console.log(
          `[toggleCommentLike] Comment ${commentId}: currentlyLiked=${currentlyLiked}, currentLikeCount=${currentLikeCount}`
        );

        // Optimistic update - ensure we have state for this comment
        const newState = {
          isLiked: !currentlyLiked,
          likeCount: currentlyLiked
            ? Math.max(0, currentLikeCount - 1)
            : currentLikeCount + 1,
          hasBeenChecked: true,
        };

        console.log(
          `[toggleCommentLike] New state for ${commentId}:`,
          newState
        );

        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: newState,
        }));

        const request = {
          targetType: "comment" as const,
          targetId: commentId,
          action: (currentlyLiked ? "remove" : "add") as "add" | "remove",
        };

        await interactionApi.likeComment(request);

        console.log(
          `Comment ${currentlyLiked ? "unliked" : "liked"} successfully`
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to toggle comment like";
        setError(errorMessage);

        // Revert optimistic update on error
        const currentState = commentLikes[commentId];
        if (currentState) {
          setCommentLikes((prev) => ({
            ...prev,
            [commentId]: {
              isLiked: !currentState.isLiked, // Revert the toggle
              likeCount: currentState.isLiked
                ? currentState.likeCount + 1
                : Math.max(0, currentState.likeCount - 1),
              hasBeenChecked: true,
            },
          }));
        }

        throw err;
      } finally {
        setIsToggling(false);
      }
    },
    [user, commentLikes]
  );

  const getCommentLikeState = useCallback(
    (commentId: string) => {
      return (
        commentLikes[commentId] || {
          isLiked: false,
          likeCount: 0,
          hasBeenChecked: false,
        }
      );
    },
    [commentLikes]
  );

  const updateCommentLikeCount = useCallback(
    (commentId: string, newLikeCount: number) => {
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          likeCount: Math.max(0, newLikeCount),
          hasBeenChecked: true,
        },
      }));
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    commentLikes,
    isToggling,
    error,
    loading,
    toggleCommentLike,
    getCommentLikeState,
    updateCommentLikeCount,
    initializeCommentLikes,
    clearError,
  };
};
