"use client";

import { useState } from "react";
import { Media } from "@/types";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/admin/FileUpload";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAdminMedia } from "@/hooks/useAdminMedia";
import { formatDate, formatFileSize } from "@/lib/utils";

interface MediaManagerProps {
  albumId: string;
  albumTitle: string;
  media: Media[];
  onMediaChange: () => void;
}

export function MediaManager({
  albumId,
  media,
  onMediaChange,
}: MediaManagerProps) {
  const {
    uploadMultipleMedia,
    deleteMedia,
    bulkDeleteMedia,
    uploadProgress,
    loading,
    error,
  } = useAdminMedia();

  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    mediaId?: string;
    mediaFilename?: string;
    isBulk?: boolean;
  }>({
    isOpen: false,
  });

  const handleFileUpload = async (files: File[]) => {
    try {
      await uploadMultipleMedia(files, albumId);
      onMediaChange();
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleSelectMedia = (mediaId: string, selected: boolean) => {
    setSelectedMedia((prev) =>
      selected ? [...prev, mediaId] : prev.filter((id) => id !== mediaId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedMedia(selected ? media.map((m) => m.id) : []);
  };

  const handleDeleteClick = (mediaItem: Media) => {
    setDeleteConfirm({
      isOpen: true,
      mediaId: mediaItem.id,
      mediaFilename: mediaItem.filename,
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
        await bulkDeleteMedia(albumId, selectedMedia);
        setSelectedMedia([]);
      } else if (deleteConfirm.mediaId) {
        await deleteMedia(albumId, deleteConfirm.mediaId);
      }
      setDeleteConfirm({ isOpen: false });
      onMediaChange();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const allSelected = media.length > 0 && selectedMedia.length === media.length;
  const someSelected =
    selectedMedia.length > 0 && selectedMedia.length < media.length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Media</h3>
        <FileUpload
          onFilesSelected={handleFileUpload}
          accept="image/*,video/*"
          multiple
          disabled={loading}
          uploadProgress={uploadProgress}
        />
      </div>

      {/* Media Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Media ({media.length})
            </h3>
            {selectedMedia.length > 0 && (
              <Button
                variant="outline"
                onClick={handleBulkDeleteClick}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Delete Selected ({selectedMedia.length})
              </Button>
            )}
          </div>

          {media.length > 0 && (
            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-600">
                Select all media
              </label>
            </div>
          )}
        </div>

        {media.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">No media uploaded yet</div>
            <p className="text-sm text-gray-400 mt-2">
              Upload your first media files to get started
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {media.map((mediaItem) => (
                <div
                  key={mediaItem.id}
                  className="relative group bg-gray-50 rounded-lg overflow-hidden"
                >
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedMedia.includes(mediaItem.id)}
                      onChange={(e) =>
                        handleSelectMedia(mediaItem.id, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="aspect-square">
                    {mediaItem.mimeType.startsWith("image/") ? (
                      <img
                        src={mediaItem.thumbnailUrl || mediaItem.url}
                        alt={mediaItem.originalFilename || mediaItem.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={mediaItem.url}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                      />
                    )}
                  </div>

                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {mediaItem.originalFilename || mediaItem.filename}
                    </h4>
                    <div className="mt-1 text-xs text-gray-500 space-y-1">
                      <div>{formatFileSize(mediaItem.size)}</div>
                      <div>{formatDate(mediaItem.createdAt)}</div>
                      {mediaItem.width && mediaItem.height && (
                        <div>
                          {mediaItem.width} × {mediaItem.height}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(mediaItem.url, "_blank")}
                        className="flex-1"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(mediaItem)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.isBulk ? "Delete Media" : "Delete Media"}
        message={
          deleteConfirm.isBulk
            ? `Are you sure you want to delete ${selectedMedia.length} selected media items? This action cannot be undone.`
            : `Are you sure you want to delete "${deleteConfirm.mediaFilename}"? This action cannot be undone.`
        }
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
