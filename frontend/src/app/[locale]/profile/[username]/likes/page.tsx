"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Heart, Grid, List, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ContentCard } from "@/components/ui/ContentCard";
import { Lightbox } from "@/components/ui/Lightbox";
import LocaleLink from "@/components/ui/LocaleLink";
import { cn } from "@/lib/utils";
import { Media, Album } from "@/types";

interface PublicUser {
  userId: string;
  email: string;
  username?: string;
  createdAt: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
}

interface LikeItem {
  id: string;
  targetId: string;
  targetType: "media" | "album";
  createdAt: string;
  target?: Media | Album;
}

export default function UserLikesPage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [likes, setLikes] = useState<LikeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const displayName = user?.username || user?.email?.split("@")[0] || username;
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
  const createMediaFromLike = (like: LikeItem) => {
    if (like.targetType === "media" && like.target) {
      return like.target as Media;
    }
    return null;
  };

  // Create album items for ContentCard from likes
  const createAlbumFromLike = (like: LikeItem) => {
    if (like.targetType === "album" && like.target) {
      return like.target as Album;
    }
    return null;
  };

  // Fetch user profile and likes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mock user data (in real app, this would be fetched from API)
        const mockUser: PublicUser = {
          userId: `user_${username}`,
          email: `${username}@example.com`,
          username: username,
          createdAt: "2024-01-15T10:30:00Z",
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: "2024-12-20T14:22:00Z",
        };

        // Mock likes data (in real app, this would be fetched from userApi.getUserLikes())
        const mockLikes: LikeItem[] = [
          {
            id: "like1",
            targetId: "media1",
            targetType: "media",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            target: {
              id: "media1",
              filename: "sunset-landscape.jpg",
              originalFilename: "Beautiful Sunset Landscape",
              mimeType: "image/jpeg",
              size: 2048000,
              width: 1920,
              height: 1080,
              url: "/media/media1/sunset-landscape.jpg",
              thumbnailUrls: {
                originalSize:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
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
                Date.now() - 2 * 60 * 60 * 1000
              ).toISOString(),
              updatedAt: new Date(
                Date.now() - 2 * 60 * 60 * 1000
              ).toISOString(),
              likeCount: 89,
              viewCount: 234,
            } as Media,
          },
          {
            id: "like2",
            targetId: "album1",
            targetType: "album",
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
            target: {
              id: "album1",
              title: "Nature Photography Collection",
              isPublic: true,
              mediaCount: 15,
              coverImageUrl: "/albums/album1/cover/nature-collection-cover.jpg",
              thumbnailUrls: {
                cover:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_cover.webp",
                small:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_small.webp",
                medium:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_medium.webp",
                large:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_large.webp",
                xlarge:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_xlarge.webp",
              },
              createdAt: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000
              ).toISOString(), // 3 days ago
              updatedAt: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000
              ).toISOString(),
              likeCount: 156,
              viewCount: 542,
              tags: ["nature", "landscape", "photography"],
            } as Album,
          },
          {
            id: "like3",
            targetId: "media2",
            targetType: "media",
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            target: {
              id: "media2",
              filename: "urban-street-art.jpg",
              originalFilename: "Urban Street Art",
              mimeType: "image/jpeg",
              size: 1856000,
              width: 1600,
              height: 900,
              url: "/media/media2/urban-street-art.jpg",
              thumbnailUrls: {
                originalSize:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
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
                Date.now() - 24 * 60 * 60 * 1000
              ).toISOString(),
              updatedAt: new Date(
                Date.now() - 24 * 60 * 60 * 1000
              ).toISOString(),
              likeCount: 67,
              viewCount: 145,
            } as Media,
          },
          {
            id: "like4",
            targetId: "album2",
            targetType: "album",
            createdAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(), // 2 days ago
            target: {
              id: "album2",
              title: "Portrait Sessions 2024",
              isPublic: true,
              mediaCount: 23,
              coverImageUrl: "/albums/album2/cover/portraits-2024-cover.jpg",
              thumbnailUrls: {
                cover:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_cover.webp",
                small:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_small.webp",
                medium:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_medium.webp",
                large:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_large.webp",
                xlarge:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_xlarge.webp",
              },
              createdAt: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toISOString(), // 1 week ago
              updatedAt: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
              likeCount: 98,
              viewCount: 312,
              tags: ["portrait", "photography", "studio"],
            } as Album,
          },
          {
            id: "like5",
            targetId: "media3",
            targetType: "media",
            createdAt: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(), // 3 days ago
            target: {
              id: "media3",
              filename: "abstract-composition.jpg",
              originalFilename: "Abstract Digital Composition",
              mimeType: "image/jpeg",
              size: 2256000,
              width: 1800,
              height: 1200,
              url: "/media/media3/abstract-composition.jpg",
              thumbnailUrls: {
                originalSize:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
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
                Date.now() - 3 * 24 * 60 * 60 * 1000
              ).toISOString(),
              updatedAt: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000
              ).toISOString(),
              likeCount: 123,
              viewCount: 287,
            } as Media,
          },
          {
            id: "like6",
            targetId: "media4",
            targetType: "media",
            createdAt: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000
            ).toISOString(), // 5 days ago
            target: {
              id: "media4",
              filename: "minimalist-architecture.jpg",
              originalFilename: "Minimalist Architecture Study",
              mimeType: "image/jpeg",
              size: 1956000,
              width: 1600,
              height: 1200,
              url: "/media/media4/minimalist-architecture.jpg",
              thumbnailUrls: {
                originalSize:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
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
                Date.now() - 5 * 24 * 60 * 60 * 1000
              ).toISOString(),
              updatedAt: new Date(
                Date.now() - 5 * 24 * 60 * 60 * 1000
              ).toISOString(),
              likeCount: 78,
              viewCount: 189,
            } as Media,
          },
          {
            id: "like7",
            targetId: "album3",
            targetType: "album",
            createdAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1 week ago
            target: {
              id: "album3",
              title: "Travel Memories Collection",
              isPublic: true,
              mediaCount: 42,
              coverImageUrl: "/albums/album3/cover/travel-memories-cover.jpg",
              thumbnailUrls: {
                cover:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_cover.webp",
                small:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_small.webp",
                medium:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_medium.webp",
                large:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_large.webp",
                xlarge:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_xlarge.webp",
              },
              createdAt: new Date(
                Date.now() - 14 * 24 * 60 * 60 * 1000
              ).toISOString(), // 2 weeks ago
              updatedAt: new Date(
                Date.now() - 14 * 24 * 60 * 60 * 1000
              ).toISOString(),
              likeCount: 234,
              viewCount: 689,
              tags: ["travel", "memories", "adventure"],
            } as Album,
          },
          {
            id: "like8",
            targetId: "media5",
            targetType: "media",
            createdAt: new Date(
              Date.now() - 10 * 24 * 60 * 60 * 1000
            ).toISOString(), // 10 days ago
            target: {
              id: "media5",
              filename: "golden-hour-portrait.jpg",
              originalFilename: "Golden Hour Portrait Session",
              mimeType: "image/jpeg",
              size: 2456000,
              width: 2000,
              height: 1333,
              url: "/media/media5/golden-hour-portrait.jpg",
              thumbnailUrls: {
                originalSize:
                  "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
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
                Date.now() - 10 * 24 * 60 * 60 * 1000
              ).toISOString(),
              updatedAt: new Date(
                Date.now() - 10 * 24 * 60 * 60 * 1000
              ).toISOString(),
              likeCount: 145,
              viewCount: 367,
            } as Media,
          },
        ];

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setUser(mockUser);
        setLikes(mockLikes);
      } catch (err) {
        console.error("Error fetching user likes:", err);
        setError("Failed to load user likes");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchData();
    }
  }, [username]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Likes not found
          </h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                        key={like.id}
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
                        onFullscreen={() => {
                          if (like.targetType === "media" && mediaIndex >= 0) {
                            setCurrentMediaIndex(mediaIndex);
                            setLightboxOpen(true);
                          }
                        }}
                      />
                    );
                  })}
                </div>

                {/* Future pagination placeholder */}
                {likes.length >= 12 && (
                  <div className="text-center pt-6">
                    <Button variant="outline" disabled>
                      Load More Likes
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
