"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useInteractions } from "@/hooks/useInteractions";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  targetType: "album" | "media";
  targetId: string;
  albumId?: string; // Required for media interactions
  initialLiked?: boolean;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  targetType,
  targetId,
  albumId,
  initialLiked = false,
  showCount = false,
  size = "md",
  variant = "ghost",
  className,
}) => {
  const { user } = useUser();
  const { toggleLike, isToggling, error } = useInteractions();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState<number | null>(null);

  // Size configurations
  const sizeConfig = {
    sm: {
      button: "h-8 w-8 p-0",
      icon: "h-4 w-4",
      text: "text-xs",
    },
    md: {
      button: "h-10 w-10 p-0",
      icon: "h-5 w-5",
      text: "text-sm",
    },
    lg: {
      button: "h-12 w-12 p-0",
      icon: "h-6 w-6",
      text: "text-base",
    },
  };

  const config = sizeConfig[size];

  const handleLike = async () => {
    if (!user) {
      // You could show a login modal here
      return;
    }

    try {
      // Update state optimistically first
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);

      // Update count optimistically
      if (likeCount !== null) {
        setLikeCount(newLikedState ? likeCount + 1 : likeCount - 1);
      }

      await toggleLike(targetType, targetId, albumId, isLiked);
    } catch (err) {
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      if (likeCount !== null) {
        setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
      }
      console.error("Failed to toggle like:", err);
    }
  };

  // Load initial counts and status
  useEffect(() => {
    if (showCount && user) {
      // This would need to be implemented if we want to show counts
      // For now, we'll just use the initial state
    }
  }, [targetType, targetId, showCount, user]);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={variant}
        size="icon"
        onClick={handleLike}
        disabled={isToggling || !user}
        className={cn(
          config.button,
          "transition-colors duration-200",
          isLiked && "text-red-500 hover:text-red-600",
          !isLiked && "text-gray-500 hover:text-red-500",
          className
        )}
        title={!user ? "Login to like" : isLiked ? "Remove like" : "Like"}
      >
        <Heart
          className={cn(
            config.icon,
            "transition-all duration-200",
            isLiked && "fill-current"
          )}
        />
      </Button>

      {showCount && likeCount !== null && (
        <span className={cn("font-medium text-gray-600", config.text)}>
          {likeCount.toLocaleString()}
        </span>
      )}

      {error && (
        <span className="text-xs text-red-500 ml-2">Failed to update</span>
      )}
    </div>
  );
};
