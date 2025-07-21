"use client";

import { useState } from "react";
import { Heart, Search, Grid, List, Calendar, Image } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { composeAlbumCoverUrl, composeThumbnailUrls } from "@/lib/urlUtils";
import ResponsivePicture from "@/components/ui/ResponsivePicture";

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
  const [searchTerm, setSearchTerm] = useState("");

  // Filter likes based on search term
  const filteredLikes = likes.filter(
    (like) =>
      like.target?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      like.targetId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      return (
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden hover:shadow-xl hover:border-admin-primary/30 transition-all duration-300">
          {interaction.target?.thumbnailUrls ||
          interaction.target?.coverImageUrl ? (
            <div className="aspect-video relative">
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
                <Heart className="h-5 w-5 text-red-500 fill-current drop-shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted/50 flex items-center justify-center">
              <Image className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          <div className="p-4">
            <h3 className="font-medium text-foreground line-clamp-2 mb-2">
              {interaction.target?.title ||
                `${interaction.targetType} ${interaction.targetId}`}
            </h3>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="capitalize">{interaction.targetType}</span>
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(interaction.createdAt)}
              </span>
            </div>
            {interaction.target?.mediaCount && (
              <div className="mt-2 text-xs text-muted-foreground">
                {interaction.target.mediaCount} items
              </div>
            )}
          </div>
        </div>
      );
    }

    // List view
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-4 hover:shadow-xl hover:border-admin-primary/30 transition-all duration-300">
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
              context="albums"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Image className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate mb-1">
              {interaction.target?.title ||
                `${interaction.targetType} ${interaction.targetId}`}
            </h3>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="capitalize">{interaction.targetType}</span>
              {interaction.target?.mediaCount && (
                <span>{interaction.target.mediaCount} items</span>
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(interaction.createdAt)}
            </div>
          </div>

          <div className="flex-shrink-0">
            <Heart className="h-5 w-5 text-red-500 fill-current" />
          </div>
        </div>
      </div>
    );
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-admin-accent/10 to-admin-primary/10 rounded-xl border border-admin-accent/20 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Liked Content
              </h1>
              <p className="text-muted-foreground">
                Your favorite content collection
              </p>
            </div>
            <span className="bg-red-500/20 text-red-400 text-sm font-semibold px-3 py-1.5 rounded-full">
              {totalCount.toLocaleString()} likes
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={
                viewMode === "grid"
                  ? "bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                  : ""
              }
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                  : ""
              }
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
            placeholder="Search your likes..."
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
                <div className="bg-card/60 rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden">
                  <div className="aspect-video bg-muted/50"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                    <div className="h-3 bg-muted/50 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="bg-card/60 rounded-xl shadow-lg border border-admin-primary/10 p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted/50 rounded-lg"></div>
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
      ) : filteredLikes.length > 0 ? (
        <div className="space-y-6">
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}
          >
            {filteredLikes.map((like, index) => (
              <ContentCard
                key={`${like.targetId}-${index}`}
                interaction={like}
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
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm ? "No matching likes found" : "No likes yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm
              ? `Try adjusting your search for "${searchTerm}"`
              : "Start exploring content and like what interests you!"}
          </p>
          {searchTerm && (
            <Button onClick={() => setSearchTerm("")} variant="outline">
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserLikesPage;
