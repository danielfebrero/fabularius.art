"use client";

import { AlbumGrid } from "./AlbumGrid";
import { useAlbums } from "@/hooks/useAlbums";
import { Album } from "@/types";

interface DiscoverClientProps {
  initialAlbums: Album[];
  initialPagination: {
    hasNext: boolean;
    cursor: string | null;
  } | null;
  initialError: string | null;
}

export function DiscoverClient({
  initialAlbums,
  initialPagination,
  initialError,
}: DiscoverClientProps) {
  const { albums, loading, error, pagination, loadMore } = useAlbums({
    isPublic: true,
    limit: 12,
    initialAlbums,
    initialPagination,
  });

  // Use initial error if no albums were loaded initially
  const displayError =
    albums.length === 0 && initialError ? initialError : error;

  return (
    <AlbumGrid
      albums={albums}
      context="discover"
      loadMore={loadMore}
      loading={loading}
      hasMore={pagination?.hasNext || false}
      error={displayError}
    />
  );
}
