"use client";

import { AlbumGrid } from "./AlbumGrid";
import { useAlbums } from "@/hooks/useAlbums";
import { Album } from "@/types";

interface HomepageClientProps {
  initialAlbums: Album[];
  initialPagination: {
    hasNext: boolean;
    hasPrev: boolean;
    cursor: string | null;
    page?: number;
  } | null;
  initialError: string | null;
}

export function HomepageClient({
  initialAlbums,
  initialPagination,
  initialError,
}: HomepageClientProps) {
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
      context="homepage"
      loadMore={loadMore}
      loading={loading}
      hasMore={pagination?.hasNext || false}
      error={displayError}
    />
  );
}
