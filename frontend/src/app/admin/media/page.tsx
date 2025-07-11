"use client";

import { useState, useEffect } from "react";
import { useAdminMedia } from "../../../hooks/useAdminMedia";
import { useAdminAlbums } from "../../../hooks/useAdminAlbums";
import { ConfirmDialog } from "../../../components/admin/ConfirmDialog";
import { Media, Album } from "../../../types";

export default function AdminMediaPage() {
  const { albums, loading: albumsLoading, fetchAlbums } = useAdminAlbums();
  const { deleteMedia } = useAdminMedia();
  const [allMedia, setAllMedia] = useState<(Media & { albumTitle: string })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);

  // Fetch all media from all albums
  useEffect(() => {
    const loadAllMedia = async () => {
      setLoading(true);
      try {
        await fetchAlbums();
      } catch (error) {
        console.error("Error loading albums:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllMedia();
  }, [fetchAlbums]);

  // Combine media from all albums
  useEffect(() => {
    if (albums.length > 0) {
      const combined = albums.flatMap((album: Album) =>
        (album.media || []).map((media: Media) => ({
          ...media,
          albumTitle: album.title,
        }))
      );
      setAllMedia(combined);
    }
  }, [albums]);

  const handleSelectMedia = (mediaId: string) => {
    const newSelected = new Set(selectedMedia);
    if (newSelected.has(mediaId)) {
      newSelected.delete(mediaId);
    } else {
      newSelected.add(mediaId);
    }
    setSelectedMedia(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMedia.size === allMedia.length) {
      setSelectedMedia(new Set());
    } else {
      setSelectedMedia(new Set(allMedia.map((media) => media.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedMedia.size > 0) {
      setMediaToDelete(Array.from(selectedMedia));
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    try {
      // Group media by album for deletion
      const mediaByAlbum = new Map<string, string[]>();

      mediaToDelete.forEach((mediaId) => {
        const media = allMedia.find((m) => m.id === mediaId);
        if (media) {
          const album = albums.find((a) =>
            a.media?.some((m) => m.id === mediaId)
          );
          if (album) {
            if (!mediaByAlbum.has(album.id)) {
              mediaByAlbum.set(album.id, []);
            }
            mediaByAlbum.get(album.id)!.push(mediaId);
          }
        }
      });

      // Delete media from each album
      for (const albumId of Array.from(mediaByAlbum.keys())) {
        const mediaIds = mediaByAlbum.get(albumId)!;
        for (const mediaId of mediaIds) {
          await deleteMedia(albumId, mediaId);
        }
      }

      // Refresh albums to update media lists
      await fetchAlbums();
      setSelectedMedia(new Set());
    } catch (error) {
      console.error("Error deleting media:", error);
    } finally {
      setDeleteDialogOpen(false);
      setMediaToDelete([]);
    }
  };

  if (loading || albumsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading media...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Media Management</h1>
          <p className="text-muted-foreground">
            Manage all media across your albums
          </p>
        </div>

        {selectedMedia.size > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedMedia.size} selected
            </span>
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {allMedia.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">No media found</div>
          <p className="text-sm text-muted-foreground">
            Upload media to your albums to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectedMedia.size === allMedia.length
                ? "Deselect All"
                : "Select All"}
            </button>
            <span className="text-sm text-muted-foreground">
              {allMedia.length} media items
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allMedia.map((media) => (
              <div
                key={media.id}
                className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                  selectedMedia.has(media.id)
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-border"
                }`}
                onClick={() => handleSelectMedia(media.id)}
              >
                <div className="aspect-square relative">
                  <img
                    src={media.thumbnailUrl || media.url}
                    alt={media.filename}
                    className="w-full h-full object-cover"
                  />

                  {/* Selection overlay */}
                  <div
                    className={`absolute inset-0 transition-opacity ${
                      selectedMedia.has(media.id)
                        ? "bg-primary/20 opacity-100"
                        : "bg-black/0 opacity-0 group-hover:bg-black/10 group-hover:opacity-100"
                    }`}
                  />

                  {/* Selection checkbox */}
                  <div className="absolute top-2 right-2">
                    <div
                      className={`w-5 h-5 rounded border-2 transition-all ${
                        selectedMedia.has(media.id)
                          ? "bg-primary border-primary"
                          : "bg-white/80 border-white/80 group-hover:bg-white group-hover:border-white"
                      }`}
                    >
                      {selectedMedia.has(media.id) && (
                        <svg
                          className="w-3 h-3 text-primary-foreground m-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media info */}
                <div className="p-2 bg-background">
                  <div className="text-xs font-medium truncate">
                    {media.filename}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {media.albumTitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Media"
        message={`Are you sure you want to delete ${
          mediaToDelete.length
        } media item${
          mediaToDelete.length === 1 ? "" : "s"
        }? This action cannot be undone.`}
        confirmVariant="danger"
      />
    </div>
  );
}
