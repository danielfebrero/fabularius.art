import { Album } from "../types/index";
import { ContentCard } from "./ui/ContentCard";
import { cn } from "../lib/utils";
import { ThumbnailContext } from "../types/index";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ComponentErrorBoundary } from "./ErrorBoundaries";

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
  context = "discover",
  loadMore,
  loading = false,
  hasMore = false,
  error = null,
}) => {
  const t = useTranslations("albumGrid");
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px 0px",
  });

  useEffect(() => {
    if (inView && hasMore && !loading && loadMore) {
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
            {t("noAlbumsTitle")}
          </h3>
          <p className="text-muted-foreground">{t("noAlbumsDescription")}</p>
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
          <ComponentErrorBoundary
            key={album.id}
            context={`Album Card (${album.id})`}
          >
            <ContentCard
              key={album.id}
              item={album}
              type="album"
              aspectRatio="square"
              canLike={true}
              canBookmark={true}
              canFullscreen={false}
              canAddToAlbum={false}
              canDownload={false}
              canDelete={false}
            />
          </ComponentErrorBoundary>
        ))}
      </div>

      {/* Infinite scroll loading states */}
      {albums.length > 0 && (
        <div className="text-center py-8">
          {error ? (
            <div className="space-y-4">
              <p className="text-red-500">
                {t("errorLoading")} {error}
              </p>
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {t("tryAgain")}
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="text-muted-foreground">{t("loadingMore")}</p>
            </div>
          ) : hasMore ? (
            <div ref={ref} className="h-4" aria-hidden="true" />
          ) : albums.length > 0 ? (
            <p className="text-muted-foreground">{t("noMoreToLoad")}</p>
          ) : null}
        </div>
      )}
    </div>
  );
};
