import React, { useState } from "react";
import { Media } from "../../types/index";
import { cn, ThumbnailContext } from "../../lib/utils";
import { PlayCircle } from "lucide-react";
import {
  composeMediaUrl,
  composeThumbnailUrls,
  getBestThumbnailUrl,
} from "../../lib/urlUtils";
import ResponsivePicture from "./ResponsivePicture";
import { LikeButton } from "../user/LikeButton";
import { BookmarkButton } from "../user/BookmarkButton";

interface MediaCardProps {
  media: Media;
  className?: string;
  onClick?: () => void;
  context?: ThumbnailContext;
  columns?: number;
  albumId?: string; // Required for media interactions
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  className,
  onClick,
  context = "default",
  columns,
  albumId,
}) => {
  const isVideo = media.mimeType.startsWith("video/");
  const [actionsOpen, setActionsOpen] = useState(false);

  // Detect if user is on a mobile device
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleActionClick = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (isMobile) {
      setActionsOpen(!actionsOpen);
    }
  };

  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] aspect-w-1 aspect-h-1",
        className
      )}
      onClick={onClick}
    >
      {isVideo ? (
        <video
          src={composeMediaUrl(media.url)}
          poster={composeMediaUrl(media.thumbnailUrl)}
          className="w-full h-full object-cover"
          preload="metadata"
          muted
          playsInline
        />
      ) : (
        <ResponsivePicture
          thumbnailUrls={composeThumbnailUrls(media.thumbnailUrls)}
          fallbackUrl={getBestThumbnailUrl(
            media.thumbnailUrls,
            media.thumbnailUrl || media.url,
            "medium"
          )}
          alt={media.originalFilename || media.filename}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          context={context}
          columns={columns}
          loading="lazy"
        />
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

      {/* Play button for videos */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayCircle className="w-16 h-16 text-white/80 opacity-50 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110" />
        </div>
      )}

      {/* Action buttons overlay - only show if albumId is provided */}
      {albumId && (
        <>
          {/* Mobile touch area for actions */}
          {isMobile && (
            <button
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center md:hidden"
              onClick={handleActionClick}
              onTouchEnd={handleActionClick}
            >
              <span className="text-white text-xs">⋯</span>
            </button>
          )}

          {/* Action buttons */}
          <div
            className={cn(
              "absolute top-2 left-2 flex flex-col gap-2 transition-opacity duration-200 z-20",
              isMobile
                ? actionsOpen
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
                : "opacity-0 group-hover:opacity-100"
            )}
          >
            <span onClick={handleActionClick} onTouchEnd={handleActionClick}>
              <LikeButton
                targetType="media"
                targetId={media.id}
                size="sm"
                variant="default"
                className="bg-white/90 hover:bg-white shadow-lg"
                useCache={true}
              />
            </span>
            <span onClick={handleActionClick} onTouchEnd={handleActionClick}>
              <BookmarkButton
                targetType="media"
                targetId={media.id}
                size="sm"
                variant="default"
                className="bg-white/90 hover:bg-white shadow-lg"
                useCache={true}
              />
            </span>
          </div>
        </>
      )}
    </div>
  );
};
