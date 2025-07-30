"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Comment, CreateCommentRequest } from "@/types";
import { CommentItem } from "@/components/ui/Comment";
import { Button } from "@/components/ui/Button";
import { interactionApi } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [newComment, setNewComment] = useState("");
  const [hasFetchedAdditional, setHasFetchedAdditional] = useState(false);

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
        const existingIds = new Set(comments.map(c => c.id));
        const uniqueNewComments = newComments.filter(c => !existingIds.has(c.id));
        
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
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await interactionApi.deleteComment(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  // Like comment (placeholder - not implemented in backend yet)
  const handleLikeComment = async (commentId: string) => {
    // TODO: Implement comment liking when backend supports it
    console.log("Like comment:", commentId);
  };

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
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              className="w-full p-3 pr-12 text-sm border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
              maxLength={1000}
              rows={3}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              size="sm"
              className="absolute bottom-2 right-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press Cmd+Enter to submit</span>
            <span>{newComment.length}/1000</span>
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
          {comments.map((comment, index) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onLike={handleLikeComment}
              className={cn(
                index < comments.length - 1 && "border-b border-border/20 pb-4"
              )}
            />
          ))}

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
    </div>
  );
}
