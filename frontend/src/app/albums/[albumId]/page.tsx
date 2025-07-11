"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAlbum } from "../../../hooks/useAlbum";
import { useMedia } from "../../../hooks/useMedia";
import { MediaGallery } from "../../../components/MediaGallery";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params["albumId"] as string;

  const {
    album,
    loading: albumLoading,
    error: albumError,
    refetch: refetchAlbum,
  } = useAlbum(albumId);
  const {
    media,
    loading: mediaLoading,
    error: mediaError,
    pagination,
    loadMore,
  } = useMedia({ albumId });

  // Update page title when album loads
  useEffect(() => {
    if (album) {
      document.title = `${album.title} - Fabularius.art`;
    } else if (albumError) {
      document.title = "Album Not Found - Fabularius.art";
    } else {
      document.title = "Loading Album - Fabularius.art";
    }

    return () => {
      document.title = "Fabularius.art";
    };
  }, [album, albumError]);

  const handleBackClick = () => {
    router.back();
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  // Loading state
  if (albumLoading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center space-x-2 text-sm">
          <div className="h-4 bg-muted-foreground/20 rounded w-12 animate-pulse" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 bg-muted-foreground/20 rounded w-16 animate-pulse" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 bg-muted-foreground/20 rounded w-24 animate-pulse" />
        </div>

        {/* Album header skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-8 bg-muted-foreground/20 rounded w-64 animate-pulse" />
                <div className="h-4 bg-muted-foreground/20 rounded w-32 animate-pulse" />
              </div>
              <div className="h-10 bg-muted-foreground/20 rounded w-20 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted-foreground/20 rounded w-full animate-pulse" />
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Media gallery skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-muted rounded-lg overflow-hidden">
                <div className="aspect-square bg-muted-foreground/20" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                  <div className="h-2 bg-muted-foreground/20 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (albumError) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 mx-auto text-muted-foreground mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {albumError.includes("not found")
              ? "Album Not Found"
              : "Error Loading Album"}
          </h1>
          <p className="text-muted-foreground mb-6">{albumError}</p>
          <div className="flex items-center justify-center space-x-4">
            <Button variant="outline" onClick={handleBackClick}>
              Go Back
            </Button>
            <Button onClick={handleHomeClick}>Go Home</Button>
            {!albumError.includes("not found") && (
              <Button variant="outline" onClick={refetchAlbum}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!album) {
    return null;
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <button
          onClick={handleHomeClick}
          className="hover:text-foreground transition-colors"
        >
          Home
        </button>
        <span>/</span>
        <button
          onClick={handleHomeClick}
          className="hover:text-foreground transition-colors"
        >
          Albums
        </button>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">
          {album.title}
        </span>
      </nav>

      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBackClick}
          className="flex items-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back</span>
        </Button>
      </div>

      {/* Album Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                {album.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Created: {formatDate(album.createdAt)}</span>
                <span>•</span>
                <span>
                  {album.mediaCount} {album.mediaCount === 1 ? "item" : "items"}
                </span>
                {album.isPublic && (
                  <>
                    <span>•</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Public
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        {album.description && (
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {album.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Media Gallery */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Media Gallery</h2>
        <MediaGallery
          media={media}
          loading={mediaLoading}
          error={mediaError}
          pagination={pagination}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  );
}
