"use client";

import { useState } from "react";
import { Heart, Grid, List } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ContentCard } from "@/components/ui/ContentCard";
import { Lightbox } from "@/components/ui/Lightbox";

const UserLikesPage: React.FC = () => {
  const {
    likes,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    refresh,
    error,
  } = useLikes(true);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Get media items for lightbox (only media type likes)
  const mediaItems = likes
    .filter((like) => like.targetType === "media")
    .map((like) => ({
      id: like.targetId,
      albumId: like.target?.albumId || like.albumId || "",
      filename: like.target?.title || "",
      originalFilename: like.target?.title || "",
      mimeType: like.target?.mimeType || "image/jpeg",
      size: like.target?.size || 0,
      url: like.target?.url || "",
      thumbnailUrl: like.target?.thumbnailUrls?.medium || "",
      thumbnailUrls: like.target?.thumbnailUrls,
      viewCount: like.target?.viewCount || 0,
      createdAt: like.createdAt,
      updatedAt: like.createdAt,
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

  // Create media items for ContentCard from likes
  const createMediaFromLike = (like: any) => {
    if (like.targetType === "media") {
      return {
        id: like.targetId,
        albumId: like.target?.albumId || like.albumId || "",
        filename: like.target?.title || "",
        originalFilename: like.target?.title || "",
        mimeType: like.target?.mimeType || "image/jpeg",
        size: like.target?.size || 0,
        url: like.target?.url || "",
        thumbnailUrl: like.target?.thumbnailUrls?.medium || "",
        thumbnailUrls: like.target?.thumbnailUrls,
        viewCount: like.target?.viewCount || 0,
        createdAt: like.createdAt,
        updatedAt: like.createdAt,
      };
    }
    return null;
  };

  // Create album items for ContentCard from likes
  const createAlbumFromLike = (like: any) => {
    if (like.targetType === "album") {
      return {
        id: like.targetId,
        title: like.target?.title || `Album ${like.targetId}`,
        description: "",
        coverImageUrl: like.target?.coverImageUrl || "",
        thumbnailUrls: like.target?.thumbnailUrls,
        mediaCount: like.target?.mediaCount || 0,
        tags: [],
        isPublic: like.target?.isPublic || false,
        viewCount: like.target?.viewCount || 0,
        createdAt: like.createdAt,
        updatedAt: like.createdAt,
      };
    }
    return null;
  };

  if (error) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-8 text-center">
        <div className="text-red-500 mb-4">
          <Heart className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium text-foreground">
            Failed to load likes
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
        <div className="bg-gradient-to-r from-red-500/10 to-admin-secondary/10 rounded-xl border border-red-500/20 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-admin-secondary rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Likes</h1>
                <p className="text-muted-foreground">Your liked content</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-red-500/20 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-full">
                {totalCount.toLocaleString()} likes
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
        ) : likes.length > 0 ? (
          <div className="space-y-6">
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              )}
            >
              {likes.map((like, index) => {
                const media = createMediaFromLike(like);
                const album = createAlbumFromLike(like);

                return (
                  <ContentCard
                    key={`${like.targetId}-${index}`}
                    item={media || album!}
                    type={like.targetType as "media" | "album"}
                    mediaList={mediaItems}
                    canFullscreen={!album}
                    canAddToAlbum={!album}
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
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {"No likes yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {"Start exploring content and like what you enjoy!"}
            </p>
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

export default UserLikesPage;
