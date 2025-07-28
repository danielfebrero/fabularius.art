"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Mail, Grid, List, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ContentCard } from "@/components/ui/ContentCard";
import LocaleLink from "@/components/ui/LocaleLink";
import { cn } from "@/lib/utils";
import { Media, Album } from "@/types";

interface Comment {
  id: string;
  content: string;
  contentTitle: string;
  targetType: "media" | "album";
  targetId: string;
  timestamp: string;
  createdAt: string;
}

interface PublicUser {
  userId: string;
  email: string;
  username?: string;
  createdAt: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
}

// Helper functions to create mock content objects for ContentCard
const createMockMediaFromComment = (comment: Comment): Media => {
  return {
    id: comment.targetId,
    filename: `${comment.contentTitle.toLowerCase().replace(/\s+/g, "_")}.jpg`,
    originalFilename: `${comment.contentTitle}.jpg`,
    mimeType: "image/jpeg",
    size: 1024000, // 1MB
    width: 1920,
    height: 1080,
    url: `/placeholder-media-${comment.targetId}.jpg`,
    thumbnailUrl: `/placeholder-media-${comment.targetId}-thumb.jpg`,
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
    createdAt: comment.createdAt,
    updatedAt: comment.createdAt,
    likeCount: Math.floor(Math.random() * 100) + 10,
    bookmarkCount: Math.floor(Math.random() * 50) + 5,
    viewCount: Math.floor(Math.random() * 500) + 50,
  };
};

const createMockAlbumFromComment = (comment: Comment): Album => {
  return {
    id: comment.targetId,
    title: comment.contentTitle,
    tags: ["photography", "art", "gallery"],
    coverImageUrl: `/placeholder-album-${comment.targetId}-cover.jpg`,
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
    isPublic: true,
    mediaCount: Math.floor(Math.random() * 20) + 5,
    likeCount: Math.floor(Math.random() * 80) + 15,
    bookmarkCount: Math.floor(Math.random() * 40) + 8,
    viewCount: Math.floor(Math.random() * 300) + 100,
    createdAt: comment.createdAt,
    updatedAt: comment.createdAt,
  };
};

export default function UserCommentsPage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const displayName = user?.username || user?.email?.split("@")[0] || username;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Fetch user profile and comments
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

        // Mock comments data (in real app, this would be fetched from API)
        const mockComments: Comment[] = [
          {
            id: "comment1",
            content:
              "Amazing composition and lighting! The way you captured the golden hour is absolutely stunning. This reminds me of my favorite photography spots.",
            contentTitle: "Sunset Beach Photography",
            targetType: "media",
            targetId: "media1",
            timestamp: "2 hours ago",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "comment2",
            content:
              "Love the colors in this series. Each photo tells a different story while maintaining a cohesive aesthetic.",
            contentTitle: "Abstract Art Collection",
            targetType: "album",
            targetId: "album2",
            timestamp: "5 hours ago",
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "comment3",
            content:
              "Great perspective on urban life. The contrast between old and new architecture is beautifully captured.",
            contentTitle: "City Streets",
            targetType: "media",
            targetId: "media3",
            timestamp: "1 day ago",
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "comment4",
            content:
              "This collection speaks to me on so many levels. Thank you for sharing your vision with us!",
            contentTitle: "Nature's Symphony",
            targetType: "album",
            targetId: "album4",
            timestamp: "2 days ago",
            createdAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "comment5",
            content:
              "The detail in this macro shot is incredible. You can see every droplet of water on the petals.",
            contentTitle: "Morning Dew",
            targetType: "media",
            targetId: "media5",
            timestamp: "3 days ago",
            createdAt: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "comment6",
            content:
              "Your editing style has really evolved. The mood and atmosphere in these recent photos is exceptional.",
            contentTitle: "Moody Landscapes",
            targetType: "album",
            targetId: "album6",
            timestamp: "4 days ago",
            createdAt: new Date(
              Date.now() - 4 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "comment7",
            content:
              "Perfect timing on this street photography shot. The interaction between the subjects is pure poetry.",
            contentTitle: "Human Connections",
            targetType: "media",
            targetId: "media7",
            timestamp: "1 week ago",
            createdAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "comment8",
            content:
              "This series made me see my own city in a completely different light. Fantastic work!",
            contentTitle: "Urban Exploration",
            targetType: "album",
            targetId: "album8",
            timestamp: "1 week ago",
            createdAt: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ];

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setUser(mockUser);
        setComments(mockComments);
      } catch (err) {
        console.error("Error fetching user comments:", err);
        setError("Failed to load user comments");
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

            {/* Comments skeleton */}
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
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
          <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Failed to load comments
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
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
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Back button */}
                  <LocaleLink href={`/profile/${username}`}>
                    <Button variant="ghost" size="sm" className="p-2">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </LocaleLink>

                  {/* User avatar */}
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                    {initials}
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {displayName}&apos;s Comments
                    </h1>
                    <p className="text-muted-foreground">
                      {comments.length} comment
                      {comments.length !== 1 ? "s" : ""} made
                    </p>
                  </div>
                </div>

                {/* View mode toggle */}
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
            </CardHeader>
          </Card>

          {/* Comments Content */}
          {comments.length > 0 ? (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "space-y-4"
              )}
            >
              {comments.map((comment) => (
                <Card
                  key={comment.id}
                  className="border-border/50 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Comment metadata and user info */}
                      <div className="flex items-start gap-4">
                        {/* User avatar */}
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Comment content */}
                          <div className="mb-3">
                            <p className="text-foreground leading-relaxed">
                              &ldquo;{comment.content}&rdquo;
                            </p>
                          </div>

                          {/* Comment metadata */}
                          <div className="space-y-2 mb-4">
                            <LocaleLink
                              href={
                                comment.targetType === "media"
                                  ? `/media/${comment.targetId}`
                                  : `/albums/${comment.targetId}`
                              }
                              className="block"
                            >
                              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <Mail className="w-4 h-4" />
                                <span className="font-medium">
                                  On &ldquo;{comment.contentTitle}&rdquo;
                                </span>
                                <span className="text-xs">
                                  ({comment.targetType})
                                </span>
                              </div>
                            </LocaleLink>

                            <div className="text-xs text-muted-foreground">
                              {comment.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="ml-14">
                        <div className="w-full max-w-sm">
                          <ContentCard
                            item={
                              comment.targetType === "media"
                                ? createMockMediaFromComment(comment)
                                : createMockAlbumFromComment(comment)
                            }
                            type={comment.targetType}
                            aspectRatio="square"
                            className="w-full"
                            canAddToAlbum={comment.targetType !== "album"}
                            canDownload={false}
                            showCounts={true}
                            showTags={comment.targetType === "album"}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty state */
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No comments yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  {displayName} hasn&apos;t made any comments yet. Check back
                  later!
                </p>
                <LocaleLink href={`/profile/${username}`}>
                  <Button variant="outline">Back to Profile</Button>
                </LocaleLink>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
