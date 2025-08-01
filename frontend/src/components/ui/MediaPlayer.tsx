"use client";

import { FC, useState } from "react";
import { Media } from "@/types";
import { ContentCard } from "@/components/ui/ContentCard";
import { cn, isVideo } from "@/lib/utils";
import { composeMediaUrl } from "@/lib/urlUtils";
import { useIsMobile } from "@/hooks/useIsMobile";

interface MediaPlayerProps {
  media: Media;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onFullscreen?: () => void;
  className?: string;
  imageClassName?: string;
}

export const MediaPlayer: FC<MediaPlayerProps> = ({
  media,
  isPlaying,
  onTogglePlay,
  onFullscreen,
  className,
  imageClassName,
}) => {
  const isMobile = useIsMobile();
  const isVideoMedia = isVideo(media);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

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
        onClick={isMobile ? undefined : onTogglePlay}
        onFullscreen={onFullscreen}
      />
    );
  }

  if (isPlaying) {
    // Handle mobile video tap behavior
    const handleVideoClick = () => {
      if (isMobile) {
        if (!showMobileOverlay) {
          // First tap: show overlay
          setShowMobileOverlay(true);
        } else {
          // Second tap: hide overlay and let native controls show
          setShowMobileOverlay(false);
        }
      }
    };

    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMobileOverlay(false);
      onTogglePlay();
    };

    // Show actual video player with controls
    return (
      <div className={cn("relative group", className)}>
        <video
          src={composeMediaUrl(media.url)}
          className={cn(
            "w-full h-auto max-h-[80vh] object-contain",
            imageClassName
          )}
          controls
          autoPlay
          muted
          playsInline
          onClick={handleVideoClick}
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

        {/* Mobile overlay backdrop - hides when tapped */}
        {isMobile && showMobileOverlay && (
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setShowMobileOverlay(false)}
          />
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
      onClick={isMobile ? undefined : onTogglePlay}
      onFullscreen={onFullscreen}
    />
  );
};
