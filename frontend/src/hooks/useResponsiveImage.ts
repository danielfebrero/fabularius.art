import { useState, useEffect } from "react";
import { ThumbnailUrls, ThumbnailContext, ThumbnailSize } from "../types/index";

/**
 * Hook to manage responsive image selection and updates
 * Provides utilities for handling mobile-first responsive images
 */
export function useResponsiveImage(
  thumbnailUrls: ThumbnailUrls | undefined,
  fallbackUrl: string,
  context: ThumbnailContext = "default"
) {
  const [selectedSize, setSelectedSize] = useState<ThumbnailSize | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(fallbackUrl);

  // Update current URL when thumbnails or context change
  useEffect(() => {
    if (!thumbnailUrls) {
      setCurrentUrl(fallbackUrl);
      return;
    }

    // Mobile-first: Default to xlarge for best mobile experience
    let optimalSize: ThumbnailSize;

    switch (context) {
      case "cover-selector":
        optimalSize = "cover";
        break;
      case "admin":
        optimalSize = "large"; // Better readability for admin
        break;
      case "discover":
      case "albums":
      default:
        optimalSize = "xlarge"; // 600px - optimal for mobile
        break;
    }

    const url =
      thumbnailUrls[optimalSize] ||
      thumbnailUrls.medium ||
      thumbnailUrls.small ||
      thumbnailUrls.large ||
      thumbnailUrls.xlarge ||
      thumbnailUrls.cover ||
      fallbackUrl;

    setCurrentUrl(url);
    setSelectedSize(optimalSize);
  }, [thumbnailUrls, fallbackUrl, context]);

  return {
    currentUrl,
    selectedSize,
    availableSizes: thumbnailUrls
      ? (Object.keys(thumbnailUrls) as ThumbnailSize[])
      : [],
    hasResponsiveSources:
      thumbnailUrls && Object.keys(thumbnailUrls).length > 1,
  };
}

/**
 * Hook to detect screen size changes for responsive image optimization
 * Returns current breakpoint for use in responsive image selection
 */
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<
    "sm" | "md" | "lg" | "xl" | "2xl"
  >("lg");

  useEffect(() => {
    const updateScreenSize = () => {
      if (typeof window === "undefined") return;

      const width = window.innerWidth;
      if (width < 640) setScreenSize("sm");
      else if (width < 768) setScreenSize("md");
      else if (width < 1024) setScreenSize("lg");
      else if (width < 1280) setScreenSize("xl");
      else setScreenSize("2xl");
    };

    // Initial check
    updateScreenSize();

    // Listen for resize events with throttling
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenSize, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return screenSize;
}

/**
 * Hook for preloading responsive images
 * Useful for critical images that should load quickly
 */
export function useImagePreloader(urls: string[]) {
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const preloadImage = (url: string) => {
    if (loaded.has(url) || loading.has(url)) return;

    setLoading((prev) => new Set(prev).add(url));

    const img = new Image();
    img.onload = () => {
      setLoaded((prev) => new Set(prev).add(url));
      setLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    };
    img.onerror = () => {
      setLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    };
    img.src = url;
  };

  const preloadAll = () => {
    urls.forEach(preloadImage);
  };

  return {
    preloadImage,
    preloadAll,
    isLoaded: (url: string) => loaded.has(url),
    isLoading: (url: string) => loading.has(url),
  };
}
