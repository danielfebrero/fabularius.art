"use client";

import { useState } from "react";
import { ImageIcon, Grid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ContentCard } from "@/components/ui/ContentCard";
import { Lightbox } from "@/components/ui/Lightbox";
import { cn } from "@/lib/utils";
import LocaleLink from "@/components/ui/LocaleLink";
import { Media } from "@/types";

const UserMediasPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Placeholder data - replace with actual API calls when mediaApi.getUserMedia() is implemented
  const [medias] = useState<Media[]>([
    {
      id: "image1",
      filename: "ai-generated-portrait.jpg",
      originalFilename: "AI Generated Portrait",
      mimeType: "image/jpeg",
      size: 2048000,
      width: 1920,
      height: 1080,
      url: "/media/image1/ai-generated-portrait.jpg",
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
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likeCount: 24,
      viewCount: 89,
    },
    {
      id: "image2",
      filename: "fantasy-landscape.jpg",
      originalFilename: "Fantasy Landscape",
      mimeType: "image/jpeg",
      size: 3024000,
      width: 2560,
      height: 1440,
      url: "/media/image2/fantasy-landscape.jpg",
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
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 156,
      viewCount: 432,
    },
    {
      id: "image3",
      filename: "abstract-art.jpg",
      originalFilename: "Abstract Art Creation",
      mimeType: "image/jpeg",
      size: 1856000,
      width: 1600,
      height: 900,
      url: "/media/image3/abstract-art.jpg",
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
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 67,
      viewCount: 203,
    },
    {
      id: "image4",
      filename: "sci-fi-character.jpg",
      originalFilename: "Sci-Fi Character Design",
      mimeType: "image/jpeg",
      size: 2512000,
      width: 1920,
      height: 1080,
      url: "/media/image4/sci-fi-character.jpg",
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
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 95,
      viewCount: 298,
    },
    {
      id: "image5",
      filename: "nature-scene.jpg",
      originalFilename: "Peaceful Nature Scene",
      mimeType: "image/jpeg",
      size: 2800000,
      width: 2048,
      height: 1152,
      url: "/media/image5/nature-scene.jpg",
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
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 183,
      viewCount: 521,
    },
    {
      id: "image6",
      filename: "digital-artwork.jpg",
      originalFilename: "Digital Artwork Experiment",
      mimeType: "image/jpeg",
      size: 2200000,
      width: 1800,
      height: 1200,
      url: "/media/image6/digital-artwork.jpg",
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
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      likeCount: 42,
      viewCount: 167,
    },
  ]);
  const [isLoading] = useState(false);
  const totalCount = medias.length;

  // Lightbox handlers
  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const handleLightboxNext = () => {
    if (currentMediaIndex < medias.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handleLightboxPrevious = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted/50 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted/50 rounded w-1/2"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 overflow-hidden">
                <div className="aspect-video bg-muted/50"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                  <div className="h-3 bg-muted/50 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-admin-accent/10 to-admin-primary/10 rounded-xl border border-admin-accent/20 shadow-lg p-6">
        {/* Mobile Layout */}
        <div className="block sm:hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-admin-accent to-admin-primary rounded-lg flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Medias</h1>
                <p className="text-sm text-muted-foreground">
                  Your personal media gallery
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="bg-admin-accent/20 text-admin-accent text-sm font-semibold px-3 py-1.5 rounded-full">
              {totalCount.toLocaleString()} medias
            </span>
            <LocaleLink href="/generate">
              <Button className="bg-gradient-to-r from-admin-accent to-admin-primary hover:from-admin-accent/90 hover:to-admin-primary/90 text-admin-accent-foreground shadow-lg flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Generate</span>
              </Button>
            </LocaleLink>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-admin-accent to-admin-primary rounded-lg flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medias</h1>
              <p className="text-muted-foreground">
                Your personal media gallery
              </p>
            </div>
            <span className="bg-admin-accent/20 text-admin-accent text-sm font-semibold px-3 py-1.5 rounded-full">
              {totalCount.toLocaleString()} medias
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <LocaleLink href="/generate">
              <Button className="bg-gradient-to-r from-admin-accent to-admin-primary hover:from-admin-accent/90 hover:to-admin-primary/90 text-admin-accent-foreground shadow-lg flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Generate Media</span>
              </Button>
            </LocaleLink>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={
                viewMode === "grid"
                  ? "bg-admin-accent text-admin-accent-foreground hover:bg-admin-accent/90"
                  : ""
              }
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={
                viewMode === "list"
                  ? "bg-admin-accent text-admin-accent-foreground hover:bg-admin-accent/90"
                  : ""
              }
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {medias.length > 0 ? (
        <div className="space-y-6">
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}
          >
            {medias.map((media, index) => (
              <ContentCard
                key={media.id}
                item={media}
                type="media"
                canLike={true}
                canBookmark={true}
                canFullscreen={true}
                canAddToAlbum={true}
                canDownload={true}
                canDelete={false}
                showCounts={true}
                showTags={false}
                aspectRatio={viewMode === "grid" ? "square" : "auto"}
                preferredThumbnailSize={
                  viewMode === "grid" ? undefined : "originalSize"
                }
                mediaList={medias}
                currentIndex={index}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-12 text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm ? "No matching media found" : "No media yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm
              ? `Try adjusting your search for "${searchTerm}"`
              : "Start creating AI-generated media to see them here!"}
          </p>
          <div className="flex justify-center space-x-4">
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")} variant="outline">
                Clear Search
              </Button>
            )}
            <LocaleLink href="/generate">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Generate Media</span>
              </Button>
            </LocaleLink>
          </div>
        </div>
      )}

      {/* Lightbox for fullscreen viewing */}
      <Lightbox
        media={medias}
        currentIndex={currentMediaIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
      />
    </div>
  );
};

export default UserMediasPage;
