"use client";

import { useEffect } from "react";
import { interactionApi } from "../../lib/api";

interface ViewTrackerProps {
  targetType: "album" | "media" | "profile";
  targetId: string;
}

import { useRef } from "react";

export const ViewTracker: React.FC<ViewTrackerProps> = ({
  targetType,
  targetId,
}) => {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackView = async () => {
      try {
        await interactionApi.trackView({
          targetType,
          targetId,
        });
      } catch (error) {
        // Silently fail view tracking - not critical
        console.debug("View tracking failed:", error);
      }
    };

    // Track view when component mounts (page load)
    trackView();
  }, [targetType, targetId]);

  return null; // This component doesn't render anything
};
