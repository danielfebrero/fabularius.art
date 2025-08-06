"use client";

import React, { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { Media } from "../types/index";
import { ContentCard } from "./ui/ContentCard";
import { Lightbox } from "./ui/Lightbox";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import { useAlbumMedia } from "@/hooks/queries/useMediaQuery";
import { usePrefetchInteractionStatus } from "@/hooks/queries/useInteractionsQuery";
import {
  ComponentErrorBoundary,
  LightboxErrorBoundary,
} from "./ErrorBoundaries";
import { useRemoveMediaFromAlbum } from "@/hooks/queries/useMediaQuery";
import { useBulkViewCounts } from "@/hooks/queries/useViewCountsQuery";

interface MediaGalleryProps {
  albumId: string;
  className?: string;
  canRemoveFromAlbum?: boolean; // New prop to control removal from album
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  albumId,
  className,
  canRemoveFromAlbum,
}) => {
  // Use TanStack Query to fetch album media with caching and optimistic updates
  const {
    data: mediaData,
    isLoading,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAlbumMedia({ albumId, limit: 20 });

  // Extract all media from paginated data
  const allMedia = useMemo(() => {
    return mediaData?.pages.flatMap((page) => page.data.media || []) || [];
  }, [mediaData]);

  // Local state for UI interactions
  const [error, setError] = useState<string | null>(
    queryError?.message || null
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const removeFromAlbumMutation = useRemoveMediaFromAlbum();

  // Hook for manual prefetching (for interaction status)
  const { prefetch } = usePrefetchInteractionStatus();

  // Memoize all media targets for prefetching
  const allMediaTargets = useMemo(
    () =>
      allMedia.map((mediaItem) => ({
        targetType: "media" as const,
        targetId: mediaItem.id,
      })),
    [allMedia]
  );

  // Bulk prefetch view counts for the album and all media
  const viewCountTargets = useMemo(() => {
    const targets: Array<{ targetType: "album" | "media"; targetId: string }> =
      [{ targetType: "album", targetId: albumId }];

    // Add media targets
    allMedia.forEach((media) => {
      targets.push({ targetType: "media", targetId: media.id });
    });

    return targets;
  }, [albumId, allMedia]);

  // Prefetch view counts in the background
  useBulkViewCounts(viewCountTargets, { enabled: viewCountTargets.length > 0 });

  // Auto-prefetch interaction status for all loaded media
  useLayoutEffect(() => {
    if (allMediaTargets.length > 0) {
      prefetch(allMediaTargets).catch((error) => {
        console.error("Failed to prefetch media interaction status:", error);
      });
    }
  }, [allMediaTargets, prefetch]);

  // Update local error state when query error changes
  useEffect(() => {
    if (queryError?.message) {
      setError(queryError.message);
    } else {
      setError(null);
    }
  }, [queryError]);

  const handleLoadMore = async () => {
    if (!hasNextPage || isFetchingNextPage) return;

    setError(null);
    try {
      await fetchNextPage();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more media"
      );
    }
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const handleLightboxNext = () => {
    if (currentMediaIndex < allMedia.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handleLightboxPrevious = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  if (allMedia.length === 0 && !isLoading) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 mx-auto text-muted-foreground mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No media found
          </h3>
          <p className="text-muted-foreground">
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            This album doesn't contain any media files yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allMedia.map((mediaItem, index) => {
            return (
              <ComponentErrorBoundary
                key={mediaItem.id}
                context={`Media Card (${mediaItem.id})`}
              >
                <ContentCard
                  key={mediaItem.id}
                  item={mediaItem}
                  type="media"
                  aspectRatio="square"
                  canLike={true}
                  canBookmark={true}
                  canFullscreen={true}
                  canAddToAlbum={true}
                  canDownload={true}
                  canDelete={false}
                  mediaList={allMedia}
                  currentIndex={index}
                  canRemoveFromAlbum={canRemoveFromAlbum}
                  currentAlbumId={albumId}
                  // onRemoveFromAlbum={() => onRemoveMedia(mediaItem.id)}
                />
              </ComponentErrorBoundary>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <svg
                className="w-4 h-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Loading more media...</span>
            </div>
          </div>
        )}

        {error && <div className="text-center py-4 text-red-500">{error}</div>}

        {hasNextPage && !isFetchingNextPage && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              className="px-8"
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading..." : "Load More Media"}
            </Button>
          </div>
        )}
      </div>

      <LightboxErrorBoundary>
        <Lightbox
          media={allMedia}
          currentIndex={currentMediaIndex}
          isOpen={lightboxOpen}
          onClose={handleLightboxClose}
          onNext={handleLightboxNext}
          onPrevious={handleLightboxPrevious}
        />
      </LightboxErrorBoundary>
    </>
  );
};
