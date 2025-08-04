"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  useToggleLike,
  useInteractionStatus,
} from "@/hooks/queries/useInteractionsQuery";
import { useUser } from "@/hooks/useUser";
import { InteractionButtonSkeleton } from "@/components/ui/Skeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
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
  useCache?: boolean; // If true, only use cache (don't make individual API calls)
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
  useCache = false,
}) => {
  const { user } = useUser();
  const [likeCount] = useState<number | null>(null);
  const { redirectToLogin } = useAuthRedirect();

  const t = useTranslations("common");
  const tUser = useTranslations("user.likes");

  // Use TanStack Query hooks for interaction status and toggle
  // Only fetch status if user is logged in to avoid unnecessary requests
  const targets = user ? [{ targetType, targetId }] : [];
  const { data: statusData, isLoading } = useInteractionStatus(targets);
  const { mutateAsync: toggleLikeMutation, isPending: isToggling } =
    useToggleLike();

  // Get current like status from TanStack Query data
  const interactionStatus = statusData?.data?.statuses?.[0];
  const isLiked = user ? interactionStatus?.userLiked ?? false : initialLiked;

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
      // Redirect to login page with current page as return URL
      redirectToLogin();
      return;
    }

    try {
      // Use TanStack Query mutation with optimistic updates
      await toggleLikeMutation({
        targetType,
        targetId,
        albumId,
        isCurrentlyLiked: isLiked,
      });
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  // Load initial counts and status - handled by TanStack Query
  // The useInteractionStatus hook automatically fetches status when needed

  return (
    <div className="flex items-center gap-1">
      {user && isLoading ? (
        <InteractionButtonSkeleton size={size} className={className} />
      ) : (
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
          title={
            !user
              ? tUser("loginToLike")
              : isLiked
              ? tUser("removeLike")
              : t("like")
          }
        >
          <Heart
            className={cn(
              config.icon,
              "transition-all duration-200",
              isLiked && "fill-current"
            )}
          />
        </Button>
      )}

      {showCount && likeCount !== null && (
        <span className={cn("font-medium text-gray-600", config.text)}>
          {likeCount.toLocaleString()}
        </span>
      )}
    </div>
  );
};
