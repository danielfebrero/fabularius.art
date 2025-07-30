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

  // Initialize like states for comments (only for comments with likes > 0)
  const initializeCommentLikes = useCallback(
    async (comments: Comment[]) => {
      if (!user) return;

      // Only process comments that have likes
      const commentsWithLikes = comments.filter((c) => (c.likeCount || 0) > 0);
      if (commentsWithLikes.length === 0) return;

      try {
        setLoading(true);

        // Get user's like status for these comments
        const commentIds = commentsWithLikes.map((c) => c.id);
        const response = await interactionApi.getCommentLikeStatus(commentIds);

        if (response.success && response.data) {
          const initialStates: Record<string, CommentLikeState> = {};

          // Initialize states based on API response
          response.data.statuses.forEach(
            (status: { commentId: string; isLiked: boolean }) => {
              const comment = commentsWithLikes.find(
                (c) => c.id === status.commentId
              );
              if (comment) {
                initialStates[status.commentId] = {
                  isLiked: status.isLiked,
                  likeCount: comment.likeCount || 0,
                  hasBeenChecked: true,
                };
              }
            }
          );

          setCommentLikes((prev) => ({
            ...prev,
            ...initialStates,
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

        // Fallback: initialize with basic state (not liked)
        const fallbackStates: Record<string, CommentLikeState> = {};
        commentsWithLikes.forEach((comment) => {
          fallbackStates[comment.id] = {
            isLiked: false,
            likeCount: comment.likeCount || 0,
            hasBeenChecked: false,
          };
        });

        setCommentLikes((prev) => ({
          ...prev,
          ...fallbackStates,
        }));
      } finally {
        setLoading(false);
      }
    },
    [user]
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

        // Optimistic update
        setCommentLikes((prev) => ({
          ...prev,
          [commentId]: {
            isLiked: !currentlyLiked,
            likeCount: currentlyLiked
              ? Math.max(0, currentLikeCount - 1)
              : currentLikeCount + 1,
          },
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
      return commentLikes[commentId] || { isLiked: false, likeCount: 0 };
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
