"use client";

import { useState, useEffect, useCallback } from "react";
import { Media } from "../types/index";
import { composeMediaUrl } from "../lib/urlUtils";

interface PreloadStatus {
  loaded: Set<string>;
  loading: Set<string>;
  failed: Set<string>;
}

/**
 * Advanced preloader specifically designed for Lightbox usage
 * Preloads current, next, and previous images with priority queuing
 */
export function useLightboxPreloader(media: Media[], currentIndex: number) {
  const [status, setStatus] = useState<PreloadStatus>({
    loaded: new Set(),
    loading: new Set(),
    failed: new Set(),
  });

  const preloadImage = useCallback(
    (url: string, priority: "high" | "medium" | "low" = "medium") => {
      if (
        status.loaded.has(url) ||
        status.loading.has(url) ||
        status.failed.has(url)
      ) {
        return;
      }

      setStatus((prev) => ({
        ...prev,
        loading: new Set(prev.loading).add(url),
      }));

      const img = new Image();

      // Set priority hints for better loading performance
      if ("loading" in img) {
        img.loading = priority === "high" ? "eager" : "lazy";
      }

      // Use fetchpriority if available (newer browsers)
      if ("fetchPriority" in img) {
        (img as any).fetchPriority = priority;
      }

      img.onload = () => {
        setStatus((prev) => {
          const newLoading = new Set(prev.loading);
          newLoading.delete(url);
          return {
            ...prev,
            loaded: new Set(prev.loaded).add(url),
            loading: newLoading,
          };
        });
      };

      img.onerror = () => {
        setStatus((prev) => {
          const newLoading = new Set(prev.loading);
          newLoading.delete(url);
          return {
            ...prev,
            failed: new Set(prev.failed).add(url),
            loading: newLoading,
          };
        });
      };

      img.src = url;
    },
    [status.loaded, status.loading, status.failed]
  );

  const preloadAroundIndex = useCallback(
    (index: number) => {
      const currentMedia = media[index];
      const nextMedia = media[index + 1];
      const prevMedia = media[index - 1];

      // Preload current image with highest priority
      if (currentMedia?.url) {
        preloadImage(
          composeMediaUrl(currentMedia.thumbnailUrls?.originalSize),
          "high"
        );
      }

      // Preload next and previous with medium priority
      if (nextMedia?.url) {
        preloadImage(
          composeMediaUrl(nextMedia.thumbnailUrls?.originalSize),
          "medium"
        );
      }
      if (prevMedia?.url) {
        preloadImage(
          composeMediaUrl(prevMedia.thumbnailUrls?.originalSize),
          "medium"
        );
      }

      // Preload high-quality thumbnails as fallbacks with low priority
      [currentMedia, nextMedia, prevMedia].forEach((mediaItem) => {
        if (mediaItem?.thumbnailUrls?.xlarge) {
          preloadImage(composeMediaUrl(mediaItem.thumbnailUrls.xlarge), "low");
        }
      });

      // Preload additional images ahead for smoother navigation
      const lookAhead = 2;
      for (let i = 1; i <= lookAhead; i++) {
        const futureMedia = media[index + i + 1];
        const pastMedia = media[index - i - 1];

        if (futureMedia?.url) {
          preloadImage(
            composeMediaUrl(futureMedia.thumbnailUrls?.originalSize),
            "low"
          );
        }
        if (pastMedia?.url) {
          preloadImage(
            composeMediaUrl(pastMedia.thumbnailUrls?.originalSize),
            "low"
          );
        }
      }
    },
    [media, preloadImage]
  );

  // Preload images around current index when it changes
  useEffect(() => {
    if (media.length > 0 && currentIndex >= 0 && currentIndex < media.length) {
      preloadAroundIndex(currentIndex);
    }
  }, [currentIndex, media, preloadAroundIndex]);

  // Utility functions
  const isLoaded = useCallback(
    (url: string) => status.loaded.has(url),
    [status.loaded]
  );
  const isLoading = useCallback(
    (url: string) => status.loading.has(url),
    [status.loading]
  );
  const hasFailed = useCallback(
    (url: string) => status.failed.has(url),
    [status.failed]
  );

  return {
    preloadImage,
    preloadAroundIndex,
    isLoaded,
    isLoading,
    hasFailed,
    loadedCount: status.loaded.size,
    loadingCount: status.loading.size,
    failedCount: status.failed.size,
  };
}
