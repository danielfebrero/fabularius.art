"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Heart, Grid, List, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ContentCard } from "@/components/ui/ContentCard";
import { Lightbox } from "@/components/ui/Lightbox";
import LocaleLink from "@/components/ui/LocaleLink";
import { useLikes } from "@/hooks/useLikes";
import { cn } from "@/lib/utils";
import { Media, Album } from "@/types";

export default function UserLikesPage() {
  const params = useParams();
  const username = params.username as string;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Use the custom hook to fetch likes data
  const {
    likes,
    isLoading: likesLoading,
    error: likesError,
    hasMore: hasNext,
    loadMore,
    isLoadingMore: loadingMore,
  } = useLikes({ user: username, limit: 20 });

  const displayName = username;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Get media items for lightbox (only media type likes)
  const mediaItems = likes
    .filter((like) => like.targetType === "media")
    .map((like) => like.target as Media)
    .filter(Boolean);

  // Lightbox handlers
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
  const createMediaFromLike = (like: (typeof likes)[0]) => {
    if (like.targetType === "media" && like.target) {
      return like.target as Media;
    }
    return null;
  };

  // Create album items for ContentCard from likes
  const createAlbumFromLike = (like: (typeof likes)[0]) => {
    if (like.targetType === "album" && like.target) {
      return like.target as Album;
    }
    return null;
  };

  // Loading state
  if (likesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto md:px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </div>

            {/* Likes grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <div className="aspect-square bg-muted"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (likesError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Error loading likes
          </h2>
          <p className="text-muted-foreground mt-2">{likesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto md:px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                {/* Back button */}
                <LocaleLink href={`/profile/${displayName}`}>
                  <Button variant="ghost" size="sm" className="p-2">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </LocaleLink>

                {/* User avatar and info */}
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <h1 className="text-2xl font-bold text-foreground">
                      {displayName}&apos;s Likes
                    </h1>
                  </div>
                  <p className="text-muted-foreground">
                    {likes.length} {likes.length === 1 ? "like" : "likes"} •
                    Liked content
                  </p>
                </div>

                {/* View mode toggle */}
                <div className="flex bg-muted/50 rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="px-3 py-1.5"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="px-3 py-1.5"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Likes content */}
          {likes.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No likes yet
                </h3>
                <p className="text-muted-foreground">
                  {displayName} hasn&apos;t liked any content yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  )}
                >
                  {likes.map((like) => {
                    const media = createMediaFromLike(like);
                    const album = createAlbumFromLike(like);
                    const item = media || album;

                    if (!item) return null;

                    const mediaIndex = mediaItems.findIndex(
                      (m) => m.id === like.targetId
                    );

                    return (
                      <ContentCard
                        key={`${like.userId}_${like.targetId}_${like.createdAt}`}
                        item={item}
                        type={like.targetType}
                        canFullscreen={like.targetType === "media"}
                        canAddToAlbum={like.targetType === "media"}
                        canLike={true}
                        canBookmark={true}
                        showTags={false}
                        showCounts={true}
                        aspectRatio={viewMode === "grid" ? "square" : "auto"}
                        preferredThumbnailSize={
                          viewMode === "grid" ? undefined : "originalSize"
                        }
                        mediaList={
                          like.targetType === "media" ? mediaItems : undefined
                        }
                        currentIndex={mediaIndex >= 0 ? mediaIndex : undefined}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {hasNext && (
                  <div className="text-center pt-6">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Loading..." : "Load More Likes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lightbox for media viewing */}
      <Lightbox
        media={mediaItems}
        currentIndex={currentMediaIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
      />
    </div>
  );
}
