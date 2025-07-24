"use client";

import { useState, useEffect } from "react";
import { Heart, Bookmark, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserInteractionStatus } from "@/hooks/useUserInteractionStatus";

interface InteractionCountsProps {
  targetType: "album" | "media";
  targetId: string;
  likeCount?: number;
  bookmarkCount?: number;
  viewCount?: number;
  showIcons?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const InteractionCounts: React.FC<InteractionCountsProps> = ({
  targetType,
  targetId,
  likeCount = 0,
  bookmarkCount = 0,
  viewCount = 0,
  showIcons = true,
  size = "md",
  className,
}) => {
  const { getStatus } = useUserInteractionStatus();
  const [userLiked, setUserLiked] = useState<boolean>(false);
  const [userBookmarked, setUserBookmarked] = useState<boolean>(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: "h-3 w-3",
      text: "text-xs",
      gap: "gap-1",
    },
    md: {
      icon: "h-4 w-4",
      text: "text-sm",
      gap: "gap-2",
    },
    lg: {
      icon: "h-5 w-5",
      text: "text-base",
      gap: "gap-3",
    },
  };

  const config = sizeConfig[size];

  // Load user interaction status on mount and when status changes
  useEffect(() => {
    const status = getStatus(targetType, targetId);
    if (status) {
      setUserLiked(status.userLiked);
      setUserBookmarked(status.userBookmarked);
    }
  }, [targetType, targetId, getStatus]);

  return (
    <div className={cn("flex items-center", config.gap, className)}>
      {/* Likes */}
      <div className="flex items-center gap-1">
        {showIcons && (
          <Heart
            className={cn(
              config.icon,
              userLiked ? "text-red-500 fill-current" : "text-gray-400"
            )}
          />
        )}
        <span className={cn("font-medium text-gray-600", config.text)}>
          {likeCount.toLocaleString()}
        </span>
        {!showIcons && (
          <span className={cn("text-gray-500", config.text)}>
            like{likeCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Bookmarks */}
      <div className="flex items-center gap-1">
        {showIcons && (
          <Bookmark
            className={cn(
              config.icon,
              userBookmarked ? "text-blue-500 fill-current" : "text-gray-400"
            )}
          />
        )}
        <span className={cn("font-medium text-gray-600", config.text)}>
          {bookmarkCount.toLocaleString()}
        </span>
        {!showIcons && (
          <span className={cn("text-gray-500", config.text)}>
            bookmark{bookmarkCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Views - only show for albums */}
      {targetType === "album" && (
        <div className="flex items-center gap-1">
          {showIcons && <Eye className={cn(config.icon, "text-gray-400")} />}
          <span className={cn("font-medium text-gray-600", config.text)}>
            {viewCount.toLocaleString()}
          </span>
          {!showIcons && (
            <span className={cn("text-gray-500", config.text)}>
              view{viewCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
