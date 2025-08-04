import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interactionApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { CommentInteractionRequest } from "@/types/user";
import { CommentLikeStatusResponse } from "@/types";

// Types
interface CommentLikeState {
  isLiked: boolean;
  likeCount: number;
  hasBeenChecked?: boolean;
}

interface CommentLikeStates {
  [commentId: string]: CommentLikeState;
}

// Hook for fetching comment like states
export function useCommentInteractionsQuery(commentIds: string[]) {
  return useQuery({
    queryKey: ["comments", "interactions", commentIds],
    queryFn: async (): Promise<CommentLikeStates> => {
      if (commentIds.length === 0) return {};

      try {
        const response = await interactionApi.getCommentLikeStatus(commentIds);
        const states: CommentLikeStates = {};

        if (response.success && response.data?.statuses) {
          response.data.statuses.forEach(({ commentId, isLiked }) => {
            states[commentId] = {
              isLiked,
              likeCount: 0, // Note: API doesn't return like count in batch status call
              hasBeenChecked: true,
            };
          });
        }

        // For any comment IDs not in response, set default state
        commentIds.forEach((commentId) => {
          if (!states[commentId]) {
            states[commentId] = {
              isLiked: false,
              likeCount: 0,
              hasBeenChecked: true,
            };
          }
        });

        return states;
      } catch (error) {
        // If error, return default states for all comment IDs
        const states: CommentLikeStates = {};
        commentIds.forEach((commentId) => {
          states[commentId] = {
            isLiked: false,
            likeCount: 0,
            hasBeenChecked: true,
          };
        });
        return states;
      }
    },
    enabled: commentIds.length > 0,
    // Keep comment interactions fresh for 30 seconds
    staleTime: 30 * 1000,
    // Don't refetch on window focus for comment interactions
    refetchOnWindowFocus: false,
  });
}

// Hook for liking/unliking comments with optimistic updates
export function useToggleCommentLike() {
  return useMutation({
    mutationFn: async ({
      commentId,
      isCurrentlyLiked,
    }: {
      commentId: string;
      isCurrentlyLiked: boolean;
    }) => {
      const action = isCurrentlyLiked ? "remove" : "add";
      const request: CommentInteractionRequest = {
        targetType: "comment",
        targetId: commentId,
        action,
      };
      return await interactionApi.likeComment(request);
    },
    onMutate: async ({ commentId, isCurrentlyLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["comments", "interactions"],
      });

      // Snapshot the previous value
      const previousStates = queryClient.getQueriesData({
        queryKey: ["comments", "interactions"],
      });

      // Optimistically update the comment like state
      queryClient.setQueriesData(
        { queryKey: ["comments", "interactions"] },
        (old: any) => {
          if (!old || typeof old !== "object") return old;

          const newStates = { ...old };
          if (newStates[commentId]) {
            newStates[commentId] = {
              ...newStates[commentId],
              isLiked: !isCurrentlyLiked,
              likeCount: Math.max(
                0,
                newStates[commentId].likeCount + (isCurrentlyLiked ? -1 : 1)
              ),
            };
          }

          return newStates;
        }
      );

      // Return context for rollback
      return { previousStates, commentId, isCurrentlyLiked };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to undo the optimistic update
      if (context?.previousStates) {
        context.previousStates.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, variables) => {
      // Update the comment interaction state - since API doesn't return like count,
      // we keep the optimistic update values
      queryClient.setQueriesData(
        { queryKey: ["comments", "interactions"] },
        (old: any) => {
          if (!old || typeof old !== "object") return old;

          const newStates = { ...old };
          if (newStates[variables.commentId]) {
            // Keep the optimistic like count since API doesn't return it
            newStates[variables.commentId] = {
              ...newStates[variables.commentId],
              isLiked: !variables.isCurrentlyLiked, // Toggle the like state
            };
          }

          return newStates;
        }
      );
    },
    onSettled: () => {
      // Invalidate comment interaction queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ["comments", "interactions"],
      });
    },
  });
}

// Hook for initializing comment like states from comment data
export const useInitializeCommentLikes = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CommentLikeStatusResponse,
    Error,
    { commentIds: string[] }
  >({
    mutationFn: async ({ commentIds }) => {
      const response = await interactionApi.getCommentLikeStatus(commentIds);
      return response;
    },
    onSuccess: (response) => {
      if (response.success && response.data?.statuses) {
        queryClient.setQueriesData(
          { queryKey: ["comments", "interactions"] },
          (old: any) => {
            const newStates = { ...(old || {}) };

            // Process each status from the response
            response.data!.statuses.forEach((status) => {
              newStates[status.commentId] = {
                isLiked: status.isLiked,
                likeCount: 0, // API doesn't provide like count, using default
              };
            });

            return newStates;
          }
        );
      }
    },
    onError: (error) => {
      console.error("Failed to initialize comment likes:", error);
    },
  });
};
