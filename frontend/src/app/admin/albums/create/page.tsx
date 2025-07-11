"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlbumForm } from "@/components/admin/AlbumForm";
import { useAdminAlbums } from "@/hooks/useAdminAlbums";

export default function CreateAlbumPage() {
  const router = useRouter();
  const { createAlbum } = useAdminAlbums();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    title: string;
    description?: string;
    isPublic: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const album = await createAlbum(data);
      router.push(`/admin/albums/${album.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create album");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/albums");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Album</h1>
        <p className="text-gray-600">Create a new photo album</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <AlbumForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        submitText="Create Album"
      />
    </div>
  );
}
