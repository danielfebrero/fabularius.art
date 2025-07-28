"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { UserPlanBadge } from "@/components/UserPlanBadge";
import LocaleLink from "@/components/ui/LocaleLink";
import { ContentCard } from "@/components/ui/ContentCard";
import { Media, Album } from "@/types";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  Camera,
  Heart,
  Bookmark,
  Image as ImageIcon,
  FolderOpen,
  Eye,
  MapPin,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileUser {
  userId: string;
  email: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: string;
  lastLoginAt?: string;
  plan?: string;
  role?: string;
}

interface ProfileComponentProps {
  user: ProfileUser;
  isOwner?: boolean; // Whether the current user is viewing their own profile
  loading?: boolean;
}

export default function ProfileComponent({
  user,
  isOwner = false,
  loading = false,
}: ProfileComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    location: "",
    website: "",
  });

  const t = useTranslations("common");

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-24 h-24 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initialize form data when user is available and editing starts
  const handleEditStart = () => {
    setFormData({
      username: user.username || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    // Placeholder - would call API to update profile
    console.log("Saving profile:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      username: "",
      bio: "",
      location: "",
      website: "",
    });
  };

  const displayName = user.username || user.email.split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase();

  // Mock data for content - in real app, this would be passed as props or fetched
  const mockData = {
    insights: {
      likesReceived: 1247,
      contentBookmarked: 89,
      totalMediaViews: 15632,
      profileViews: 324,
      totalUploads: 156,
      totalAlbums: 23,
    },
    recentLikes: [
      {
        id: "media1",
        filename: "beautiful-sunset.jpg",
        originalName: "Beautiful Sunset",
        mimeType: "image/jpeg",
        size: 2048000,
        width: 1920,
        height: 1080,
        url: "/media/media1/beautiful-sunset.jpg",
        thumbnailUrls: {
          cover:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_cover.webp",
          small:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_small.webp",
          medium:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_medium.webp",
          large:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_large.webp",
          xlarge:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_xlarge.webp",
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likeCount: 42,
        viewCount: 156,
        title: "Beautiful Sunset",
      } as Media,
      {
        id: "album2",
        title: "Nature Collection",
        isPublic: true,
        mediaCount: 12,
        coverImageUrl: "/albums/album2/cover/nature-collection-cover.jpg",
        thumbnailUrls: {
          cover:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_cover.webp",
          small:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_small.webp",
          medium:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_medium.webp",
          large:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_large.webp",
          xlarge:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_xlarge.webp",
        },
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        likeCount: 89,
        viewCount: 234,
      } as Album,
      {
        id: "media3",
        filename: "city-lights.jpg",
        originalName: "City Lights",
        mimeType: "image/jpeg",
        size: 1856000,
        width: 1600,
        height: 900,
        url: "/media/media3/city-lights.jpg",
        thumbnailUrls: {
          cover:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_cover.webp",
          small:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_small.webp",
          medium:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_medium.webp",
          large:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_large.webp",
          xlarge:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_xlarge.webp",
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        likeCount: 78,
        viewCount: 198,
        title: "City Lights",
      } as Media,
    ],
    recentGeneratedMedias: [
      {
        id: "media4",
        filename: "my-latest-shot.jpg",
        originalName: "My Latest Shot",
        mimeType: "image/jpeg",
        size: 3024000,
        width: 2560,
        height: 1440,
        url: "/media/media4/my-latest-shot.jpg",
        thumbnailUrls: {
          cover:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_cover.webp",
          small:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_small.webp",
          medium:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_medium.webp",
          large:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_large.webp",
          xlarge:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_xlarge.webp",
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        likeCount: 23,
        viewCount: 87,
        title: "My Latest Shot",
      } as Media,
      {
        id: "media6",
        filename: "street-photography.jpg",
        originalName: "Street Photography",
        mimeType: "image/jpeg",
        size: 2256000,
        width: 1800,
        height: 1200,
        url: "/media/media6/street-photography.jpg",
        thumbnailUrls: {
          cover:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_cover.webp",
          small:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_small.webp",
          medium:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_medium.webp",
          large:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_large.webp",
          xlarge:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_xlarge.webp",
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        likeCount: 67,
        viewCount: 145,
        title: "Street Photography",
      } as Media,
      {
        id: "media7",
        filename: "ai-generated-art.jpg",
        originalName: "AI Generated Art",
        mimeType: "image/jpeg",
        size: 1856000,
        width: 1600,
        height: 900,
        url: "/media/media7/ai-generated-art.jpg",
        thumbnailUrls: {
          cover:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_cover.webp",
          small:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_small.webp",
          medium:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_medium.webp",
          large:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_large.webp",
          xlarge:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_xlarge.webp",
        },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        likeCount: 45,
        viewCount: 123,
        title: "AI Generated Art",
      } as Media,
    ],
    recentAlbums: [
      {
        id: "album7",
        title: "Urban Exploration",
        isPublic: true,
        mediaCount: 12,
        coverImageUrl: "/albums/album7/cover/urban-exploration-cover.jpg",
        thumbnailUrls: {
          cover:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_cover.webp",
          small:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_small.webp",
          medium:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_medium.webp",
          large:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_large.webp",
          xlarge:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_xlarge.webp",
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        likeCount: 92,
        viewCount: 287,
      } as Album,
      {
        id: "album8",
        title: "Portrait Series",
        isPublic: true,
        mediaCount: 8,
        coverImageUrl: "/albums/album8/cover/portrait-series-cover.jpg",
        thumbnailUrls: {
          cover:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_cover.webp",
          small:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_small.webp",
          medium:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_medium.webp",
          large:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_large.webp",
          xlarge:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_xlarge.webp",
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        likeCount: 156,
        viewCount: 456,
      } as Album,
      {
        id: "album9",
        title: "Travel Memories",
        isPublic: true,
        mediaCount: 24,
        coverImageUrl: "/albums/album9/cover/travel-memories-cover.jpg",
        thumbnailUrls: {
          cover:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_cover.webp",
          small:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_small.webp",
          medium:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_medium.webp",
          large:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_large.webp",
          xlarge:
            "/albums/57cbfb3a-178d-47be-996f-286ee0917ca3/cover/thumbnails/cover_thumb_xlarge.webp",
        },
        createdAt: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(), // 2 weeks ago
        updatedAt: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        likeCount: 203,
        viewCount: 789,
      } as Album,
    ],
    recentComments: [
      {
        id: "comment1",
        content: "Amazing composition and lighting!",
        contentTitle: "Sunset Beach",
        timestamp: "5 hours ago",
        targetType: "media",
        targetId: "media1",
      },
      {
        id: "comment2",
        content: "Love the colors in this series.",
        contentTitle: "Abstract Art",
        timestamp: "1 day ago",
        targetType: "album",
        targetId: "album2",
      },
      {
        id: "comment3",
        content: "Great perspective on urban life.",
        contentTitle: "City Streets",
        timestamp: "2 days ago",
        targetType: "media",
        targetId: "media3",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Header Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar Section */}
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-lg">
                    {initials}
                  </div>
                  {isOwner && isEditing && (
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {isOwner && isEditing ? (
                        <div className="space-y-4">
                          <Input
                            label="Username"
                            value={formData.username}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                username: e.target.value,
                              }))
                            }
                            placeholder="Enter username"
                            className="text-lg font-semibold"
                          />
                          <Input
                            label="Bio"
                            value={formData.bio}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                bio: e.target.value,
                              }))
                            }
                            placeholder="Tell us about yourself"
                            className="text-sm"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Location"
                              value={formData.location}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  location: e.target.value,
                                }))
                              }
                              placeholder="City, Country"
                              className="text-sm"
                            />
                            <Input
                              label="Website"
                              value={formData.website}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  website: e.target.value,
                                }))
                              }
                              placeholder="https://yoursite.com"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                              {displayName}
                            </h1>
                            <UserPlanBadge />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Joined{" "}
                                {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {user.lastLoginAt && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="w-4 h-4" />
                                <span>
                                  Last active{" "}
                                  {new Date(
                                    user.lastLoginAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            {/* User Information */}
                            <div className="mt-4 space-y-2">
                              {/* Location - only show if user has location */}
                              {user.location && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-foreground">
                                    {user.location}
                                  </span>
                                </div>
                              )}

                              {/* Website - only show if user has website */}
                              {user.website && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Globe className="w-4 h-4 text-muted-foreground" />
                                  <a
                                    href={
                                      user.website.startsWith("http")
                                        ? user.website
                                        : `https://${user.website}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {user.website}
                                  </a>
                                </div>
                              )}

                              {/* Bio - moved after location and website */}
                              <div>
                                {user.bio ? (
                                  <p className="text-sm text-foreground">
                                    {user.bio}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">
                                    {isOwner
                                      ? "No bio yet. Add one by editing your profile!"
                                      : "This user hasn't added a bio yet."}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Only show for profile owner */}
                    {isOwner && (
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              onClick={handleSave}
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              {t("save")}
                            </Button>
                            <Button
                              onClick={handleCancel}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              {t("cancel")}
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={handleEditStart}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            {t("edit")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Content Insights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                icon: Heart,
                label: "Likes Received",
                value: mockData.insights.likesReceived,
                color: "text-red-600",
              },
              {
                icon: Bookmark,
                label: "Content Bookmarked",
                value: mockData.insights.contentBookmarked,
                color: "text-purple-600",
              },
              {
                icon: Eye,
                label: "Total Media Views",
                value: mockData.insights.totalMediaViews,
                color: "text-blue-600",
              },
              {
                icon: User,
                label: "Profile Views",
                value: mockData.insights.profileViews,
                color: "text-green-600",
              },
              {
                icon: ImageIcon,
                label: "Total Uploads",
                value: mockData.insights.totalUploads,
                color: "text-orange-600",
              },
              {
                icon: FolderOpen,
                label: "Total Albums",
                value: mockData.insights.totalAlbums,
                color: "text-indigo-600",
              },
            ].map((insight, index) => (
              <Card
                key={index}
                className="border-border/50 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
                  <insight.icon className={cn("w-8 h-8 mb-2", insight.color)} />
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {insight.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground leading-tight">
                    {insight.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Last Liked Content */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Last Liked Content
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {mockData.recentLikes.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      type={"filename" in item ? "media" : "album"}
                      canLike={false}
                      canBookmark={false}
                      canFullscreen={false}
                      canAddToAlbum={false}
                      showCounts={false}
                      showTags={false}
                    />
                  ))}
                </div>
                <div className="text-center pt-4">
                  <LocaleLink href={`/profile/${displayName}/likes`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      View All Liked Content
                    </Button>
                  </LocaleLink>
                </div>
              </CardContent>
            </Card>

            {/* Last Generated Medias */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Last Generated Medias
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {mockData.recentGeneratedMedias.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      type={"filename" in item ? "media" : "album"}
                      canLike={false}
                      canBookmark={false}
                      canFullscreen={false}
                      canAddToAlbum={false}
                      showCounts={false}
                      showTags={false}
                    />
                  ))}
                </div>
                <div className="text-center pt-4">
                  <LocaleLink href={`/profile/${displayName}/media`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      View All Generated Medias
                    </Button>
                  </LocaleLink>
                </div>
              </CardContent>
            </Card>

            {/* Last Created Albums */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-green-500" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Last Created Albums
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {mockData.recentAlbums.map((album) => (
                    <ContentCard
                      key={album.id}
                      item={album}
                      type="album"
                      canLike={false}
                      canBookmark={false}
                      canFullscreen={false}
                      canAddToAlbum={false}
                      showCounts={false}
                      showTags={false}
                    />
                  ))}
                </div>
                <div className="text-center pt-4">
                  <LocaleLink href={`/profile/${displayName}/albums`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      View All Albums
                    </Button>
                  </LocaleLink>
                </div>
              </CardContent>
            </Card>

            {/* Last Comments */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-500" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Last Comments
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockData.recentComments.map((comment) => (
                    <LocaleLink
                      key={comment.id}
                      href={
                        comment.targetType === "media"
                          ? `/media/${comment.targetId}`
                          : `/albums/${comment.targetId}`
                      }
                    >
                      <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">
                              &ldquo;{comment.content}&rdquo;
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              On &ldquo;{comment.contentTitle}&rdquo; •{" "}
                              {comment.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    </LocaleLink>
                  ))}
                  <div className="text-center pt-2">
                    <LocaleLink href={`/profile/${displayName}/comments`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View All Comments
                      </Button>
                    </LocaleLink>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
