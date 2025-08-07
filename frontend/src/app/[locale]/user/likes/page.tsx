"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Heart, Grid, List } from "lucide-react";
import { useLikesQuery } from "@/hooks/queries/useLikesQuery";
import { usePrefetchInteractionStatus } from "@/hooks/queries/useInteractionsQuery";
import { Button } from "@/components/ui/Button";
import { VirtualizedGrid } from "@/components/ui/VirtualizedGrid";
import { Lightbox } from "@/components/ui/Lightbox";

/**
 * UserLikesPage - Displays user's liked content with virtualization and infinite scroll
 *
 * Features implemented:
 * - ✅ Virtual scrolling using react-virtuoso via VirtualizedGrid
 * - ✅ Infinite scroll with TanStack Query's useInfiniteQuery
 * - ✅ Mixed content types (media + albums) with dynamic type resolution
 * - ✅ Performance optimizations with useMemo and useCallback
 * - ✅ Interaction status prefetching for better UX
 * - ✅ Lightbox support for media items
 * - ✅ Grid and list view modes
 * - ✅ Responsive design and loading states
 *
 * Technical details:
 * - Uses cursor-based pagination via useLikesQuery
 * - VirtualizedGrid handles large lists efficiently
 * - Dynamic type resolution via _contentType property
 * - Optimistic interaction updates
 */
const UserLikesPage: React.FC = () => {
  // Use TanStack Query hook for likes
  const {
    data: likesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLikesQuery();

  // Hook for bulk prefetching interaction status
  const { prefetch } = usePrefetchInteractionStatus();

  // Extract likes from infinite query data
  const allLikes = useMemo(() => {
    return (
      likesData?.pages.flatMap((page: any) => page.data?.interactions || []) ||
      []
    );
  }, [likesData]);

  // Filter out invalid likes before counting
  const likes = useMemo(() => {
    return allLikes.filter((like: any) => like && like.targetType);
  }, [allLikes]);

  // Prefetch interaction status for all liked items
  useEffect(() => {
    if (likes.length > 0) {
      const targets = likes.map((like: any) => ({
        targetType: like.targetType as "album" | "media",
        targetId: like.targetId,
      }));
      prefetch(targets).catch((error) => {
        console.error(
          "Failed to prefetch user likes interaction status:",
          error
        );
      });
    }
  }, [likes, prefetch]);

  const totalCount = likes.length;
  const hasMore = hasNextPage;
  const isLoadingMore = isFetchingNextPage;

  // Memoize load more function
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Memoize refresh function
  const refresh = useCallback(() => {
    // TanStack Query handles background refetching
  }, []);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Get media items for lightbox (only media type likes) - memoized for performance
  const mediaItems = useMemo(() => {
    return likes
      .filter((like: any) => like.targetType === "media")
      .map((like: any) => ({
        id: like.targetId,
        albumId: like.target?.albumId || like.albumId || "",
        filename: like.target?.title || "",
        originalFilename: like.target?.title || "",
        mimeType: like.target?.mimeType || "image/jpeg",
        size: like.target?.size || 0,
        url: like.target?.url || "",
        thumbnailUrl: like.target?.thumbnailUrls?.medium || "",
        thumbnailUrls: like.target?.thumbnailUrls,
        viewCount: like.target?.viewCount || 0,
        createdAt: like.createdAt,
        updatedAt: like.createdAt,
      }));
  }, [likes]);

  const handleLightboxClose = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handleLightboxNext = useCallback(() => {
    if (currentMediaIndex < mediaItems.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  }, [currentMediaIndex, mediaItems.length]);

  const handleLightboxPrevious = useCallback(() => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  }, [currentMediaIndex]);

  // Create media items for ContentCard from likes
  const createMediaFromLike = useCallback((like: any) => {
    if (like.targetType === "media") {
      return {
        id: like.targetId,
        albumId: like.target?.albumId || like.albumId || "",
        filename: like.target?.title || "",
        originalFilename: like.target?.title || "",
        mimeType: like.target?.mimeType || "image/jpeg",
        size: like.target?.size || 0,
        url: like.target?.url || "",
        thumbnailUrl: like.target?.thumbnailUrls?.medium || "",
        thumbnailUrls: like.target?.thumbnailUrls,
        viewCount: like.target?.viewCount || 0,
        createdAt: like.createdAt,
        updatedAt: like.createdAt,
      };
    }
    return null;
  }, []);

  // Create album items for ContentCard from likes
  const createAlbumFromLike = useCallback((like: any) => {
    if (like.targetType === "album") {
      return {
        id: like.targetId,
        title: like.target?.title || `Album ${like.targetId}`,
        description: "",
        coverImageUrl: like.target?.coverImageUrl || "",
        thumbnailUrls: like.target?.thumbnailUrls,
        mediaCount: like.target?.mediaCount || 0,
        tags: [],
        isPublic: like.target?.isPublic || false,
        viewCount: like.target?.viewCount || 0,
        createdAt: like.createdAt,
        updatedAt: like.createdAt,
      };
    }
    return null;
  }, []);

  // Extract likes and create consistent items for VirtualizedGrid with type information
  const allLikeItems = useMemo(() => {
    return likes
      .map((like: any) => {
        const media = createMediaFromLike(like);
        const album = createAlbumFromLike(like);
        const item = media || album;

        if (item) {
          // Add type information to help VirtualizedGrid determine the correct type
          return {
            ...item,
            _contentType: like.targetType === "media" ? "media" : "album", // Store type for dynamic rendering
          };
        }
        return null;
      })
      .filter((item: any): item is any => item !== null);
  }, [likes, createMediaFromLike, createAlbumFromLike]);
  if (error) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-8 text-center">
        <div className="text-red-500 mb-4">
          <Heart className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium text-foreground">
            Failed to load likes
          </p>
          <p className="text-sm text-muted-foreground mt-1">{error?.message}</p>
        </div>
        <Button onClick={refresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500/10 to-admin-secondary/10 rounded-xl border border-red-500/20 shadow-lg p-6">
          {/* Mobile Layout */}
          <div className="block sm:hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-admin-secondary rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Likes</h1>
                  <p className="text-sm text-muted-foreground">
                    Your liked content
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <span className="bg-red-500/20 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-full">
                {totalCount.toLocaleString()} likes
              </span>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-admin-secondary rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Likes</h1>
                <p className="text-muted-foreground">Your liked content</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-red-500/20 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-full">
                {totalCount.toLocaleString()} likes
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <VirtualizedGrid
          items={allLikeItems}
          itemType="media" // Mixed content - ContentCard will determine type from _itemType
          viewMode={viewMode}
          isLoading={isLoading}
          hasNextPage={hasMore}
          isFetchingNextPage={isLoadingMore}
          onLoadMore={loadMore}
          contentCardProps={{
            canLike: true,
            canBookmark: true,
            canFullscreen: true,
            canAddToAlbum: true,
            canDownload: true,
            canDelete: false,
            showTags: true,
            showCounts: true,
            preferredThumbnailSize: viewMode === "grid" ? "medium" : "large",
          }}
          mediaList={mediaItems}
          emptyState={{
            icon: (
              <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-red-500" />
              </div>
            ),
            title: "No likes yet",
            description:
              "Start exploring content and like what you enjoy! Discover amazing albums and media from our community.",
          }}
          loadingState={{
            loadingText: "Loading more likes...",
            noMoreText: "All your likes loaded",
            skeletonCount: 8,
          }}
          error={error ? String(error) : null}
          onRetry={refresh}
        />
      </div>

      {/* Lightbox for media items */}
      <Lightbox
        media={mediaItems}
        currentIndex={currentMediaIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
      />
    </>
  );
};

export default UserLikesPage;
