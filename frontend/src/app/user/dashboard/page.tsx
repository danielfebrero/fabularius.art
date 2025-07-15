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
      <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {value.toLocaleString()}
            </p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </Link>
  );

  const ContentItem = ({ interaction }: { interaction: any }) => (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      {(interaction.target?.thumbnailUrls ||
        interaction.target?.coverImageUrl) && (
        <img
          src={getBestThumbnailUrl(
            composeThumbnailUrls(interaction.target.thumbnailUrls),
            composeAlbumCoverUrl(interaction.target.coverImageUrl),
            "small"
          )}
          alt={interaction.target.title || "Content"}
          className="w-12 h-12 object-cover rounded-md"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {interaction.target?.title ||
            `${interaction.targetType} ${interaction.targetId}`}
        </p>
        <p className="text-xs text-gray-500 flex items-center mt-1">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(interaction.createdAt)}
        </p>
      </div>
      <div className="flex-shrink-0">
        {interaction.interactionType === "like" ? (
          <Heart className="h-4 w-4 text-red-500 fill-current" />
        ) : (
          <Bookmark className="h-4 w-4 text-blue-500 fill-current" />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || user?.username || user?.email}!
        </h1>
        <p className="text-gray-600">
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          Here's an overview of your activity and saved content.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Liked Content"
          value={likesCount}
          icon={Heart}
          color="bg-red-500"
          href="/user/likes"
        />
        <StatCard
          title="Bookmarked Content"
          value={bookmarksCount}
          icon={Bookmark}
          color="bg-blue-500"
          href="/user/bookmarks"
        />
        <StatCard
          title="Profile Views"
          value={0}
          icon={Eye}
          color="bg-green-500"
          href="/user/dashboard"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Likes */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Heart className="h-5 w-5 text-red-500 mr-2" />
              Recent Likes
            </h2>
            <Link href="/user/likes">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {likesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
            <p className="text-gray-500 text-center py-8">
              No liked content yet. Start exploring!
            </p>
          )}
        </div>

        {/* Recent Bookmarks */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bookmark className="h-5 w-5 text-blue-500 mr-2" />
              Recent Bookmarks
            </h2>
            <Link href="/user/bookmarks">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {bookmarksLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
            <p className="text-gray-500 text-center py-8">
              No bookmarked content yet. Start saving your favorites!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
