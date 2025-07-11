"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Album } from "@/types";
import { Button } from "@/components/ui/Button";
import { AlbumTable } from "@/components/admin/AlbumTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminAlbums } from "@/hooks/useAdminAlbums";

export default function AdminAlbumsPage() {
  const router = useRouter();
  const { albums, loading, error, fetchAlbums, deleteAlbum, bulkDeleteAlbums } =
    useAdminAlbums();

  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    albumId?: string;
    albumTitle?: string;
    isBulk?: boolean;
  }>({
    isOpen: false,
  });

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleSelectAlbum = (albumId: string, selected: boolean) => {
    setSelectedAlbums((prev) =>
      selected ? [...prev, albumId] : prev.filter((id) => id !== albumId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedAlbums(selected ? albums.map((album) => album.id) : []);
  };

  const handleDeleteClick = (album: Album) => {
    setDeleteConfirm({
      isOpen: true,
      albumId: album.id,
      albumTitle: album.title,
      isBulk: false,
    });
  };

  const handleBulkDeleteClick = () => {
    setDeleteConfirm({
      isOpen: true,
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk) {
        await bulkDeleteAlbums(selectedAlbums);
        setSelectedAlbums([]);
      } else if (deleteConfirm.albumId) {
        await deleteAlbum(deleteConfirm.albumId);
      }
      setDeleteConfirm({ isOpen: false });
      await fetchAlbums();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleEdit = (albumId: string) => {
    router.push(`/admin/albums/${albumId}`);
  };

  const handleManageMedia = (albumId: string) => {
    router.push(`/admin/albums/${albumId}/media`);
  };

  if (loading && albums.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading albums...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Albums</h1>
          <p className="text-gray-600">Manage your photo albums</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedAlbums.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkDeleteClick}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Delete Selected ({selectedAlbums.length})
            </Button>
          )}
          <Button
            onClick={() => router.push("/admin/albums/create")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Album
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <AlbumTable
        albums={albums}
        selectedAlbums={selectedAlbums}
        onSelectAlbum={handleSelectAlbum}
        onSelectAll={handleSelectAll}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onManageMedia={handleManageMedia}
        loading={loading}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.isBulk ? "Delete Albums" : "Delete Album"}
        message={
          deleteConfirm.isBulk
            ? `Are you sure you want to delete ${selectedAlbums.length} selected albums? This action cannot be undone and will also delete all media in these albums.`
            : `Are you sure you want to delete "${deleteConfirm.albumTitle}"? This action cannot be undone and will also delete all media in this album.`
        }
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
