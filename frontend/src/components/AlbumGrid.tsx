"use client";

import { Album } from "../types/index";
import { AlbumCard } from "./ui/AlbumCard";
import { cn } from "../lib/utils";
import { ThumbnailContext } from "../types/index";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { useUserInteractionStatus } from "@/hooks/useUserInteractionStatus";

interface AlbumGridProps {
  albums: Album[];
  className?: string;
  context?: ThumbnailContext;
  loadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  error?: string | null;
}

export const AlbumGrid: React.FC<AlbumGridProps> = ({
  albums,
  className,
  context = "homepage",
  loadMore,
  loading = false,
  hasMore = false,
  error = null,
}) => {
  const { preloadStatuses } = useUserInteractionStatus();
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px 0px",
  });

  // Preload interaction statuses when albums change
  useEffect(() => {
    if (albums.length > 0) {
      const targets = albums.map((album) => ({
        targetType: "album" as const,
        targetId: album.id,
      }));
      preloadStatuses(targets).catch(console.error);
    }
  }, [albums, preloadStatuses]);

  // Log props on render for debugging
  useEffect(() => {
    console.log("[AlbumGrid] albums.length", albums.length, {
      loading,
      hasMore,
      error,
    });
  }, [albums, loading, hasMore, error]);

  useEffect(() => {
    if (inView && hasMore && !loading && loadMore) {
      console.log("[AlbumGrid] loadMore triggered");
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore]);
  if (albums.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 mx-auto text-muted-foreground mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No albums found
          </h3>
          <p className="text-muted-foreground">
            There are no public albums to display at the moment.
          </p>
        </div>
      </div>
    );
  }

  // Determine column count based on grid classes for responsive picture optimization
  const getColumnCount = (): number => {
    // Default grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
    // This helps ResponsivePicture make optimal size decisions
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width >= 1280) return 4; // xl:grid-cols-4
      if (width >= 1024) return 3; // lg:grid-cols-3
      if (width >= 640) return 2; // sm:grid-cols-2
      return 1; // grid-cols-1
    }
    // SSR fallback - assume medium layout
    return 3;
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            context={context}
            columns={getColumnCount()}
          />
        ))}
      </div>

      {/* Infinite scroll loading states */}
      {albums.length > 0 && (
        <div className="text-center py-8">
          {error ? (
            <div className="space-y-4">
              <p className="text-red-500">Error loading more albums: {error}</p>
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="text-gray-500">Loading more albums...</p>
            </div>
          ) : hasMore ? (
            <div ref={ref} className="h-4" aria-hidden="true" />
          ) : albums.length > 0 ? (
            <p className="text-gray-500">No more albums to load</p>
          ) : null}
        </div>
      )}
    </div>
  );
};
