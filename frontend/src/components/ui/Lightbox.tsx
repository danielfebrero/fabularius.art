import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Media } from "../../types/index";
import { cn } from "../../lib/utils";
import { ContentCard } from "./ContentCard";

interface LightboxProps {
  media: Media[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  media,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const currentMedia = media[currentIndex];

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the backdrop itself is clicked
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (currentIndex > 0) {
            onPrevious();
          }
          break;
        case "ArrowRight":
          if (currentIndex < media.length - 1) {
            onNext();
          }
          break;
      }
    },
    [isOpen, onClose, onNext, onPrevious, currentIndex, media.length]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !currentMedia || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black" onClick={handleClose}>
      {/* Content wrapper: stop propagation to prevent closing when clicking on content */}
      <div
        className="relative w-full h-full"
        // No longer need to stop propagation here since handleClose is more specific
      >
        {/* Media Content */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="max-w-[100vw] max-h-[100vh] w-fit h-fit">
            <ContentCard
              item={currentMedia}
              type="media"
              aspectRatio="auto"
              className="bg-transparent shadow-none border-none w-fit h-fit"
              imageClassName="max-w-[calc(100vw)] max-h-[calc(100vh)] w-auto h-auto object-contain"
              canLike={true}
              canBookmark={true}
              canFullscreen={false}
              canAddToAlbum={true}
              canDownload={true}
              canDelete={false}
              showCounts={false}
              disableHoverEffects={true}
              preferredThumbnailSize="originalSize"
              useAllAvailableSpace={true}
              onClick={() => {}}
            />
          </div>
        </div>

        {/* Media Counter */}
        {media.length > 1 && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium z-30 backdrop-blur-sm border border-white/20">
            {currentIndex + 1} of {media.length}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white z-20"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentIndex > 0) {
                  onPrevious();
                }
              }}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors",
                currentIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              )}
              aria-label="Previous image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (currentIndex < media.length - 1) {
                  onNext();
                }
              }}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors",
                currentIndex === media.length - 1
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              )}
              aria-label="Next image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
