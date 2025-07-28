import { useCallback } from "react";
import { useAlbums } from "./useAlbums";
import { Album } from "@/types";

interface CreateUserAlbumData {
  title: string;
  tags?: string[];
  isPublic: boolean;
  mediaIds?: string[];
  coverImageId?: string;
}

interface UpdateUserAlbumData {
  title?: string;
  tags?: string[];
  isPublic?: boolean;
  coverImageUrl?: string;
}

interface UseUserAlbumsReturn {
  albums: Album[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  createAlbum: (data: CreateUserAlbumData) => Promise<Album>;
  updateAlbum: (albumId: string, data: UpdateUserAlbumData) => Promise<Album>;
  deleteAlbum: (albumId: string) => Promise<void>;
  fetchUserAlbums: (id?: string) => Promise<void>;
  refetch: () => void;
}

/**
 * @deprecated Use useAlbums instead. This hook is maintained for backward compatibility.
 *
 * Usage migration:
 * - useUserAlbums() -> useAlbums() // For current user's albums
 * - useUserAlbums(userId) -> useAlbums({ createdBy: userId }) // For specific user's albums
 */
export function useUserAlbums(userId?: string): UseUserAlbumsReturn {
  // Use the new useAlbums hook under the hood
  const albumsHook = useAlbums(
    userId
      ? {
          createdBy: userId,
        }
      : undefined
  );

  // This is a stub function since fetching by ID is deprecated
  const fetchUserAlbums = useCallback(
    async (id?: string) => {
      console.warn(
        "[useUserAlbums] fetchUserAlbums is deprecated. Use useAlbums({ createdBy: userId }) instead."
      );
      // This would need to be implemented if we still need it
      // For now, just call refetch
      albumsHook.refetch();
    },
    [albumsHook]
  );

  return {
    albums: albumsHook.albums,
    loading: albumsHook.loading,
    error: albumsHook.error,
    totalCount: albumsHook.totalCount,
    createAlbum:
      albumsHook.createAlbum ||
      (async () => {
        throw new Error(
          "Cannot create albums when viewing another user's albums"
        );
      }),
    updateAlbum:
      albumsHook.updateAlbum ||
      (async () => {
        throw new Error(
          "Cannot update albums when viewing another user's albums"
        );
      }),
    deleteAlbum:
      albumsHook.deleteAlbum ||
      (async () => {
        throw new Error(
          "Cannot delete albums when viewing another user's albums"
        );
      }),
    fetchUserAlbums,
    refetch: albumsHook.refetch,
  };
}
