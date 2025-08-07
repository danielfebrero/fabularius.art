import { Album } from "../types/index";
import { VirtualizedGrid } from "./ui/VirtualizedGrid";
import { ThumbnailContext } from "../types/index";
import { useLayoutEffect } from "react";
import { useTranslations } from "next-intl";
import { usePrefetchInteractionStatus } from "@/hooks/queries/useInteractionsQuery";

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
  loadMore,
  loading = false,
  hasMore = false,
  error = null,
}) => {
  const t = useTranslations("albumGrid");

  // Hook for bulk prefetching interaction status
  const { prefetch } = usePrefetchInteractionStatus();

  // Prefetch interaction status for all albums using useLayoutEffect
  // to ensure prefetch happens BEFORE child components render and make individual requests
  // Note: AlbumGrid receives all albums as props, so we prefetch all of them
  useLayoutEffect(() => {
    if (albums.length > 0) {
      const targets = albums.map((album) => ({
        targetType: "album" as const,
        targetId: album.id,
      }));

      // Prefetch all album interaction status
      prefetch(targets).catch((error) => {
        console.error("Failed to prefetch album interaction status:", error);
      });
    }
  }, [albums, prefetch]);

  return (
    <VirtualizedGrid
      items={albums.filter((album) => album && album.id)}
      itemType="album"
      className={className}
      viewMode="grid"
      isLoading={loading}
      hasNextPage={hasMore}
      isFetchingNextPage={loading}
      onLoadMore={loadMore}
      contentCardProps={{
        canLike: true,
        canBookmark: true,
        canFullscreen: false,
        canAddToAlbum: false,
        canDownload: false,
        canDelete: false,
      }}
      emptyState={{
        icon: (
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
        ),
        title: t("noAlbumsTitle"),
        description: t("noAlbumsDescription"),
      }}
      loadingState={{
        loadingText: t("loadingMore"),
        noMoreText: t("noMoreToLoad"),
      }}
      error={error}
      onRetry={loadMore}
    />
  );
};
