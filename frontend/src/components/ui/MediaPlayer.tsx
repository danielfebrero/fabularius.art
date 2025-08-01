"use client";

import { FC, useState, useEffect, useRef } from "react";
import { Media } from "@/types";
import { ContentCard } from "@/components/ui/ContentCard";
import { cn, isVideo } from "@/lib/utils";
import { composeMediaUrl } from "@/lib/urlUtils";
import { useIsMobile } from "@/hooks/useIsMobile";

interface MediaPlayerProps {
  media: Media;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onMobileClick?: () => void; // Optional mobile-specific click handler
  onFullscreen?: () => void;
  className?: string;
  imageClassName?: string;
}

export const MediaPlayer: FC<MediaPlayerProps> = ({
  media,
  isPlaying,
  onTogglePlay,
  onMobileClick,
  onFullscreen,
  className,
  imageClassName,
}) => {
  const isMobile = useIsMobile();
  const isVideoMedia = isVideo(media);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Track native controls visibility on mobile
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  // Detect native video controls visibility on mobile
  useEffect(() => {
    if (!isMobile || !isVideoMedia || !isPlaying || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    let controlsVisibilityTimer: NodeJS.Timeout;

    const handleControlsShow = () => {
      setShowMobileOverlay(true);

      // Clear any existing timer
      if (controlsVisibilityTimer) {
        clearTimeout(controlsVisibilityTimer);
      }

      // Set timer to hide overlay when controls auto-hide (usually after 3 seconds)
      controlsVisibilityTimer = setTimeout(() => {
        setShowMobileOverlay(false);
      }, 3000);
    };

    const handleVideoInteraction = () => {
      // When user interacts with video, controls become visible
      handleControlsShow();
    };

    // Listen for user interactions that show controls
    video.addEventListener("click", handleVideoInteraction);
    video.addEventListener("touchstart", handleVideoInteraction);
    video.addEventListener("play", handleControlsShow);
    video.addEventListener("pause", handleControlsShow);

    // Initial state - show controls when video starts
    if (isPlaying) {
      handleControlsShow();
    }

    return () => {
      video.removeEventListener("click", handleVideoInteraction);
      video.removeEventListener("touchstart", handleVideoInteraction);
      video.removeEventListener("play", handleControlsShow);
      video.removeEventListener("pause", handleControlsShow);
      if (controlsVisibilityTimer) {
        clearTimeout(controlsVisibilityTimer);
      }
    };
  }, [isMobile, isVideoMedia, isPlaying]);

  // Reset overlay when not playing
  useEffect(() => {
    if (!isPlaying) {
      setShowMobileOverlay(false);
    }
  }, [isPlaying]);

  if (!isVideoMedia) {
    // For regular images, use ContentCard
    return (
      <ContentCard
        item={media}
        type="media"
        aspectRatio="auto"
        className={className}
        imageClassName={imageClassName}
        preferredThumbnailSize="originalSize"
        canLike={true}
        canBookmark={true}
        canFullscreen={true}
        canAddToAlbum={true}
        canDownload={true}
        canDelete={false}
        onClick={isMobile ? onMobileClick : onTogglePlay}
        onFullscreen={onFullscreen}
      />
    );
  }

  if (isPlaying) {
    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMobileOverlay(false);
      onTogglePlay();
    };

    // Show actual video player with controls
    return (
      <div className={cn("relative group", className)}>
        <video
          ref={videoRef}
          src={composeMediaUrl(media.url)}
          className={cn(
            "w-full h-auto max-h-[80vh] object-contain",
            imageClassName
          )}
          controls
          autoPlay
          muted
          playsInline
        />

        {/* Close button - desktop: on hover, mobile: on tap */}
        {(!isMobile || showMobileOverlay) && (
          <button
            onClick={handleCloseClick}
            className={cn(
              "absolute top-4 right-4 bg-black/80 hover:bg-black/95 text-white p-3 rounded-full transition-all duration-200 z-10 shadow-lg border-2 border-white/20",
              isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            title="Return to preview"
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
        )}
      </div>
    );
  }

  // Show preview mode (thumbnail with play button)
  return (
    <ContentCard
      item={media}
      type="media"
      aspectRatio="auto"
      className={className}
      imageClassName={imageClassName}
      preferredThumbnailSize="originalSize"
      canLike={true}
      canBookmark={true}
      canFullscreen={true}
      canAddToAlbum={true}
      canDownload={true}
      canDelete={false}
      onClick={isMobile ? onMobileClick : onTogglePlay}
      onFullscreen={onFullscreen}
    />
  );
};
