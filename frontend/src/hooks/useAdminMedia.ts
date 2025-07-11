import { useState, useCallback } from "react";
import axios from "axios";
import { Media } from "@/types";
import API_URL from "@/lib/api";

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
      const response = await fetch(`${API_URL}/albums/${albumId}/media`, {
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
      const { file, albumId } = uploadData;

      try {
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        // Step 1: Get presigned URL from the backend
        const presignedUrlResponse = await fetch(
          `${API_URL}/albums/${albumId}/media`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              size: file.size,
            }),
          }
        );

        if (!presignedUrlResponse.ok) {
          throw new Error("Failed to get presigned URL");
        }

        const presignedUrlData = await presignedUrlResponse.json();
        if (!presignedUrlData.success) {
          throw new Error(
            presignedUrlData.error || "Failed to get presigned URL"
          );
        }

        const { uploadUrl } = presignedUrlData.data;

        // Step 2: Upload file directly to S3 using Axios for progress tracking
        await axios.put(uploadUrl, file, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress((prev) => ({
              ...prev,
              [fileId]: percentCompleted,
            }));
          },
        });

        // Assuming the presigned URL response contains the final media object
        return presignedUrlData.data;
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
        `${API_URL}/admin/albums/${albumId}/media/${mediaId}`,
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
