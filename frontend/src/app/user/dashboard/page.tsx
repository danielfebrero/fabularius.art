"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Bookmark, Eye, Calendar, Image } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useInsights } from "@/hooks/useInsights";
import { useUser } from "@/hooks/useUser";
import { useTargetInteractionStatus } from "@/hooks/useUserInteractionStatus";
import { Button } from "@/components/ui/Button";
import ResponsivePicture from "@/components/ui/ResponsivePicture";
import { Lightbox } from "@/components/ui/Lightbox";
import {
  composeAlbumCoverUrl,
  composeThumbnailUrls,
  composeMediaUrl,
} from "@/lib/urlUtils";

const UserDashboard: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const { insights } = useInsights();
  const { likes, isLoading: likesLoading } = useLikes(true);
  const { bookmarks, isLoading: bookmarksLoading } = useBookmarks(true);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  // Get recent items (first 3)
  const recentLikes = likes.slice(0, 3);
  const recentBookmarks = bookmarks.slice(0, 3);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
  }) => (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-6 hover:shadow-xl hover:border-admin-primary/30 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground group-hover:text-admin-primary transition-colors">
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const handleCardClick = (interaction: any) => {
    if (interaction.targetType === "media") {
      // Show lightbox for media
      const media = {
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

      setSelectedMedia(media);
      setLightboxOpen(true);
    } else {
      // Navigate to album for albums
      router.push(`/albums/${interaction.targetId}`);
    }
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const ContentCard = ({ interaction }: { interaction: any }) => {
    const { userLiked, userBookmarked } = useTargetInteractionStatus(
      interaction.targetType,
      interaction.targetId
    );

    // Determine if this item is currently liked/bookmarked by the user
    const isCurrentlyLiked = userLiked;
    const isCurrentlyBookmarked = userBookmarked;

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
              fallbackUrl={composeMediaUrl(interaction.target?.url || "")}
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
          <div className="absolute top-2 right-2 flex gap-1">
            {/* Show current status with visual indicators */}
            {isCurrentlyLiked && (
              <Heart className="h-4 w-4 text-red-500 fill-current drop-shadow-lg" />
            )}
            {isCurrentlyBookmarked && (
              <Bookmark className="h-4 w-4 text-blue-500 fill-current drop-shadow-lg" />
            )}
            {/* If this is from user's interactions, also show the original interaction type */}
            {!isCurrentlyLiked && interaction.interactionType === "like" && (
              <Heart className="h-4 w-4 text-red-300 drop-shadow-lg opacity-50" />
            )}
            {!isCurrentlyBookmarked &&
              interaction.interactionType === "bookmark" && (
                <Bookmark className="h-4 w-4 text-blue-300 drop-shadow-lg opacity-50" />
              )}
          </div>
        </div>
      );
    } else {
      // Album cards: show image and title only (square)
      return (
        <div
          className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden hover:shadow-xl hover:border-admin-primary/30 transition-all duration-300 cursor-pointer"
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
              <div className="absolute top-2 right-2 flex gap-1">
                {/* Show current status with visual indicators */}
                {isCurrentlyLiked && (
                  <Heart className="h-4 w-4 text-red-500 fill-current drop-shadow-lg" />
                )}
                {isCurrentlyBookmarked && (
                  <Bookmark className="h-4 w-4 text-blue-500 fill-current drop-shadow-lg" />
                )}
                {/* If this is from user's interactions, also show the original interaction type */}
                {!isCurrentlyLiked &&
                  interaction.interactionType === "like" && (
                    <Heart className="h-4 w-4 text-red-300 drop-shadow-lg opacity-50" />
                  )}
                {!isCurrentlyBookmarked &&
                  interaction.interactionType === "bookmark" && (
                    <Bookmark className="h-4 w-4 text-blue-300 drop-shadow-lg opacity-50" />
                  )}
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-muted/50 flex items-center justify-center relative">
              <Image className="h-12 w-12 text-muted-foreground" />
              <div className="absolute top-2 right-2 flex gap-1">
                {/* Show current status with visual indicators */}
                {isCurrentlyLiked && (
                  <Heart className="h-4 w-4 text-red-500 fill-current drop-shadow-lg" />
                )}
                {isCurrentlyBookmarked && (
                  <Bookmark className="h-4 w-4 text-blue-500 fill-current drop-shadow-lg" />
                )}
                {/* If this is from user's interactions, also show the original interaction type */}
                {!isCurrentlyLiked &&
                  interaction.interactionType === "like" && (
                    <Heart className="h-4 w-4 text-red-300 drop-shadow-lg opacity-50" />
                  )}
                {!isCurrentlyBookmarked &&
                  interaction.interactionType === "bookmark" && (
                    <Bookmark className="h-4 w-4 text-blue-300 drop-shadow-lg opacity-50" />
                  )}
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
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl border border-admin-primary/20 shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user?.username?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase() ||
                "U"}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.username || user?.email}!
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s an overview of your activity and content performance.
            </p>
          </div>
        </div>
      </div>

      {/* Artist Insights */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Artist Insights
            </h2>
            <p className="text-sm text-muted-foreground">
              Track your content performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Likes Received"
            value={insights.totalLikesReceived}
            icon={Heart}
            color="bg-gradient-to-br from-red-500 to-pink-500"
          />
          <StatCard
            title="Bookmarked Content"
            value={insights.totalBookmarksReceived}
            icon={Bookmark}
            color="bg-gradient-to-br from-blue-500 to-indigo-500"
          />
          <StatCard
            title="Profile Views"
            value={0}
            icon={Eye}
            color="bg-gradient-to-br from-green-500 to-emerald-500"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-admin-accent to-admin-primary rounded-lg flex items-center justify-center">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Recent Activity
            </h2>
            <p className="text-sm text-muted-foreground">
              Your latest interactions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Likes */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-red-500/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                Recent Likes
              </h3>
              <Link href="/user/likes">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  View All
                </Button>
              </Link>
            </div>

            {likesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-card/60 rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden">
                      <div className="aspect-square bg-muted/50"></div>
                      {/* Only show skeleton text for albums (simulate every other) */}
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
                {recentLikes.map((like, index) => (
                  <ContentCard key={index} interaction={like} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No liked content yet. Start exploring!
              </p>
            )}
          </div>

          {/* Recent Bookmarks */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-500/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                  <Bookmark className="h-4 w-4 text-white" />
                </div>
                Recent Bookmarks
              </h3>
              <Link href="/user/bookmarks">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                >
                  View All
                </Button>
              </Link>
            </div>

            {bookmarksLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-card/60 rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden">
                      <div className="aspect-square bg-muted/50"></div>
                      {/* Only show skeleton text for albums (simulate every other) */}
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
                {recentBookmarks.map((bookmark, index) => (
                  <ContentCard key={index} interaction={bookmark} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No bookmarked content yet. Start saving your favorites!
              </p>
            )}
          </div>
        </div>
      </div>

      {lightboxOpen && selectedMedia && (
        <Lightbox
          isOpen={lightboxOpen}
          onClose={handleLightboxClose}
          media={[selectedMedia]}
          currentIndex={0}
          onNext={() => {}}
          onPrevious={() => {}}
        />
      )}
    </div>
  );
};

export default UserDashboard;
