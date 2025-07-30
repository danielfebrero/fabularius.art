"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Comment, CreateCommentRequest } from "@/types";
import { CommentItem } from "@/components/ui/Comment";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { interactionApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useCommentInteractions } from "@/hooks/useCommentInteractions";

interface CommentsProps {
  targetType: "album" | "media";
  targetId: string;
  initialComments?: Comment[]; // Comments already loaded from Media/Album object
  currentUserId?: string;
  className?: string;
}

export function Comments({
  targetType,
  targetId,
  initialComments = [],
  currentUserId,
  className,
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [loading] = useState(false); // Not used in this implementation as loading is handled by parent
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [newComment, setNewComment] = useState("");
  const [hasFetchedAdditional, setHasFetchedAdditional] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    commentId?: string;
  }>({
    isOpen: false,
  });
  const isMobile = useIsMobile();

  // Comment interaction hooks
  const {
    toggleCommentLike,
    getCommentLikeState,
    initializeCommentLikes,
    isToggling,
    error: likeError,
    clearError: clearLikeError,
  } = useCommentInteractions();

  const [initializedComments, setInitializedComments] = useState<Set<string>>(
    new Set()
  );

  // Initialize comment like states when comments change
  useEffect(() => {
    if (comments.length > 0 && currentUserId) {
      // Only initialize comments we haven't initialized yet
      const newComments = comments.filter(
        (comment) => !initializedComments.has(comment.id)
      );

      if (newComments.length > 0) {
        console.log(
          `[Comments] Initializing ${newComments.length} new comments`
        );
        initializeCommentLikes(newComments);

        // Track that we've initialized these comments
        setInitializedComments((prev) => {
          const newSet = new Set(prev);
          newComments.forEach((comment) => newSet.add(comment.id));
          return newSet;
        });
      }
    }
  }, [comments, currentUserId, initializeCommentLikes, initializedComments]);

  // Load additional comments (beyond initial ones)
  const loadMoreComments = useCallback(async () => {
    try {
      setLoadingMore(true);
      setError(null);

      const response = await interactionApi.getComments(
        targetType,
        targetId,
        20,
        cursor
      );

      if (response.success && response.data) {
        const newComments = response.data.comments;

        // Filter out comments we already have to avoid duplicates
        const existingIds = new Set(comments.map((c) => c.id));
        const uniqueNewComments = newComments.filter(
          (c) => !existingIds.has(c.id)
        );

        setComments((prev) => [...prev, ...uniqueNewComments]);
        setHasMore(!!response.data.pagination.hasNext);
        setCursor(response.data.pagination.cursor);
        setHasFetchedAdditional(true);
      } else {
        throw new Error(response.error || "Failed to load comments");
      }
    } catch (err) {
      console.error("Error loading comments:", err);
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setLoadingMore(false);
    }
  }, [targetType, targetId, cursor, comments]);

  // Check if there are more comments to load on first render
  useEffect(() => {
    if (!hasFetchedAdditional && initialComments.length > 0) {
      // If we have initial comments, assume there might be more
      // We'll know for sure after the first API call
      setHasMore(true);
    }
  }, [initialComments.length, hasFetchedAdditional]);

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    try {
      setSubmitting(true);
      setError(null);

      const request: CreateCommentRequest = {
        content: newComment.trim(),
        targetType,
        targetId,
      };

      const response = await interactionApi.createComment(request);

      if (response.success && response.data) {
        // Add new comment to the top of the list
        setComments((prev) => [response.data!, ...prev]);
        setNewComment("");
      } else {
        throw new Error(response.error || "Failed to create comment");
      }
    } catch (err) {
      console.error("Error creating comment:", err);
      setError(err instanceof Error ? err.message : "Failed to create comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const response = await interactionApi.updateComment(commentId, {
        content,
      });

      if (response.success && response.data) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId ? response.data! : comment
          )
        );
      } else {
        throw new Error(response.error || "Failed to update comment");
      }
    } catch (err) {
      console.error("Error updating comment:", err);
      setError(err instanceof Error ? err.message : "Failed to update comment");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    setDeleteConfirm({
      isOpen: true,
      commentId,
    });
  };

  // Confirm delete comment
  const handleConfirmDelete = async () => {
    const commentId = deleteConfirm.commentId;
    if (!commentId) return;

    try {
      await interactionApi.deleteComment(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setDeleteConfirm({ isOpen: false });
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError(err instanceof Error ? err.message : "Failed to delete comment");
      setDeleteConfirm({ isOpen: false });
    }
  };

  // Like comment
  const handleLikeComment = useCallback(
    async (commentId: string) => {
      if (!currentUserId) {
        setError("You must be logged in to like comments");
        return;
      }

      try {
        // Find the comment to get current state
        const comment = comments.find((c) => c.id === commentId);
        if (!comment) return;

        const currentLikeCount = comment.likeCount || 0;
        const currentIsLiked = getCommentLikeState(commentId)?.isLiked || false;
        const newIsLiked = !currentIsLiked;
        const newLikeCount = newIsLiked
          ? currentLikeCount + 1
          : Math.max(0, currentLikeCount - 1);

        // Optimistically update the comment's like count in comments state
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, likeCount: newLikeCount } : c
          )
        );

        // The hook will handle its own optimistic update for the isLiked state
        await toggleCommentLike(commentId);
      } catch (err) {
        console.error("Error liking comment:", err);

        // Revert optimistic update on error - restore original like count
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
          const currentLikeCount = comment.likeCount || 0;
          const currentIsLiked =
            getCommentLikeState(commentId)?.isLiked || false;
          // Calculate what the original count should have been
          const originalLikeCount = currentIsLiked
            ? currentLikeCount - 1
            : currentLikeCount + 1;

          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? { ...c, likeCount: Math.max(0, originalLikeCount) }
                : c
            )
          );
        }

        // Error handling is done in the hook, just display it
        if (likeError) {
          setError(likeError);
        }
      }
    },
    [currentUserId, comments, toggleCommentLike, getCommentLikeState, likeError]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const canComment = !!currentUserId;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Comment form */}
      {canComment && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              className="flex-1 p-3 text-sm border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px] max-h-[120px]"
              maxLength={1000}
              rows={1}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              size="sm"
              className="h-[44px] px-3"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {!isMobile && <span>Press Cmd+Enter to submit</span>}
            <span className={cn(!isMobile && "ml-auto")}>
              {newComment.length}/1000
            </span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Comments list */}
      {loading && comments.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment, index) => {
            const commentLikeCount = comment.likeCount || 0;
            // Check like state if user is logged in (regardless of like count)
            // This handles the case where a comment goes from 0 to 1+ likes
            const likeState = currentUserId
              ? getCommentLikeState(comment.id)
              : null;

            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onLike={handleLikeComment}
                isLiked={likeState?.isLiked || false}
                likeCount={commentLikeCount}
                className={cn(
                  index < comments.length - 1 &&
                    "border-b border-border/20 pb-4"
                )}
              />
            );
          })}

          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                onClick={loadMoreComments}
                disabled={loadingMore}
                className="text-sm"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more comments"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {canComment
              ? "No comments yet. Be the first to comment!"
              : "No comments yet."}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
