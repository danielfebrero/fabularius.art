"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ImageIcon, Grid, List, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ContentCard } from "@/components/ui/ContentCard";
import { Lightbox } from "@/components/ui/Lightbox";
import LocaleLink from "@/components/ui/LocaleLink";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Media } from "@/types";

interface PublicUser {
  userId: string;
  email: string;
  username?: string;
  createdAt: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
}

export default function UserMediaPage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const isMobile = useIsMobile();

  const displayName = user?.username || user?.email?.split("@")[0] || username;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Lightbox handlers
  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const handleLightboxNext = () => {
    if (currentMediaIndex < media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handleLightboxPrevious = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  // Fetch user profile and media
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

        // Mock media data (in real app, this would be fetched from mediaApi.getUserMedia())
        const mockMedia: Media[] = [
          {
            id: "media1",
            filename: "beautiful-sunset.jpg",
            originalFilename: "Beautiful Sunset",
            mimeType: "image/jpeg",
            size: 2048000,
            width: 1920,
            height: 1080,
            url: "/media/media1/beautiful-sunset.jpg",
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
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            likeCount: 42,
            viewCount: 156,
          },
          {
            id: "media2",
            filename: "city-lights.jpg",
            originalFilename: "City Lights",
            mimeType: "image/jpeg",
            size: 1856000,
            width: 1600,
            height: 900,
            url: "/media/media2/city-lights.jpg",
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
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            likeCount: 78,
            viewCount: 198,
          },
          {
            id: "media3",
            filename: "my-latest-shot.jpg",
            originalFilename: "My Latest Shot",
            mimeType: "image/jpeg",
            size: 3024000,
            width: 2560,
            height: 1440,
            url: "/media/media3/my-latest-shot.jpg",
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
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            likeCount: 23,
            viewCount: 87,
          },
          {
            id: "media4",
            filename: "street-photography.jpg",
            originalFilename: "Street Photography",
            mimeType: "image/jpeg",
            size: 2256000,
            width: 1800,
            height: 1200,
            url: "/media/media4/street-photography.jpg",
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
            ).toISOString(), // 3 days ago
            updatedAt: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 67,
            viewCount: 145,
          },
          {
            id: "media5",
            filename: "ai-generated-art.jpg",
            originalFilename: "AI Generated Art",
            mimeType: "image/jpeg",
            size: 1856000,
            width: 1600,
            height: 900,
            url: "/media/media5/ai-generated-art.jpg",
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
              Date.now() - 4 * 24 * 60 * 60 * 1000
            ).toISOString(), // 4 days ago
            updatedAt: new Date(
              Date.now() - 4 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 45,
            viewCount: 123,
          },
          {
            id: "media6",
            filename: "nature-landscape.jpg",
            originalFilename: "Nature Landscape",
            mimeType: "image/jpeg",
            size: 2856000,
            width: 2400,
            height: 1600,
            url: "/media/media6/nature-landscape.jpg",
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
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1 week ago
            updatedAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 89,
            viewCount: 234,
          },
          {
            id: "media7",
            filename: "portrait-session.jpg",
            originalFilename: "Portrait Session",
            mimeType: "image/jpeg",
            size: 1756000,
            width: 1400,
            height: 1800,
            url: "/media/media7/portrait-session.jpg",
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
            ).toISOString(), // 10 days ago
            updatedAt: new Date(
              Date.now() - 10 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 156,
            viewCount: 423,
          },
          {
            id: "media8",
            filename: "architectural-details.jpg",
            originalFilename: "Architectural Details",
            mimeType: "image/jpeg",
            size: 2456000,
            width: 2000,
            height: 1333,
            url: "/media/media8/architectural-details.jpg",
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
              Date.now() - 14 * 24 * 60 * 60 * 1000
            ).toISOString(), // 2 weeks ago
            updatedAt: new Date(
              Date.now() - 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 72,
            viewCount: 189,
          },
        ];

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setUser(mockUser);
        setMedia(mockMedia);
      } catch (err) {
        console.error("Error fetching user media:", err);
        setError("Failed to load user media");
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
        <div className="max-w-4xl mx-auto md:px-4 sm:px-6 lg:px-8 md:py-8">
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

            {/* Media grid skeleton */}
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
            Media not found
          </h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto md:px-4 sm:px-6 lg:px-8 md:py-8">
        <div className="space-y-6">
          {/* Header */}
          <Card
            className="border-border/50 shadow-lg"
            hideBorder={isMobile}
            hideMargin={isMobile}
          >
            <CardHeader className={cn("pb-4", isMobile && "p-0")}>
              {isMobile ? (
                // Mobile layout - simplified design
                <div className="flex items-center gap-3">
                  <LocaleLink href={`/profile/${displayName}`}>
                    <Button variant="ghost" size="sm" className="p-2">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </LocaleLink>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <h1 className="text-lg font-bold text-foreground">
                      {displayName}&apos;s Media
                    </h1>
                  </div>
                </div>
              ) : (
                // Desktop layout - original horizontal design
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
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                      <h1 className="text-2xl font-bold text-foreground">
                        {displayName}&apos;s Media
                      </h1>
                    </div>
                    <p className="text-muted-foreground">
                      {media.length} {media.length === 1 ? "image" : "images"}
                    </p>
                  </div>

                  {/* View mode toggle - only on desktop */}
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
              )}
            </CardHeader>
          </Card>

          {/* Media content */}
          {media.length === 0 ? (
            <Card
              className="border-border/50"
              hideBorder={isMobile}
              hideMargin={isMobile}
            >
              <CardContent className="py-12 text-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No media yet
                </h3>
                <p className="text-muted-foreground">
                  {displayName} hasn&apos;t uploaded or generated any media yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card
              className="border-border/50"
              hideBorder={isMobile}
              hideMargin={isMobile}
            >
              <CardContent hidePadding={isMobile}>
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  )}
                >
                  {media.map((mediaItem, index) => (
                    <ContentCard
                      key={mediaItem.id}
                      item={mediaItem}
                      type="media"
                      canFullscreen={true}
                      canAddToAlbum={false}
                      canLike={true}
                      canBookmark={true}
                      showTags={false}
                      showCounts={true}
                      aspectRatio={viewMode === "grid" ? "square" : "auto"}
                      preferredThumbnailSize={
                        viewMode === "grid" ? undefined : "originalSize"
                      }
                      mediaList={media}
                      currentIndex={index}
                    />
                  ))}
                </div>

                {/* Future pagination placeholder */}
                {media.length >= 12 && (
                  <div className="text-center pt-6">
                    <Button variant="outline" disabled>
                      Load More Media
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
        media={media}
        currentIndex={currentMediaIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
      />
    </div>
  );
}
