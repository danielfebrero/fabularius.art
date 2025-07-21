"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Bookmark, Eye, Calendar } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";
import {
  composeAlbumCoverUrl,
  getBestThumbnailUrl,
  composeThumbnailUrls,
} from "@/lib/urlUtils";

const UserDashboard: React.FC = () => {
  const { user } = useUser();
  const {
    likes,
    totalCount: likesCount,
    isLoading: likesLoading,
  } = useLikes(true);
  const {
    bookmarks,
    totalCount: bookmarksCount,
    isLoading: bookmarksLoading,
  } = useBookmarks(true);

  // Get recent items (first 3)
  const recentLikes = likes.slice(0, 3);
  const recentBookmarks = bookmarks.slice(0, 3);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    href,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    href: string;
  }) => (
    <Link href={href}>
      <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-6 hover:shadow-xl hover:border-admin-primary/30 transition-all duration-300 cursor-pointer group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground group-hover:text-admin-primary transition-colors">
              {value.toLocaleString()}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </Link>
  );

  const ContentItem = ({ interaction }: { interaction: any }) => (
    <div className="flex items-center space-x-4 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-admin-primary/5 hover:border-admin-primary/20 transition-all duration-200">
      {(interaction.target?.thumbnailUrls ||
        interaction.target?.coverImageUrl) && (
        <img
          src={getBestThumbnailUrl(
            composeThumbnailUrls(interaction.target.thumbnailUrls),
            composeAlbumCoverUrl(interaction.target.coverImageUrl),
            "small"
          )}
          alt={interaction.target.title || "Content"}
          className="w-12 h-12 object-cover rounded-lg shadow-sm"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {interaction.target?.title ||
            `${interaction.targetType} ${interaction.targetId}`}
        </p>
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(interaction.createdAt)}
        </p>
      </div>
      <div className="flex-shrink-0">
        {interaction.interactionType === "like" ? (
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <Bookmark className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl border border-admin-primary/20 shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
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
            <h2 className="text-xl font-bold text-foreground">Artist Insights</h2>
            <p className="text-sm text-muted-foreground">Track your content performance</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Likes Received"
            value={likesCount}
            icon={Heart}
            color="bg-gradient-to-br from-red-500 to-pink-500"
            href="/user/likes"
          />
          <StatCard
            title="Bookmarked Content"
            value={bookmarksCount}
            icon={Bookmark}
            color="bg-gradient-to-br from-blue-500 to-indigo-500"
            href="/user/bookmarks"
          />
          <StatCard
            title="Profile Views"
            value={0}
            icon={Eye}
            color="bg-gradient-to-br from-green-500 to-emerald-500"
            href="/user/dashboard"
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
            <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">Your latest interactions</p>
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
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                  View All
                </Button>
              </Link>
            </div>

            {likesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                      <div className="w-12 h-12 bg-muted rounded-md"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLikes.length > 0 ? (
              <div className="space-y-3">
                {recentLikes.map((like, index) => (
                  <ContentItem key={index} interaction={like} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No liked content yet. Start exploring!
              </p>
            )}
          </div>
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
              <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50">
                View All
              </Button>
            </Link>
          </div>

          {bookmarksLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                    <div className="w-12 h-12 bg-muted rounded-md"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentBookmarks.length > 0 ? (
            <div className="space-y-3">
              {recentBookmarks.map((bookmark, index) => (
                <ContentItem key={index} interaction={bookmark} />
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
  );
};

export default UserDashboard;
