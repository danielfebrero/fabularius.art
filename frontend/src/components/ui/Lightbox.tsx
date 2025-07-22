import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Media } from "../../types/index";
import { cn, getMediaDisplayUrl } from "../../lib/utils";
import { composeMediaUrl } from "../../lib/urlUtils";
import { LikeButton } from "../user/LikeButton";
import { BookmarkButton } from "../user/BookmarkButton";
import { ShareDropdown } from "./ShareDropdown";
import { Share2 } from "lucide-react";

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
  const [showHeader, setShowHeader] = useState(false);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = () => {
    if (!currentMedia) return;
    // Always use original URL for downloads to preserve original format
    window.open(composeMediaUrl(currentMedia.url), "_blank");
  };

  const isImage = currentMedia.mimeType.startsWith("image/");
  const isVideo = currentMedia.mimeType.startsWith("video/");

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black" onClick={handleClose}>
      {/* Content wrapper: stop propagation to prevent closing when clicking on content */}
      <div
        className="relative w-full h-full"
        // No longer need to stop propagation here since handleClose is more specific
      >
        {/* Media Content */}
        <div className="w-full h-full">
          {isImage ? (
            <img
              src={composeMediaUrl(getMediaDisplayUrl(currentMedia))}
              alt={currentMedia.originalName || currentMedia.filename}
              className="w-full h-full object-contain"
            />
          ) : isVideo ? (
            <video
              src={composeMediaUrl(currentMedia.url)}
              controls
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center text-white h-full">
              <svg
                className="w-24 h-24 mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-xl mb-2">
                {currentMedia.originalName || currentMedia.filename}
              </p>
              <p className="text-gray-400">
                {currentMedia.mimeType} • {formatFileSize(currentMedia.size)}
              </p>
              <a
                href={composeMediaUrl(currentMedia.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                download
                onClick={(e) => e.stopPropagation()}
              >
                Download Original File
              </a>
            </div>
          )}
        </div>

        {/* Header */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300 z-10",
            showHeader
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
          onMouseEnter={() => setShowHeader(true)}
          onMouseLeave={() => setShowHeader(false)}
        >
          <div className="flex items-center justify-between text-white p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                {currentIndex + 1} of {media.length}
              </span>
            </div>
            <div className="flex items-center">
              <LikeButton
                targetType="media"
                targetId={currentMedia.id}
                size="sm"
                variant="default"
                className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2 cursor-pointer"
              />
              <BookmarkButton
                targetType="media"
                targetId={currentMedia.id}
                size="sm"
                variant="default"
                className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2 cursor-pointer"
              />
              <ShareDropdown
                trigger={({ toggle }: { toggle: () => void }) => (
                  <button
                    className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggle();
                    }}
                    aria-label="Share media"
                    tabIndex={0}
                    type="button"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                )}
              >
                {({ close }: { close: () => void }) => (
                  <>
                    <button
                      className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        navigator.clipboard.writeText(
                          `${window.location.origin}/media/${currentMedia.id}`
                        );
                        close();
                      }}
                    >
                      Copy link
                    </button>
                    <a
                      className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      href={`https://www.reddit.com/submit?url=${encodeURIComponent(
                        window.location.origin + "/media/" + currentMedia.id
                      )}&title=${encodeURIComponent(
                        currentMedia.originalName || currentMedia.filename
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={close}
                    >
                      Reddit
                    </a>
                    <a
                      className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      href={`https://x.com/intent/tweet?url=${encodeURIComponent(
                        window.location.origin + "/media/" + currentMedia.id
                      )}&text=${encodeURIComponent(
                        currentMedia.originalName || currentMedia.filename
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={close}
                    >
                      X
                    </a>
                  </>
                )}
              </ShareDropdown>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2 cursor-pointer"
                aria-label="Download"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
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
            </div>
          </div>
        </div>

        {/* Header hover zone - only active when header is hidden */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-20",
            showHeader ? "pointer-events-none" : "pointer-events-auto"
          )}
          onMouseEnter={() => setShowHeader(true)}
        />

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
