"use client";

import { useState, useEffect } from "react";
import { Heart, Bookmark } from "lucide-react";
import { useInteractions } from "@/hooks/useInteractions";
import { cn } from "@/lib/utils";

interface InteractionCountsProps {
  targetType: "album" | "media";
  targetId: string;
  showIcons?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const InteractionCounts: React.FC<InteractionCountsProps> = ({
  targetType,
  targetId,
  showIcons = true,
  size = "md",
  className,
}) => {
  const { getCounts, isLoadingCounts } = useInteractions();
  const [likeCount, setLikeCount] = useState<number>(0);
  const [bookmarkCount, setBookmarkCount] = useState<number>(0);
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

  // Load counts on mount
  useEffect(() => {
    const loadCounts = async () => {
      const counts = await getCounts(targetType, targetId);
      if (counts?.data) {
        setLikeCount(counts.data.likeCount);
        setBookmarkCount(counts.data.bookmarkCount);
        setUserLiked(counts.data.userLiked);
        setUserBookmarked(counts.data.userBookmarked);
      }
    };

    loadCounts();
  }, [targetType, targetId, getCounts]);

  if (isLoadingCounts) {
    return (
      <div className={cn("flex items-center", config.gap, className)}>
        <div className="animate-pulse">
          <div className="h-4 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

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
    </div>
  );
};
