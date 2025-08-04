import { useQuery } from "@tanstack/react-query";
import { albumsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryClient";
import { Album } from "@/types";

// Hook for fetching a single album by ID
export function useAlbumQuery(albumId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.albums.detail(albumId),
    queryFn: async (): Promise<Album> => {
      return await albumsApi.getAlbum(albumId);
    },
    enabled: !!albumId && enabled,
    // Keep album details fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Enable background refetching for album details
    refetchOnWindowFocus: true,
    // Retry failed requests
    retry: 2,
  });
}
