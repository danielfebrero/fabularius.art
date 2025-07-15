"use client";

import { useState } from "react";
import { Heart, Search, Grid, List, Calendar, Image } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { composeAlbumCoverUrl } from "@/lib/urlUtils";

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
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
          {interaction.target?.coverImageUrl ? (
            <div className="aspect-video relative">
              <img
                src={composeAlbumCoverUrl(interaction.target.coverImageUrl)}
                alt={interaction.target.title || "Content"}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Heart className="h-5 w-5 text-red-500 fill-current drop-shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <Image className="h-12 w-12 text-gray-400" />
            </div>
          )}

          <div className="p-4">
            <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
              {interaction.target?.title ||
                `${interaction.targetType} ${interaction.targetId}`}
            </h3>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="capitalize">{interaction.targetType}</span>
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(interaction.createdAt)}
              </span>
            </div>
            {interaction.target?.mediaCount && (
              <div className="mt-2 text-xs text-gray-500">
                {interaction.target.mediaCount} items
              </div>
            )}
          </div>
        </div>
      );
    }

    // List view
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          {interaction.target?.coverImageUrl ? (
            <img
              src={composeAlbumCoverUrl(interaction.target.coverImageUrl)}
              alt={interaction.target.title || "Content"}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
              <Image className="h-6 w-6 text-gray-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {interaction.target?.title ||
                `${interaction.targetType} ${interaction.targetId}`}
            </h3>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span className="capitalize">{interaction.targetType}</span>
              {interaction.target?.mediaCount && (
                <span>{interaction.target.mediaCount} items</span>
              )}
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(interaction.createdAt)}
              </span>
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
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-red-500 mb-4">
          <Heart className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Failed to load likes</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Heart className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Liked Content</h1>
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {totalCount.toLocaleString()}
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your likes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="aspect-video bg-gray-200"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No matching likes found" : "No likes yet"}
          </h3>
          <p className="text-gray-600 mb-6">
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
