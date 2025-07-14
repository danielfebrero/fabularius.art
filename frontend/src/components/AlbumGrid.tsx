"use client";

import { Album } from "../types/index";
import { AlbumCard } from "./ui/AlbumCard";
import { cn } from "../lib/utils";
import { ThumbnailContext } from "../types/index";

interface AlbumGridProps {
  albums: Album[];
  className?: string;
  context?: ThumbnailContext;
}

export const AlbumGrid: React.FC<AlbumGridProps> = ({
  albums,
  className,
  context = "homepage",
}) => {
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
    </div>
  );
};
