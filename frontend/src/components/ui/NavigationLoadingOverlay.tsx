"use client";

import { useNavigationLoading } from "@/contexts/NavigationLoadingContext";
import {
  MediaDetailSkeleton,
  AlbumDetailSkeleton,
} from "@/components/ui/NavigationSkeletons";

export function NavigationLoadingOverlay() {
  const { isNavigating, destinationType } = useNavigationLoading();

  if (!isNavigating) {
    return null;
  }

  // Choose the appropriate skeleton based on the destination type
  const SkeletonComponent =
    destinationType === "album" ? AlbumDetailSkeleton : MediaDetailSkeleton;

  return (
    <div
      className={`fixed inset-0 z-50 bg-background transition-opacity duration-150 ${
        isNavigating ? "opacity-100" : "opacity-0"
      }`}
      style={{ zIndex: 9999 }}
    >
      <SkeletonComponent />
    </div>
  );
}
