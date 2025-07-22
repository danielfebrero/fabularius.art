"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Media } from "../types/index";
import { ContentCard } from "./ui/ContentCard";
import { Lightbox } from "./ui/Lightbox";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import { getMediaForAlbum } from "../lib/data";
import { useUserInteractionStatus } from "../hooks/useUserInteractionStatus";

interface MediaGalleryProps {
  albumId: string;
  initialMedia: Media[];
  initialPagination: {
    hasNext: boolean;
    cursor: string | null;
  } | null;
  className?: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  albumId,
  initialMedia,
  initialPagination,
  className,
}) => {
  const router = useRouter();
  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const { preloadStatuses } = useUserInteractionStatus();

  useEffect(() => {
    setMedia(initialMedia);
    setPagination(initialPagination);
  }, [initialMedia, initialPagination]);

  // Preload interaction statuses for all media items to avoid individual API calls
  useEffect(() => {
    if (media.length > 0) {
      const targets = media.map((mediaItem) => ({
        targetType: "media" as const,
        targetId: mediaItem.id,
      }));
      preloadStatuses(targets).catch(console.error);
    }
  }, [media, preloadStatuses]);

  const handleLoadMore = async () => {
    if (!pagination?.hasNext || loading) return;

    setLoading(true);
    setError(null);
    const result = await getMediaForAlbum(
      albumId,
      pagination.cursor ? { cursor: pagination.cursor } : {}
    );

    const { data, error: apiError } = result;
    if (data && data.media) {
      setMedia((prevMedia) => [...prevMedia, ...data.media]);
      setPagination(data.pagination);
    } else {
      setError(apiError || "Failed to load more media.");
    }

    setLoading(false);
  };

  const handleMediaClick = (index: number) => {
    const mediaItem = media[index];
    // Navigate to the media detail page instead of opening lightbox
    router.push(`/media/${mediaItem.id}`);
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const handleLightboxNext = () => {
    if (currentMediaIndex < media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handleLightboxPrevious = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  if (media.length === 0 && !loading) {
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
          {media.map((mediaItem, index) => {
            // SSR-safe column calculation for ResponsivePicture optimization
            // grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
            const getColumns = (): number => {
              if (typeof window !== "undefined") {
                const width = window.innerWidth;
                if (width >= 1024) return 4; // lg:grid-cols-4
                if (width >= 768) return 3; // md:grid-cols-3
                if (width >= 640) return 2; // sm:grid-cols-2
                return 1; // grid-cols-1
              }
              // SSR fallback - assume album page medium layout
              return 3;
            };

            return (
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
                onClick={() => handleMediaClick(index)}
                context="albums"
                columns={getColumns()}
                mediaList={media}
                currentIndex={index}
              />
            );
          })}
        </div>

        {loading && (
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

        {pagination?.hasNext && !loading && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              className="px-8"
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More Media"}
            </Button>
          </div>
        )}
      </div>

      <Lightbox
        media={media}
        currentIndex={currentMediaIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
      />
    </>
  );
};
