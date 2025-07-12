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
    tags?: string[];
    isPublic: boolean;
    coverImageUrl?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const album = await createAlbum(data);
      router.push(`/admin/albums/${album.id}/media`);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl p-6 border border-admin-primary/20">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Create New Album
          </h1>
        </div>
        <p className="text-muted-foreground">
          Create a beautiful photo album to showcase your artwork
        </p>
      </div>

      {error && (
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
            <p className="text-destructive font-medium">{error}</p>
          </div>
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
