"use client";

import LocaleLink from "@/components/ui/LocaleLink";
import { useState } from "react";
import { Heart, Bookmark } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";
import { ContentCard } from "@/components/ui/ContentCard";
import { Lightbox } from "@/components/ui/Lightbox";

const UserDashboard: React.FC = () => {
  const { user } = useUser();
  const { likes, isLoading: likesLoading } = useLikes(true);
  const { bookmarks, isLoading: bookmarksLoading } = useBookmarks(true);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Get recent items (first 3)
  const recentLikes = likes.slice(0, 3);
  const recentBookmarks = bookmarks.slice(0, 3);

  // Get media items for lightbox from both sections
  const likesMediaItems = recentLikes
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
      createdAt: like.createdAt,
      updatedAt: like.createdAt,
    }));

  const bookmarksMediaItems = recentBookmarks
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

  const currentMediaItems = likesMediaItems; // Just use likes media items for the main lightbox

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const handleLightboxNext = () => {
    if (currentMediaIndex < currentMediaItems.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handleLightboxPrevious = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  // Helper functions to create items for ContentCard
  const createMediaFromInteraction = (interaction: any) => {
    if (interaction.targetType === "media") {
      return {
        id: interaction.targetId,
        albumId: interaction.target?.albumId || interaction.albumId || "",
        filename: interaction.target?.title || "",
        originalFilename: interaction.target?.title || "",
        mimeType: interaction.target?.mimeType || "image/jpeg",
        size: interaction.target?.size || 0,
        url: interaction.target?.url || "",
        thumbnailUrl: interaction.target?.thumbnailUrls?.medium || "",
        thumbnailUrls: interaction.target?.thumbnailUrls,
        createdAt: interaction.createdAt,
        updatedAt: interaction.createdAt,
      };
    }
    return null;
  };

  const createAlbumFromInteraction = (interaction: any) => {
    if (interaction.targetType === "album") {
      return {
        id: interaction.targetId,
        title: interaction.target?.title || `Album ${interaction.targetId}`,
        description: "",
        coverImageUrl: interaction.target?.coverImageUrl || "",
        thumbnailUrls: interaction.target?.thumbnailUrls,
        mediaCount: interaction.target?.mediaCount || 0,
        isPublic: false,
        tags: [],
        createdAt: interaction.createdAt,
        updatedAt: interaction.createdAt,
      };
    }
    return null;
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl border border-admin-primary/20 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back{user?.email ? `, ${user.email}` : ""}!
              </h1>
              <p className="text-muted-foreground">
                Here&apos;s your content activity overview
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-admin-primary">0</div>
                <div className="text-sm text-muted-foreground">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {likes.length}
                </div>
                <div className="text-sm text-muted-foreground">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {bookmarks.length}
                </div>
                <div className="text-sm text-muted-foreground">Bookmarks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Likes Section */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Recent Likes
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your recently liked content
                </p>
              </div>
            </div>
            <LocaleLink href="/user/likes">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </LocaleLink>
          </div>

          <div className="min-h-[200px]">
            {likesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden">
                      <div className="aspect-square bg-muted/50"></div>
                      {/* Only show skeleton text for albums, media cards are image-only */}
                      {i % 2 === 0 && (
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-muted/50 rounded w-3/4 mx-auto"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLikes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentLikes.map((like, index) => {
                  const media = createMediaFromInteraction(like);
                  const album = createAlbumFromInteraction(like);

                  return (
                    <ContentCard
                      key={index}
                      item={media || album!}
                      type={like.targetType as "media" | "album"}
                      mediaList={likesMediaItems}
                      canFullscreen={!album}
                      canAddToAlbum={!album}
                      className="aspect-square"
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No liked content yet. Start exploring!
              </p>
            )}
          </div>
        </div>

        {/* Recent Bookmarks Section */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Bookmark className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Recent Bookmarks
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your recently saved content
                </p>
              </div>
            </div>
            <LocaleLink href="/user/bookmarks">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </LocaleLink>
          </div>

          <div className="min-h-[200px]">
            {bookmarksLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden">
                      <div className="aspect-square bg-muted/50"></div>
                      {/* Only show skeleton text for albums, media cards are image-only */}
                      {i % 2 === 0 && (
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-muted/50 rounded w-3/4 mx-auto"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : recentBookmarks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentBookmarks.map((bookmark, index) => {
                  const media = createMediaFromInteraction(bookmark);
                  const album = createAlbumFromInteraction(bookmark);

                  return (
                    <ContentCard
                      key={index}
                      item={media || album!}
                      type={bookmark.targetType as "media" | "album"}
                      mediaList={bookmarksMediaItems}
                      canFullscreen={!album}
                      canAddToAlbum={!album}
                      className="aspect-square"
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No bookmarked content yet. Start saving your favorites!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for media items */}
      <Lightbox
        media={currentMediaItems}
        currentIndex={currentMediaIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
      />
    </>
  );
};

export default UserDashboard;
