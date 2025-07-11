import { useState, useCallback } from "react";
import { Media } from "@/types";

interface UploadMediaData {
  file: File;
  albumId: string;
}

export function useAdminMedia() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  const fetchAlbumMedia = useCallback(async (albumId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/albums/${albumId}/media`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      const data = await response.json();
      if (data.success) {
        setMedia(data.data.media || []);
      } else {
        throw new Error(data.error || "Failed to fetch media");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch media");
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadMedia = useCallback(
    async (uploadData: UploadMediaData): Promise<Media> => {
      setError(null);
      const fileId = `${uploadData.file.name}-${Date.now()}`;

      try {
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        const formData = new FormData();
        formData.append("file", uploadData.file);

        const response = await fetch(
          `/api/albums/${uploadData.albumId}/media`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

        if (!response.ok) {
          throw new Error("Failed to upload media");
        }

        const data = await response.json();
        if (data.success) {
          return data.data;
        } else {
          throw new Error(data.error || "Failed to upload media");
        }
      } catch (err) {
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
        throw err;
      } finally {
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 2000);
      }
    },
    []
  );

  const uploadMultipleMedia = useCallback(
    async (files: File[], albumId: string): Promise<Media[]> => {
      setError(null);

      const uploadPromises = files.map((file) =>
        uploadMedia({ file, albumId })
      );

      try {
        const results = await Promise.all(uploadPromises);
        return results;
      } catch (err) {
        throw err;
      }
    },
    [uploadMedia]
  );

  const deleteMedia = useCallback(
    async (albumId: string, mediaId: string): Promise<void> => {
      setError(null);

      const response = await fetch(
        `/api/admin/albums/${albumId}/media/${mediaId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete media");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete media");
      }
    },
    []
  );

  const bulkDeleteMedia = useCallback(
    async (albumId: string, mediaIds: string[]): Promise<void> => {
      setError(null);

      const deletePromises = mediaIds.map((mediaId) =>
        deleteMedia(albumId, mediaId)
      );

      await Promise.all(deletePromises);
    },
    [deleteMedia]
  );

  return {
    media,
    loading,
    error,
    uploadProgress,
    fetchAlbumMedia,
    uploadMedia,
    uploadMultipleMedia,
    deleteMedia,
    bulkDeleteMedia,
  };
}
