import React, { useState } from "react";
import { Media } from "../types/index";
import { MediaCard } from "./ui/MediaCard";
import { Lightbox } from "./ui/Lightbox";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface MediaGalleryProps {
  media: Media[];
  loading?: boolean;
  error?: string | null;
  pagination?: {
    hasNext: boolean;
    cursor: string | null;
  } | null;
  onLoadMore?: () => void;
  className?: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  media,
  loading = false,
  error = null,
  pagination = null,
  onLoadMore,
  className,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const handleMediaClick = (index: number) => {
    setCurrentMediaIndex(index);
    setLightboxOpen(true);
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

  // Loading state
  if (loading && media.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-muted rounded-lg overflow-hidden">
                <div className="aspect-square bg-muted-foreground/20" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                  <div className="h-2 bg-muted-foreground/20 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to load media
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (media.length === 0) {
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
            This album doesn&apos;t contain any media files yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-6", className)}>
        {/* Media Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {media.map((mediaItem, index) => (
            <MediaCard
              key={mediaItem.id}
              media={mediaItem}
              onClick={() => handleMediaClick(index)}
            />
          ))}
        </div>

        {/* Loading more indicator */}
        {loading && media.length > 0 && (
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

        {/* Load More Button */}
        {pagination?.hasNext && !loading && onLoadMore && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={onLoadMore} className="px-8">
              Load More Media
            </Button>
          </div>
        )}

        {/* Media Count Info */}
        {media.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {media.length} media {media.length === 1 ? "file" : "files"}
          </div>
        )}
      </div>

      {/* Lightbox */}
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
