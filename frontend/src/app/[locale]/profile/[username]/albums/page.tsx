"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FolderOpen, Grid, List, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ContentCard } from "@/components/ui/ContentCard";
import LocaleLink from "@/components/ui/LocaleLink";
import { cn } from "@/lib/utils";
import { Album } from "@/types";

interface PublicUser {
  userId: string;
  email: string;
  username?: string;
  createdAt: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
}

export default function UserAlbumsPage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const displayName = user?.username || user?.email?.split("@")[0] || username;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Fetch user profile and albums
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

        // Mock albums data (in real app, this would be fetched from API using albumsApi.getAlbums({ createdBy: userId }))
        const mockAlbums: Album[] = [
          {
            id: "album1",
            title: "Urban Exploration",
            isPublic: true,
            mediaCount: 15,
            coverImageUrl: "/albums/album1/cover/urban-exploration-cover.jpg",
            thumbnailUrls: {
              cover:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_cover.webp",
              small:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_small.webp",
              medium:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_medium.webp",
              large:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_large.webp",
              originalSize:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
              xlarge:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_xlarge.webp",
            },
            createdAt: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(), // 3 days ago
            updatedAt: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 92,
            viewCount: 287,
            tags: ["urban", "photography", "exploration"],
          },
          {
            id: "album2",
            title: "Portrait Series",
            isPublic: true,
            mediaCount: 8,
            coverImageUrl: "/albums/album2/cover/portrait-series-cover.jpg",
            thumbnailUrls: {
              cover:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_cover.webp",
              small:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_small.webp",
              medium:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_medium.webp",
              large:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_large.webp",
              originalSize:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
              xlarge:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_xlarge.webp",
            },
            createdAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1 week ago
            updatedAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 156,
            viewCount: 456,
            tags: ["portrait", "photography", "people"],
          },
          {
            id: "album3",
            title: "Travel Memories",
            isPublic: true,
            mediaCount: 24,
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
              originalSize:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
              xlarge:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_xlarge.webp",
            },
            createdAt: new Date(
              Date.now() - 14 * 24 * 60 * 60 * 1000
            ).toISOString(), // 2 weeks ago
            updatedAt: new Date(
              Date.now() - 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 203,
            viewCount: 789,
            tags: ["travel", "adventure", "memories"],
          },
          {
            id: "album4",
            title: "Nature Collection",
            isPublic: true,
            mediaCount: 12,
            coverImageUrl: "/albums/album4/cover/nature-collection-cover.jpg",
            thumbnailUrls: {
              cover:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_cover.webp",
              small:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_small.webp",
              medium:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_medium.webp",
              large:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_large.webp",
              originalSize:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
              xlarge:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_xlarge.webp",
            },
            createdAt: new Date(
              Date.now() - 21 * 24 * 60 * 60 * 1000
            ).toISOString(), // 3 weeks ago
            updatedAt: new Date(
              Date.now() - 21 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 89,
            viewCount: 234,
            tags: ["nature", "landscape", "outdoor"],
          },
          {
            id: "album5",
            title: "Street Photography",
            isPublic: true,
            mediaCount: 18,
            coverImageUrl: "/albums/album5/cover/street-photography-cover.jpg",
            thumbnailUrls: {
              cover:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_cover.webp",
              small:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_small.webp",
              medium:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_medium.webp",
              large:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_large.webp",
              originalSize:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
              xlarge:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_xlarge.webp",
            },
            createdAt: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1 month ago
            updatedAt: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 67,
            viewCount: 145,
            tags: ["street", "photography", "urban"],
          },
          {
            id: "album6",
            title: "Abstract Art",
            isPublic: true,
            mediaCount: 9,
            coverImageUrl: "/albums/album6/cover/abstract-art-cover.jpg",
            thumbnailUrls: {
              cover:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_cover.webp",
              small:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_small.webp",
              medium:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_medium.webp",
              large:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_large.webp",
              originalSize:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/3591ebb5-f901-499f-9edd-f95713e5c4e2_display.webp",
              xlarge:
                "/albums/c51b2a84-072d-4f95-904c-ee926bec7f91/media/thumbnails/3591ebb5-f901-499f-9edd-f95713e5c4e2_thumb_xlarge.webp",
            },
            createdAt: new Date(
              Date.now() - 45 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1.5 months ago
            updatedAt: new Date(
              Date.now() - 45 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likeCount: 45,
            viewCount: 123,
            tags: ["abstract", "art", "creative"],
          },
        ];

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setUser(mockUser);
        setAlbums(mockAlbums);
      } catch (err) {
        console.error("Error fetching user albums:", err);
        setError("Failed to load user albums");
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

            {/* Albums grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
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
            Albums not found
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
                    <FolderOpen className="w-5 h-5 text-green-500" />
                    <h1 className="text-2xl font-bold text-foreground">
                      {displayName}&apos;s Albums
                    </h1>
                  </div>
                  <p className="text-muted-foreground">
                    {albums.length} {albums.length === 1 ? "album" : "albums"} •
                    Public collections
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

          {/* Albums content */}
          {albums.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No albums yet
                </h3>
                <p className="text-muted-foreground">
                  {displayName} hasn&apos;t created any public albums yet.
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
                  {albums.map((album) => (
                    <ContentCard
                      key={album.id}
                      item={album}
                      type="album"
                      canFullscreen={false}
                      canAddToAlbum={false}
                      showTags={false}
                      showCounts={true}
                      aspectRatio={viewMode === "grid" ? "square" : "auto"}
                      preferredThumbnailSize={
                        viewMode === "grid" ? undefined : "originalSize"
                      }
                    />
                  ))}
                </div>

                {/* Future pagination placeholder */}
                {albums.length >= 12 && (
                  <div className="text-center pt-6">
                    <Button variant="outline" disabled>
                      Load More Albums
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
