"use client";

import { AlbumGrid } from "./AlbumGrid";
import { useAlbums } from "@/hooks/useAlbums";
import { Album } from "@/types";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface DiscoverClientProps {
  initialAlbums: Album[];
  initialPagination: {
    hasNext: boolean;
    hasPrev: boolean;
    cursor: string | null;
    page?: number;
  } | null;
  initialError: string | null;
  initialTag?: string; // Add optional initialTag prop
}

export function DiscoverClient({
  initialAlbums,
  initialPagination,
  initialError,
  initialTag,
}: DiscoverClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tag = searchParams.get("tag") || initialTag || undefined;
  const prevTag = useRef<string | undefined>(tag);

  // For now, let's simplify: if we have a tag, always fetch fresh data
  // If no tag, use initial data
  const shouldUseInitialData = !tag && !initialTag;

  const { albums, loading, error, pagination, loadMore, refresh } = useAlbums({
    isPublic: true,
    limit: 12,
    tag, // Pass tag filter from URL
    initialAlbums: shouldUseInitialData ? initialAlbums : [], // Only use initial albums if no tag filtering
    initialPagination: shouldUseInitialData ? initialPagination : null, // Only use initial pagination if no tag filtering
  });

  // Force refresh when tag changes
  useEffect(() => {
    if (prevTag.current !== tag) {
      // Only refresh if this isn't the initial render and we actually have a previous value
      if (prevTag.current !== undefined || !shouldUseInitialData) {
        refresh();
      }
      prevTag.current = tag;
    }
  }, [tag, refresh, shouldUseInitialData]);

  // Use initial error if no albums were loaded initially
  const displayError =
    albums.length === 0 && initialError ? initialError : error;

  return (
    <div className="space-y-6">
      {tag && (
        <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl p-4 border border-admin-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-admin-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-foreground font-medium">
                  Filtering by tag:
                </span>
              </div>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-admin-primary text-admin-primary-foreground">
                {tag}
              </span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-admin-primary hover:text-admin-primary/80 transition-colors text-sm font-medium"
            >
              Clear filter
            </button>
          </div>
        </div>
      )}

      <AlbumGrid
        albums={albums}
        context="discover"
        loadMore={loadMore}
        loading={loading}
        hasMore={pagination?.hasNext || false}
        error={displayError}
      />
    </div>
  );
}
