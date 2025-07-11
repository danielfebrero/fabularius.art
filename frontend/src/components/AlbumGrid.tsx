import React from "react";
import { Album } from "../types/index";
import { AlbumCard } from "./ui/AlbumCard";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface AlbumGridProps {
  albums: Album[];
  loading?: boolean;
  error?: string | null;
  pagination?: {
    hasNext: boolean;
    cursor: string | null;
  } | null;
  onLoadMore?: () => void;
  onAlbumClick?: (album: Album) => void;
  className?: string;
}

export const AlbumGrid: React.FC<AlbumGridProps> = ({
  albums,
  loading = false,
  error = null,
  pagination = null,
  onLoadMore,
  onAlbumClick,
  className,
}) => {
  // Loading state
  if (loading && albums.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-muted rounded-lg overflow-hidden">
                <div className="aspect-square bg-muted-foreground/20" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Something went wrong
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
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

  return (
    <div className={cn("space-y-6", className)}>
      {/* Albums Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {albums.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => onAlbumClick?.(album)}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {loading && albums.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <svg
              className="w-4 h-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading more albums...</span>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {pagination?.hasNext && !loading && onLoadMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onLoadMore} className="px-8">
            Load More Albums
          </Button>
        </div>
      )}

      {/* Pagination Info */}
      {albums.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {albums.length} albums
        </div>
      )}
    </div>
  );
};
