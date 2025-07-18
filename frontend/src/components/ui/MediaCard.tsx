import React from "react";
import { Media } from "../../types/index";
import { cn, ThumbnailContext } from "../../lib/utils";
import { PlayCircle } from "lucide-react";
import {
  composeMediaUrl,
  composeThumbnailUrls,
  getBestThumbnailUrl,
} from "../../lib/urlUtils";
import ResponsivePicture from "./ResponsivePicture";

interface MediaCardProps {
  media: Media;
  className?: string;
  onClick?: () => void;
  context?: ThumbnailContext;
  columns?: number;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  className,
  onClick,
  context = "default",
  columns,
}) => {
  const isVideo = media.mimeType.startsWith("video/");

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
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <PlayCircle className="w-16 h-16 text-white/80 opacity-50 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110" />
        </div>
      )}
    </div>
  );
};
