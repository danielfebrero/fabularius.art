import React, { useEffect, useCallback } from "react";
import { Media } from "../../types/index";
import { cn } from "../../lib/utils";

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
  const currentMedia = media[currentIndex];

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrevious();
          break;
        case "ArrowRight":
          onNext();
          break;
      }
    },
    [isOpen, onClose, onNext, onPrevious]
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

  if (!isOpen || !currentMedia) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const isImage = currentMedia.mimeType.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close lightbox"
      />

      {/* Content */}
      <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold truncate">
              {currentMedia.originalName || currentMedia.filename}
            </h2>
            <span className="text-sm text-gray-300">
              {currentIndex + 1} of {media.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
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

        {/* Media Content */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          {isImage ? (
            <img
              src={currentMedia.url}
              alt={currentMedia.originalName || currentMedia.filename}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white">
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
                href={currentMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Download File
              </a>
            </div>
          )}

          {/* Navigation Arrows */}
          {media.length > 1 && (
            <>
              <button
                onClick={onPrevious}
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors",
                  currentIndex === 0 && "opacity-50 cursor-not-allowed"
                )}
                disabled={currentIndex === 0}
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
                onClick={onNext}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors",
                  currentIndex === media.length - 1 &&
                    "opacity-50 cursor-not-allowed"
                )}
                disabled={currentIndex === media.length - 1}
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

        {/* Footer with metadata */}
        <div className="p-4 text-white border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
            <span>Uploaded: {formatDate(currentMedia.createdAt)}</span>
            <span>Size: {formatFileSize(currentMedia.size)}</span>
            <span>Type: {currentMedia.mimeType}</span>
            {isImage && currentMedia.width && currentMedia.height && (
              <span>
                Dimensions: {currentMedia.width} × {currentMedia.height}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
