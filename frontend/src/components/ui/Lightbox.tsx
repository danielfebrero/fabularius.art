import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Media } from "@/types/index";
import { cn } from "@/lib/utils";
import { ContentCard } from "@/components/ui/ContentCard";
import { ViewTracker } from "@/components/ui//ViewTracker";
import { useLightboxPreloader } from "@/hooks/useLightboxPreloader";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface LightboxProps {
  media: Media[];
  currentIndex: number;
  isOpen: boolean;

  canDelete?: boolean;

  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  media,
  currentIndex,
  isOpen,
  canDelete = false,
  onClose,
  onNext,
  onPrevious,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right" | null
  >(null);

  const currentMedia = media[currentIndex];
  const nextMedia = media[currentIndex + 1];
  const prevMedia = media[currentIndex - 1];

  // Use optimized preloader for seamless navigation
  const { preloadAroundIndex } = useLightboxPreloader(media, currentIndex);

  // Handle swipe gestures with preview
  const {
    handleDragStart,
    handleDrag,
    handleDragEnd,
    isDragging,
    dragOffset,
    direction,
  } = useSwipeGesture({
    onSwipeLeft: () => {
      if (currentIndex < media.length - 1) {
        setAnimationDirection("left");
        onNext();
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        setAnimationDirection("right");
        onPrevious();
      }
    },
    enablePreview: true,
  });

  // Trigger preloading when lightbox opens or index changes
  useEffect(() => {
    if (isOpen && media.length > 0) {
      preloadAroundIndex(currentIndex);
    }
  }, [isOpen, currentIndex, media.length, preloadAroundIndex]);

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the backdrop itself is clicked
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Clear animation direction after navigation
  useEffect(() => {
    if (animationDirection) {
      const timer = setTimeout(() => setAnimationDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [animationDirection]);

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
      {/* View Tracker - Track view when media is displayed */}
      {currentMedia && (
        <ViewTracker
          key={currentMedia.id}
          targetType="media"
          targetId={currentMedia.id}
        />
      )}

      {/* Content wrapper */}
      <div className="relative w-full h-full">
        {/* Swipeable Media Content with Card Deck Effect */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full max-w-[100vw] max-h-[100vh]">
            <AnimatePresence
              mode="wait"
              custom={animationDirection || direction}
            >
              <motion.div
                key={currentIndex}
                className="absolute inset-0 flex items-center justify-center"
                custom={animationDirection || direction}
                initial={{
                  opacity: 0,
                  x:
                    (animationDirection || direction) === "left"
                      ? 300
                      : (animationDirection || direction) === "right"
                      ? -300
                      : 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x:
                    (animationDirection || direction) === "left"
                      ? -300
                      : (animationDirection || direction) === "right"
                      ? 300
                      : 0,
                  scale: 0.8,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{
                  x: dragOffset,
                }}
              >
                <div className="w-fit h-fit max-w-full max-h-full">
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
                    canDelete={canDelete}
                    showCounts={false}
                    disableHoverEffects={true}
                    preferredThumbnailSize="originalSize"
                    useAllAvailableSpace={true}
                    onClick={() => {}}
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Card Deck Preview - Show next/previous images during drag */}
            {isDragging && direction && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 0.6, scale: 0.8 }}
                style={{
                  zIndex: -1,
                  transform: `translateX(${
                    direction === "left" ? "50%" : "-50%"
                  })`,
                }}
              >
                {direction === "left" && nextMedia && (
                  <div className="w-fit h-fit max-w-full max-h-full opacity-60">
                    <ContentCard
                      item={nextMedia}
                      type="media"
                      aspectRatio="auto"
                      className="bg-transparent shadow-none border-none w-fit h-fit"
                      imageClassName="max-w-[calc(90vw)] max-h-[calc(90vh)] w-auto h-auto object-contain"
                      canLike={false}
                      canBookmark={false}
                      canFullscreen={false}
                      canAddToAlbum={false}
                      canDownload={false}
                      canDelete={false}
                      showCounts={false}
                      disableHoverEffects={true}
                      preferredThumbnailSize="originalSize"
                      useAllAvailableSpace={true}
                      onClick={() => {}}
                    />
                  </div>
                )}
                {direction === "right" && prevMedia && (
                  <div className="w-fit h-fit max-w-full max-h-full opacity-60">
                    <ContentCard
                      item={prevMedia}
                      type="media"
                      aspectRatio="auto"
                      className="bg-transparent shadow-none border-none w-fit h-fit"
                      imageClassName="max-w-[calc(90vw)] max-h-[calc(90vh)] w-auto h-auto object-contain"
                      canLike={false}
                      canBookmark={false}
                      canFullscreen={false}
                      canAddToAlbum={false}
                      canDownload={false}
                      canDelete={false}
                      showCounts={false}
                      disableHoverEffects={true}
                      preferredThumbnailSize="originalSize"
                      useAllAvailableSpace={true}
                      onClick={() => {}}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Media Counter */}
        {media.length > 1 && (
          <motion.div
            className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium z-30 backdrop-blur-sm border border-white/20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {currentIndex + 1} of {media.length}
          </motion.div>
        )}

        {/* Close Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white z-20"
          aria-label="Close"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
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
        </motion.button>

        {/* Navigation Arrows - Enhanced for mobile */}
        {media.length > 1 && (
          <>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                if (currentIndex > 0) {
                  setAnimationDirection("right");
                  onPrevious();
                }
              }}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-20",
                currentIndex === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "cursor-pointer hover:scale-110"
              )}
              aria-label="Previous image"
              disabled={currentIndex === 0}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: currentIndex === 0 ? 0.3 : 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={currentIndex > 0 ? { scale: 1.1 } : {}}
              whileTap={currentIndex > 0 ? { scale: 0.9 } : {}}
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
            </motion.button>

            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                if (currentIndex < media.length - 1) {
                  setAnimationDirection("left");
                  onNext();
                }
              }}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-20",
                currentIndex === media.length - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "cursor-pointer hover:scale-110"
              )}
              aria-label="Next image"
              disabled={currentIndex === media.length - 1}
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: currentIndex === media.length - 1 ? 0.3 : 1,
                x: 0,
              }}
              transition={{ delay: 0.3 }}
              whileHover={currentIndex < media.length - 1 ? { scale: 1.1 } : {}}
              whileTap={currentIndex < media.length - 1 ? { scale: 0.9 } : {}}
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
            </motion.button>
          </>
        )}

        {/* Mobile Swipe Indicator */}
        {media.length > 1 && (
          <motion.div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm z-20 md:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              <span>Swipe to navigate</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </motion.div>
        )}
      </div>
    </div>,
    document.body
  );
};
