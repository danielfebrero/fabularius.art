import { useState, useCallback } from "react";
import { Album } from "@/types";
import { adminAlbumsApi } from "@/lib/api";

interface CreateAlbumData {
  title: string;
  description?: string;
  isPublic: boolean;
}

interface UpdateAlbumData {
  title?: string;
  tags?: string[];
  isPublic?: boolean;
  coverImageUrl?: string;
}

export function useAdminAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await adminAlbumsApi.getAlbums();
      setAlbums(data.albums || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch albums");
    } finally {
      setLoading(false);
    }
  }, []);

  const createAlbum = useCallback(
    async (albumData: CreateAlbumData): Promise<Album> => {
      setError(null);
      return await adminAlbumsApi.createAlbum(albumData);
    },
    []
  );

  const updateAlbum = useCallback(
    async (albumId: string, albumData: UpdateAlbumData): Promise<Album> => {
      setError(null);
      return await adminAlbumsApi.updateAlbum(albumId, albumData);
    },
    []
  );

  const deleteAlbum = useCallback(async (albumId: string): Promise<void> => {
    setError(null);
    return await adminAlbumsApi.deleteAlbum(albumId);
  }, []);

  const bulkDeleteAlbums = useCallback(
    async (albumIds: string[]): Promise<void> => {
      setError(null);
      return await adminAlbumsApi.bulkDeleteAlbums(albumIds);
    },
    []
  );

  const getAlbum = useCallback(async (albumId: string): Promise<Album> => {
    setError(null);
    return await adminAlbumsApi.getAlbum(albumId);
  }, []);

  return {
    albums,
    loading,
    error,
    fetchAlbums,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    bulkDeleteAlbums,
    getAlbum,
  };
}
