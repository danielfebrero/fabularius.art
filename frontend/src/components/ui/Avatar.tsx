"use client";

import { User } from "@/types/user";
import { composeMediaUrl } from "@/lib/urlUtils";
import { cn } from "@/lib/utils";

interface AvatarProps {
  user: User;
  size?: "small" | "medium" | "large" | "xlarge";
  className?: string;
  showOnlineIndicator?: boolean;
}

/**
 * Avatar component for displaying user avatars with automatic fallback to initials
 * 
 * Features:
 * - Responsive avatar thumbnails with optimal size selection
 * - Automatic fallback to user initials if no avatar
 * - Consistent styling across the application
 * - Support for online indicators
 * 
 * Size mapping:
 * - small: 32px (w-8 h-8) - for small UI elements, header menu
 * - medium: 48px (w-12 h-12) - for regular UI elements  
 * - large: 64px (w-16 h-16) - for profile cards, user info
 * - xlarge: 96px (w-24 h-24) - for profile headers, large displays
 */
export function Avatar({ 
  user, 
  size = "medium", 
  className,
  showOnlineIndicator = false 
}: AvatarProps) {
  const displayName = user.username || user.email.split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase();

  // Get the best avatar URL based on size
  const getAvatarUrl = () => {
    if (!user.avatarThumbnails && !user.avatarUrl) return null;

    // Map size to avatar thumbnail preference
    switch (size) {
      case "small":
        return (
          user.avatarThumbnails?.small ||
          user.avatarThumbnails?.medium ||
          user.avatarThumbnails?.large ||
          user.avatarThumbnails?.originalSize ||
          user.avatarUrl
        );
      case "medium":
        return (
          user.avatarThumbnails?.medium ||
          user.avatarThumbnails?.small ||
          user.avatarThumbnails?.large ||
          user.avatarThumbnails?.originalSize ||
          user.avatarUrl
        );
      case "large":
        return (
          user.avatarThumbnails?.large ||
          user.avatarThumbnails?.medium ||
          user.avatarThumbnails?.originalSize ||
          user.avatarThumbnails?.small ||
          user.avatarUrl
        );
      case "xlarge":
        return (
          user.avatarThumbnails?.large ||
          user.avatarThumbnails?.originalSize ||
          user.avatarThumbnails?.medium ||
          user.avatarThumbnails?.small ||
          user.avatarUrl
        );
      default:
        return (
          user.avatarThumbnails?.medium ||
          user.avatarThumbnails?.small ||
          user.avatarThumbnails?.large ||
          user.avatarThumbnails?.originalSize ||
          user.avatarUrl
        );
    }
  };

  const avatarUrl = getAvatarUrl();

  // Size class mapping
  const sizeClasses = {
    small: "w-8 h-8 text-sm",
    medium: "w-12 h-12 text-base",
    large: "w-16 h-16 text-lg",
    xlarge: "w-24 h-24 text-xl",
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium overflow-hidden shadow-sm",
          sizeClasses[size]
        )}
      >
        {avatarUrl ? (
          <img
            src={composeMediaUrl(avatarUrl)}
            alt={`${displayName}'s avatar`}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      
      {showOnlineIndicator && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
      )}
    </div>
  );
}

export default Avatar;
