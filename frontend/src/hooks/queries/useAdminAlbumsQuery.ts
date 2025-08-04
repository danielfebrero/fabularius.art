import { useQuery, useMutation } from "@tanstack/react-query";
import { adminAlbumsApi } from "@/lib/api";
import { queryKeys, queryClient, invalidateQueries } from "@/lib/queryClient";

// Types
interface CreateAdminAlbumData {
  title: string;
  description?: string;
  isPublic: boolean;
}

interface UpdateAdminAlbumData {
  title?: string;
  tags?: string[];
  isPublic?: boolean;
  coverImageUrl?: string;
}

// Hook for fetching all albums (admin view)
export function useAdminAlbums() {
  return useQuery({
    queryKey: queryKeys.admin.albums.all(),
    queryFn: async () => {
      return await adminAlbumsApi.getAlbums();
    },
    // Keep admin albums fresh for 1 minute
    staleTime: 60 * 1000,
    // Enable background refetching for admin data
    refetchOnWindowFocus: true,
  });
}

// Hook for fetching single album (admin view)
export function useAdminAlbum(albumId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.albums.detail(albumId),
    queryFn: async () => {
      return await adminAlbumsApi.getAlbum(albumId);
    },
    enabled: !!albumId && enabled,
    // Keep album details fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Enable background refetching
    refetchOnWindowFocus: true,
  });
}

// Mutation hook for creating albums (admin)
export function useCreateAdminAlbum() {
  return useMutation({
    mutationFn: async (albumData: CreateAdminAlbumData) => {
      return await adminAlbumsApi.createAlbum(albumData);
    },
    onSuccess: (data) => {
      // Invalidate admin albums list
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.albums.all(),
      });

      // Invalidate general albums lists
      invalidateQueries.albumsLists();

      // Set the new album in cache
      queryClient.setQueryData(queryKeys.albums.detail(data.id), data);
    },
  });
}

// Mutation hook for updating albums (admin)
export function useUpdateAdminAlbum() {
  return useMutation({
    mutationFn: async ({
      albumId,
      updates,
    }: {
      albumId: string;
      updates: UpdateAdminAlbumData;
    }) => {
      return await adminAlbumsApi.updateAlbum(albumId, updates);
    },
    onMutate: async ({ albumId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.albums.detail(albumId),
      });

      // Snapshot the previous value
      const previousAlbum = queryClient.getQueryData(
        queryKeys.albums.detail(albumId)
      );

      // Optimistically update the album
      queryClient.setQueryData(queryKeys.albums.detail(albumId), (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      // Return context for rollback
      return { previousAlbum, albumId };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to undo the optimistic update
      if (context?.previousAlbum && context?.albumId) {
        queryClient.setQueryData(
          queryKeys.albums.detail(context.albumId),
          context.previousAlbum
        );
      }
    },
    onSuccess: (data, variables) => {
      // Update the album in cache
      queryClient.setQueryData(
        queryKeys.albums.detail(variables.albumId),
        data
      );

      // Invalidate admin albums list
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.albums.all(),
      });

      // Invalidate general albums lists
      invalidateQueries.albumsLists();
    },
  });
}

// Mutation hook for deleting albums (admin)
export function useDeleteAdminAlbum() {
  return useMutation({
    mutationFn: async (albumId: string) => {
      return await adminAlbumsApi.deleteAlbum(albumId);
    },
    onMutate: async (albumId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.admin.albums.all(),
      });

      // Snapshot the previous value
      const previousAlbums = queryClient.getQueryData(
        queryKeys.admin.albums.all()
      );

      // Optimistically remove the album from admin list
      queryClient.setQueryData(queryKeys.admin.albums.all(), (old: any) => {
        if (!old?.albums) return old;
        return {
          ...old,
          albums: old.albums.filter((album: any) => album.id !== albumId),
        };
      });

      // Return context for rollback
      return { previousAlbums, albumId };
    },
    onError: (err, albumId, context) => {
      // If the mutation fails, restore the previous data
      if (context?.previousAlbums) {
        queryClient.setQueryData(
          queryKeys.admin.albums.all(),
          context.previousAlbums
        );
      }
    },
    onSuccess: (data, albumId) => {
      // Remove from cache completely
      queryClient.removeQueries({
        queryKey: queryKeys.albums.detail(albumId),
      });

      // Invalidate admin albums list
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.albums.all(),
      });

      // Invalidate general albums lists
      invalidateQueries.albumsLists();
    },
  });
}

// Mutation hook for bulk deleting albums (admin)
export function useBulkDeleteAdminAlbums() {
  return useMutation({
    mutationFn: async (albumIds: string[]) => {
      return await adminAlbumsApi.bulkDeleteAlbums(albumIds);
    },
    onMutate: async (albumIds) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.admin.albums.all(),
      });

      // Snapshot the previous value
      const previousAlbums = queryClient.getQueryData(
        queryKeys.admin.albums.all()
      );

      // Optimistically remove the albums from admin list
      queryClient.setQueryData(queryKeys.admin.albums.all(), (old: any) => {
        if (!old?.albums) return old;
        return {
          ...old,
          albums: old.albums.filter(
            (album: any) => !albumIds.includes(album.id)
          ),
        };
      });

      // Return context for rollback
      return { previousAlbums, albumIds };
    },
    onError: (err, albumIds, context) => {
      // If the mutation fails, restore the previous data
      if (context?.previousAlbums) {
        queryClient.setQueryData(
          queryKeys.admin.albums.all(),
          context.previousAlbums
        );
      }
    },
    onSuccess: (data, albumIds) => {
      // Remove all deleted albums from cache
      albumIds.forEach((albumId) => {
        queryClient.removeQueries({
          queryKey: queryKeys.albums.detail(albumId),
        });
      });

      // Invalidate admin albums list
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.albums.all(),
      });

      // Invalidate general albums lists
      invalidateQueries.albumsLists();
    },
  });
}
