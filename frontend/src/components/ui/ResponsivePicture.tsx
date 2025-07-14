import React from "react";
import { cn } from "../../lib/utils";
import { ThumbnailUrls, ThumbnailContext } from "../../types/index";

interface ResponsivePictureProps {
  thumbnailUrls?: ThumbnailUrls;
  fallbackUrl: string;
  alt: string;
  className?: string;
  context?: ThumbnailContext;
  columns?: number;
  loading?: "lazy" | "eager";
  onClick?: () => void;
}

/**
 * Generate responsive picture sources based on context and screen breakpoints
 * Mobile-first approach: defaults to xlarge (600px) for best mobile experience
 */
function generatePictureSources(
  thumbnailUrls: ThumbnailUrls | undefined,
  context: ThumbnailContext = "default",
  columns?: number
): Array<{ media: string; srcSet: string }> {
  if (!thumbnailUrls) return [];

  const sources: Array<{ media: string; srcSet: string }> = [];

  // Context-specific responsive strategy
  switch (context) {
    case "homepage":
      // Homepage: Mobile-first with xlarge default
      if (thumbnailUrls.medium) {
        sources.push({
          media: "(min-width: 1280px)",
          srcSet: thumbnailUrls.medium, // 300px for very large screens
        });
      }
      if (thumbnailUrls.large) {
        sources.push({
          media: "(min-width: 1024px)",
          srcSet: thumbnailUrls.large, // 365px for large screens
        });
      }
      // Mobile/tablet gets xlarge (600px) as default
      break;

    case "albums":
      // Albums: Adaptive to grid density
      if (columns && columns >= 6 && thumbnailUrls.small) {
        sources.push({
          media: "(min-width: 1280px)",
          srcSet: thumbnailUrls.small, // 240px for dense grids
        });
      } else if (thumbnailUrls.medium) {
        sources.push({
          media: "(min-width: 1280px)",
          srcSet: thumbnailUrls.medium, // 300px for normal grids
        });
      }
      if (thumbnailUrls.large) {
        sources.push({
          media: "(min-width: 1536px)",
          srcSet: thumbnailUrls.large, // 365px for very large screens
        });
      }
      if (thumbnailUrls.medium) {
        sources.push({
          media: "(min-width: 1024px)",
          srcSet: thumbnailUrls.medium, // 300px for large screens
        });
      }
      // Mobile/tablet gets xlarge (600px) as default
      break;

    case "admin":
      // Admin: Content-dense approach
      if (thumbnailUrls.small) {
        sources.push({
          media: "(min-width: 1024px)",
          srcSet: thumbnailUrls.small, // 240px for large admin screens
        });
      }
      if (thumbnailUrls.medium) {
        sources.push({
          media: "(min-width: 768px)",
          srcSet: thumbnailUrls.medium, // 300px for medium screens
        });
      }
      // Mobile gets large (365px) for admin readability
      break;

    case "cover-selector":
      // Cover selector always uses cover size
      return thumbnailUrls.cover
        ? [{ media: "", srcSet: thumbnailUrls.cover }]
        : [];

    default:
      // Default responsive behavior
      if (thumbnailUrls.small) {
        sources.push({
          media: "(min-width: 1280px)",
          srcSet: thumbnailUrls.small, // 240px for very large screens
        });
      }
      if (thumbnailUrls.medium) {
        sources.push({
          media: "(min-width: 1024px)",
          srcSet: thumbnailUrls.medium, // 300px for large screens
        });
      }
      if (thumbnailUrls.large) {
        sources.push({
          media: "(min-width: 768px)",
          srcSet: thumbnailUrls.large, // 365px for medium screens
        });
      }
      // Mobile gets xlarge (600px) as default
      break;
  }

  return sources;
}

/**
 * Get the optimal default image source (mobile-first)
 * This is used as the fallback <img> src and ensures mobile users get optimal images
 */
function getDefaultImageSrc(
  thumbnailUrls: ThumbnailUrls | undefined,
  fallbackUrl: string,
  context: ThumbnailContext = "default"
): string {
  if (!thumbnailUrls) return fallbackUrl;

  // Mobile-first defaults by context
  switch (context) {
    case "cover-selector":
      return thumbnailUrls.cover || fallbackUrl;

    case "admin":
      // Admin prioritizes smaller thumbnails for performance
      return (
        thumbnailUrls.small ||
        thumbnailUrls.medium ||
        thumbnailUrls.large ||
        thumbnailUrls.xlarge ||
        fallbackUrl
      );

    case "homepage":
    case "albums":
    default:
      // Homepage and albums use xlarge (600px) for mobile - best quality
      return (
        thumbnailUrls.xlarge ||
        thumbnailUrls.large ||
        thumbnailUrls.medium ||
        fallbackUrl
      );
  }
}

export const ResponsivePicture: React.FC<ResponsivePictureProps> = ({
  thumbnailUrls,
  fallbackUrl,
  alt,
  className,
  context = "default",
  columns,
  loading = "lazy",
  onClick,
}) => {
  const sources = generatePictureSources(thumbnailUrls, context, columns);
  const defaultSrc = getDefaultImageSrc(thumbnailUrls, fallbackUrl, context);

  // If no responsive sources available, fall back to simple img
  if (sources.length === 0) {
    return (
      <img
        src={defaultSrc}
        alt={alt}
        className={className}
        loading={loading}
        onClick={onClick}
      />
    );
  }

  return (
    <picture onClick={onClick}>
      {sources.map((source, index) => (
        <source key={index} media={source.media} srcSet={source.srcSet} />
      ))}
      <img src={defaultSrc} alt={alt} className={className} loading={loading} />
    </picture>
  );
};

export default ResponsivePicture;
