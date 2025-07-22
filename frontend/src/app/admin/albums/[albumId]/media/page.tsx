"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MediaManager } from "@/components/admin/MediaManager";
import { useAdminAlbums } from "@/hooks/useAdminAlbums";
import { useAdminMedia } from "@/hooks/useAdminMedia";
import { Album } from "@/types";

interface MediaManagementPageProps {
  params: {
    albumId: string;
  };
}

export default function MediaManagementPage({
  params,
}: MediaManagementPageProps) {
  const router = useRouter();
  const { getAlbum, updateAlbum } = useAdminAlbums();
  const { media, fetchAlbumMedia } = useAdminMedia();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverUpdateLoading, setCoverUpdateLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [albumData] = await Promise.all([
          getAlbum(params.albumId),
          fetchAlbumMedia(params.albumId),
        ]);
        setAlbum(albumData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.albumId, getAlbum, fetchAlbumMedia]);

  const handleBack = () => {
    router.push("/admin/albums");
  };

  const handleCoverSelect = async (coverUrl: string | undefined) => {
    if (!album) return;

    setCoverUpdateLoading(true);
    try {
      const updateData: { coverImageUrl?: string } = {};
      if (coverUrl) {
        updateData.coverImageUrl = coverUrl;
      }

      const updatedAlbum = await updateAlbum(album.id, updateData);
      setAlbum(updatedAlbum);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update cover image"
      );
    } finally {
      setCoverUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-admin-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-muted-foreground">Loading album media...</div>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center text-admin-primary hover:text-admin-primary/80 transition-colors font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Albums
          </button>
        </div>
        <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl p-6 border border-admin-primary/20">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Manage Media</h1>
          </div>
          <p className="text-muted-foreground">Upload and manage album media</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-destructive mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-destructive font-medium">
              {error || "Album not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="flex items-center text-admin-primary hover:text-admin-primary/80 transition-colors font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Albums
        </button>
      </div>

      <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl p-6 border border-admin-primary/20">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Media</h1>
            <p className="text-muted-foreground">
              Upload and manage media for &quot;{album.title}&quot;
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-admin-primary rounded-full"></div>
            <span className="text-muted-foreground">Album ID:</span>
            <span className="font-mono text-foreground">{album.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-admin-secondary rounded-full"></div>
            <span className="text-muted-foreground">Media Count:</span>
            <span className="font-semibold text-foreground">
              {album.mediaCount} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                album.isPublic ? "bg-admin-success" : "bg-muted-foreground"
              }`}
            ></div>
            <span className="text-muted-foreground">Status:</span>
            <span
              className={`font-semibold ${
                album.isPublic ? "text-admin-success" : "text-muted-foreground"
              }`}
            >
              {album.isPublic ? "Public" : "Private"}
            </span>
          </div>
        </div>
      </div>

      <MediaManager
        albumId={params.albumId}
        albumTitle={album.title}
        media={media}
        onMediaChange={() => fetchAlbumMedia(params.albumId)}
        currentCoverUrl={album.coverImageUrl}
        onCoverSelect={handleCoverSelect}
        coverUpdateLoading={coverUpdateLoading}
      />
    </div>
  );
}
