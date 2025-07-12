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
  const { getAlbum } = useAdminAlbums();
  const { media, fetchAlbumMedia } = useAdminMedia();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading album media...</div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Albums
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Media</h1>
          <p className="text-gray-600">Upload and manage album media</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || "Album not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Albums
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Media</h1>
        <p className="text-gray-600">
          Upload and manage media for &quot;{album.title}&quot;
        </p>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <span>Album ID: {album.id}</span>
          <span>•</span>
          <span>{album.mediaCount} media items</span>
          <span>•</span>
          <span className={album.isPublic ? "text-green-600" : "text-gray-600"}>
            {album.isPublic ? "Public" : "Private"}
          </span>
        </div>
      </div>

      <MediaManager
        albumId={params.albumId}
        albumTitle={album.title}
        media={media}
        onMediaChange={() => fetchAlbumMedia(params.albumId)}
      />
    </div>
  );
}
