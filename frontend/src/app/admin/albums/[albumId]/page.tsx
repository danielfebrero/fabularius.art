"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlbumForm } from "@/components/admin/AlbumForm";
import { useAdminAlbums } from "@/hooks/useAdminAlbums";
import { Album } from "@/types";

interface EditAlbumPageProps {
  params: {
    albumId: string;
  };
}

export default function EditAlbumPage({ params }: EditAlbumPageProps) {
  const router = useRouter();
  const { updateAlbum, getAlbum } = useAdminAlbums();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const albumData = await getAlbum(params.albumId);
        setAlbum(albumData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch album");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchAlbum();
  }, [params.albumId, getAlbum]);

  const handleSubmit = async (data: {
    title: string;
    description?: string;
    isPublic: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      await updateAlbum(params.albumId, data);
      router.push("/admin/albums");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update album");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/albums");
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading album...</div>
      </div>
    );
  }

  if (error && !album) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Album</h1>
          <p className="text-gray-600">Update album details</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Album</h1>
          <p className="text-gray-600">Album not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Album</h1>
        <p className="text-gray-600">Update album details</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <AlbumForm
        initialData={{
          title: album.title,
          ...(album.description && { description: album.description }),
          isPublic: album.isPublic,
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        submitText="Update Album"
      />
    </div>
  );
}
