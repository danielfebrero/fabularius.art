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
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-admin-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="text-muted-foreground">Loading media...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-admin-primary/10 to-admin-secondary/10 rounded-xl p-6 border border-admin-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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
              <h1 className="text-3xl font-bold text-foreground">
                Media Management
              </h1>
              <p className="text-muted-foreground">
                Manage all media across your albums
              </p>
            </div>
          </div>

          {selectedMedia.size > 0 && (
            <div className="flex items-center gap-4">
              <div className="bg-admin-warning/10 border border-admin-warning/20 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-admin-warning-foreground">
                  {selectedMedia.size} selected
                </span>
              </div>
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l2.293 2.293a1 1 0 001.414-1.414L11.414 12l1.293-1.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {allMedia.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
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
          <h3 className="text-lg font-medium text-foreground mb-2">
            No media found
          </h3>
          <p className="text-muted-foreground">
            Upload media to your albums to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-admin-primary hover:text-admin-primary/80 transition-colors"
                >
                  {selectedMedia.size === allMedia.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <div className="h-4 w-px bg-border"></div>
                <span className="text-sm text-muted-foreground">
                  {allMedia.length} media items total
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">View:</span>
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <button className="p-1 rounded text-admin-primary bg-background shadow-sm">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allMedia.map((media) => (
              <div
                key={media.id}
                className={`relative group cursor-pointer border-2 rounded-xl overflow-hidden transition-all duration-200 ${
                  selectedMedia.has(media.id)
                    ? "border-admin-primary ring-4 ring-admin-primary/20 shadow-lg"
                    : "border-transparent hover:border-admin-primary/30 hover:shadow-md"
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
                    className={`absolute inset-0 transition-all duration-200 ${
                      selectedMedia.has(media.id)
                        ? "bg-admin-primary/20 opacity-100"
                        : "bg-black/0 opacity-0 group-hover:bg-black/10 group-hover:opacity-100"
                    }`}
                  />

                  {/* Selection checkbox */}
                  <div className="absolute top-3 right-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                        selectedMedia.has(media.id)
                          ? "bg-admin-primary border-admin-primary shadow-lg"
                          : "bg-white/90 border-white/90 group-hover:bg-white group-hover:border-white"
                      }`}
                    >
                      {selectedMedia.has(media.id) && (
                        <svg
                          className="w-4 h-4 text-white m-0.5"
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
                <div className="p-3 bg-card border-t border-border">
                  <div className="text-sm font-medium truncate text-foreground">
                    {media.filename}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
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
