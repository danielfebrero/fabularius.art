"use client";

import { useState } from "react";
import {
  Bookmark,
  Search,
  Grid,
  List,
  Calendar,
  Image,
  FolderOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { composeAlbumCoverUrl, composeThumbnailUrls } from "@/lib/urlUtils";
import ResponsivePicture from "@/components/ui/ResponsivePicture";
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
  const router = useRouter();

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

  const handleCardClick = (interaction: any) => {
    if (interaction.targetType === "media") {
      // Show lightbox for media
      const mediaIndex = mediaItems.findIndex(
        (item) => item.id === interaction.targetId
      );
      if (mediaIndex !== -1) {
        setCurrentMediaIndex(mediaIndex);
        setLightboxOpen(true);
      }
    } else {
      // Navigate to album for albums
      router.push(`/albums/${interaction.targetId}`);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ContentCard = ({ interaction }: { interaction: any }) => {
    if (viewMode === "grid") {
      // Square cards for user bookmarks page
      if (interaction.targetType === "media") {
        // Media cards: show only image (square)
        return (
          <div
            className="group relative cursor-pointer overflow-hidden rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] aspect-square"
            onClick={() => handleCardClick(interaction)}
          >
            {interaction.target?.thumbnailUrls ? (
              <ResponsivePicture
                thumbnailUrls={composeThumbnailUrls(
                  interaction.target.thumbnailUrls
                )}
                fallbackUrl={composeAlbumCoverUrl(
                  interaction.target.coverImageUrl
                )}
                alt={interaction.target.title || "Content"}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                context="albums"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                <Image className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute top-2 right-2">
              <Bookmark className="h-5 w-5 text-blue-500 fill-current drop-shadow-lg" />
            </div>
          </div>
        );
      } else {
        // Album cards: show image and title only (square)
        return (
          <div
            className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden hover:shadow-xl hover:border-admin-primary/20 transition-all duration-300 cursor-pointer"
            onClick={() => handleCardClick(interaction)}
          >
            {interaction.target?.thumbnailUrls ||
            interaction.target?.coverImageUrl ? (
              <div className="aspect-square relative">
                <ResponsivePicture
                  thumbnailUrls={composeThumbnailUrls(
                    interaction.target.thumbnailUrls
                  )}
                  fallbackUrl={composeAlbumCoverUrl(
                    interaction.target.coverImageUrl
                  )}
                  alt={interaction.target.title || "Content"}
                  className="w-full h-full object-cover"
                  context="albums"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <Bookmark className="h-5 w-5 text-blue-500 fill-current drop-shadow-lg" />
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-muted/50 flex items-center justify-center relative">
                <Image className="h-12 w-12 text-muted-foreground" />
                <div className="absolute top-2 right-2">
                  <Bookmark className="h-5 w-5 text-blue-500 fill-current drop-shadow-lg" />
                </div>
              </div>
            )}

            <div className="p-4">
              <h3 className="font-medium text-foreground line-clamp-2 text-center">
                {interaction.target?.title || `Album ${interaction.targetId}`}
              </h3>
            </div>
          </div>
        );
      }
    }

    // List view
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-4 hover:shadow-xl hover:border-admin-primary/20 transition-all duration-300">
        <div className="flex items-center space-x-4">
          {interaction.target?.thumbnailUrls ||
          interaction.target?.coverImageUrl ? (
            <ResponsivePicture
              thumbnailUrls={composeThumbnailUrls(
                interaction.target.thumbnailUrls
              )}
              fallbackUrl={composeAlbumCoverUrl(
                interaction.target.coverImageUrl
              )}
              alt={interaction.target.title || "Content"}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              context="admin"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Image className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {interaction.targetType === "album" ? (
              <>
                <h3 className="font-medium text-foreground truncate mb-1">
                  {interaction.target?.title || `Album ${interaction.targetId}`}
                </h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-blue-600">
                      <FolderOpen className="h-3 w-3" />
                      <span className="font-medium">Album</span>
                    </div>
                    {interaction.target?.mediaCount && (
                      <span>{interaction.target.mediaCount} items</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(interaction.createdAt)}
                </div>
              </>
            ) : (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(interaction.createdAt)}
                {interaction.target?.albumTitle && (
                  <span className="ml-2 text-xs">
                    from {interaction.target.albumTitle}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <Bookmark className="h-5 w-5 text-blue-500 fill-current" />
          </div>
        </div>
      </div>
    );
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
                  My Bookmarks
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
              {filteredBookmarks.map((bookmark, index) => (
                <ContentCard
                  key={`${bookmark.targetId}-${index}`}
                  interaction={bookmark}
                />
              ))}
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
