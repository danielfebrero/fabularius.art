import React from "react";
import { Media } from "../../types/index";
import { Card, CardContent } from "./Card";
import { cn } from "../../lib/utils";

interface MediaCardProps {
  media: Media;
  className?: string;
  onClick?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  className,
  onClick,
}) => {
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

  const isImage = media.mimeType.startsWith("image/");

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="aspect-square relative overflow-hidden bg-muted">
          {isImage ? (
            <img
              src={media.thumbnailUrl || media.url}
              alt={media.originalName || media.filename}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <div className="text-center text-muted-foreground">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-xs">
                  {media.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                </p>
              </div>
            </div>
          )}

          {/* Overlay with media info */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

          {/* File size indicator */}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {formatFileSize(media.size)}
          </div>

          {/* Dimensions indicator for images */}
          {isImage && media.width && media.height && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {media.width} × {media.height}
            </div>
          )}
        </div>

        {/* Media metadata */}
        <div className="p-3 space-y-1">
          <h4 className="font-medium text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {media.originalName || media.filename}
          </h4>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(media.createdAt)}</span>
            <span className="capitalize">{media.mimeType.split("/")[0]}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
