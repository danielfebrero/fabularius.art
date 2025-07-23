"use client";

import { useState } from "react";
import { Bookmark, Search, Grid, List } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ContentCard } from "@/components/ui/ContentCard";
import { Lightbox } from "@/components/ui/Lightbox";

const UserBookmarksPage: React.FC = () => {
  const {
    bookmarks,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    refresh,
    error,
  } = useBookmarks(true);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Filter bookmarks based on search term
  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.target?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      bookmark.targetId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get media items for lightbox (only media type bookmarks)
  const mediaItems = filteredBookmarks
    .filter((bookmark) => bookmark.targetType === "media")
    .map((bookmark) => ({
      id: bookmark.targetId,
      albumId: bookmark.target?.albumId || bookmark.albumId || "",
      filename: bookmark.target?.title || "",
      originalFilename: bookmark.target?.title || "",
      mimeType: bookmark.target?.mimeType || "image/jpeg",
      size: bookmark.target?.size || 0,
      url: bookmark.target?.url || "",
      thumbnailUrl: bookmark.target?.thumbnailUrls?.medium || "",
      thumbnailUrls: bookmark.target?.thumbnailUrls,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.createdAt,
    }));

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const handleLightboxNext = () => {
    if (currentMediaIndex < mediaItems.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handleLightboxPrevious = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  // Create media items for ContentCard from bookmarks
  const createMediaFromBookmark = (bookmark: any) => {
    if (bookmark.targetType === "media") {
      return {
        id: bookmark.targetId,
        albumId: bookmark.target?.albumId || bookmark.albumId || "",
        filename: bookmark.target?.title || "",
        originalFilename: bookmark.target?.title || "",
        mimeType: bookmark.target?.mimeType || "image/jpeg",
        size: bookmark.target?.size || 0,
        url: bookmark.target?.url || "",
        thumbnailUrl: bookmark.target?.thumbnailUrls?.medium || "",
        thumbnailUrls: bookmark.target?.thumbnailUrls,
        createdAt: bookmark.createdAt,
        updatedAt: bookmark.createdAt,
      };
    }
    return null;
  };

  // Create album items for ContentCard from bookmarks
  const createAlbumFromBookmark = (bookmark: any) => {
    if (bookmark.targetType === "album") {
      return {
        id: bookmark.targetId,
        title: bookmark.target?.title || `Album ${bookmark.targetId}`,
        description: "",
        coverImageUrl: bookmark.target?.coverImageUrl || "",
        thumbnailUrls: bookmark.target?.thumbnailUrls,
        mediaCount: bookmark.target?.mediaCount || 0,
        tags: [],
        isPublic: bookmark.target?.isPublic || false,
        createdAt: bookmark.createdAt,
        updatedAt: bookmark.createdAt,
      };
    }
    return null;
  };

  if (error) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-8 text-center">
        <div className="text-admin-primary mb-4">
          <Bookmark className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium text-foreground">
            Failed to load bookmarks
          </p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={refresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-admin-secondary/10 rounded-xl border border-blue-500/20 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-admin-secondary rounded-lg flex items-center justify-center">
                <Bookmark className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Bookmarks
                </h1>
                <p className="text-muted-foreground">Your saved favorites</p>
              </div>
              <span className="bg-blue-500/20 text-blue-600 text-sm font-semibold px-3 py-1.5 rounded-full">
                {totalCount.toLocaleString()} bookmarks
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-admin-primary/60" />
            <input
              type="text"
              placeholder="Search your bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card/50 border border-admin-primary/20 rounded-lg focus:ring-2 focus:ring-admin-primary/30 focus:border-admin-primary/50 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}
          >
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                {viewMode === "grid" ? (
                  <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden">
                    <div className="aspect-square bg-muted/50"></div>
                    {/* Only show skeleton text for albums, media cards are image-only */}
                    {i % 2 === 0 && (
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted/50 rounded w-3/4 mx-auto"></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-muted/50 rounded-md"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                        <div className="h-3 bg-muted/50 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : filteredBookmarks.length > 0 ? (
          <div className="space-y-6">
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              )}
            >
              {filteredBookmarks.map((bookmark, index) => {
                const media = createMediaFromBookmark(bookmark);
                const album = createAlbumFromBookmark(bookmark);

                return (
                  <ContentCard
                    key={`${bookmark.targetId}-${index}`}
                    item={media || album!}
                    type={bookmark.targetType as "media" | "album"}
                    mediaList={mediaItems}
                    canBookmark={false} // Don't show bookmark button since these are already bookmarked
                    className={
                      viewMode === "grid" ? "aspect-square" : undefined
                    }
                  />
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center">
                <Button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  variant="outline"
                  size="lg"
                >
                  {isLoadingMore ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-12 text-center">
            <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? "No matching bookmarks found" : "No bookmarks yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? `Try adjusting your search for "${searchTerm}"`
                : "Start exploring content and bookmark what you want to save for later!"}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")} variant="outline">
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox for media items */}
      <Lightbox
        media={mediaItems}
        currentIndex={currentMediaIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
      />
    </>
  );
};

export default UserBookmarksPage;
