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
  createAlbum: (_data: CreateUserAlbumData) => Promise<Album>;
  updateAlbum: (_albumId: string, _data: UpdateUserAlbumData) => Promise<Album>;
  deleteAlbum: (_albumId: string) => Promise<void>;
  fetchUserAlbums: (_id?: string) => Promise<void>;
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
  const albumsHook = useAlbums({
    createdBy: userId,
  });

  const fetchUserAlbums = async (_id?: string) => {
    // This is a no-op since the new hook automatically handles refetching
    // based on the createdBy parameter change
    albumsHook.refetch();
  };

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
