import { useQuery } from "@tanstack/react-query";
import { interactionApi } from "@/lib/api";
import { UnifiedUserInteractionsResponse } from "@/types/user";

// Types
interface UseProfileDataOptions {
  username?: string;
  isOwner?: boolean;
  limit?: number;
  enabled?: boolean;
}

interface ProfileData {
  recentLikes: any[];
}

// Hook for fetching profile data including recent likes and statistics
export function useProfileDataQuery(options: UseProfileDataOptions) {
  const { username, isOwner = false, limit = 3, enabled = true } = options;

  return useQuery({
    queryKey: ["profile", "data", username, isOwner, limit],
    queryFn: async (): Promise<ProfileData> => {
      if (!username && !isOwner) {
        return { recentLikes: [] };
      }

      let response: UnifiedUserInteractionsResponse;

      if (username) {
        // Fetch likes for specific user by username
        response = await interactionApi.getLikesByUsername(username, limit);
      } else {
        // Fetch current user's likes (for owner view)
        response = await interactionApi.getLikes(limit);
      }

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch profile data");
      }

      // Transform interactions to include target details (matching legacy hook format)
      const likesWithTargets = (response.data?.interactions || [])
        .map((interaction) => {
          if (interaction.target) {
            // Convert backend format to frontend format
            if (interaction.targetType === "media") {
              return {
                id: interaction.target.id,
                albumId: interaction.target.albumId || "", // Include albumId for bookmark functionality
                filename: interaction.target.id + ".jpg", // Backend doesn't return filename, generate one
                originalName: interaction.target.title || "Untitled Media",
                mimeType: interaction.target.mimeType || "image/jpeg",
                size: interaction.target.size || 0,
                width: 1920, // Default values since backend doesn't return dimensions
                height: 1080,
                url: interaction.target.url || "",
                thumbnailUrls: interaction.target.thumbnailUrls || {
                  cover: "",
                  small: "",
                  medium: "",
                  large: "",
                  xlarge: "",
                },
                createdAt: interaction.target.createdAt,
                updatedAt: interaction.target.updatedAt,
                likeCount: 0, // Would need separate call to get like counts
                viewCount: interaction.target.viewCount || 0,
                title: interaction.target.title || "Untitled Media",
                type: "media", // Add type for easier handling in UI
              };
            } else if (interaction.targetType === "album") {
              return {
                id: interaction.target.id,
                title: interaction.target.title || "Untitled Album",
                isPublic: interaction.target.isPublic,
                mediaCount: interaction.target.mediaCount || 0,
                coverImageUrl: interaction.target.coverImageUrl || "",
                thumbnailUrls: interaction.target.thumbnailUrls || {
                  cover: "",
                  small: "",
                  medium: "",
                  large: "",
                  xlarge: "",
                },
                createdAt: interaction.target.createdAt,
                updatedAt: interaction.target.updatedAt,
                likeCount: 0, // Would need separate call to get like counts
                viewCount: interaction.target.viewCount || 0,
                type: "album", // Add type for easier handling in UI
              };
            }
          }
          return null;
        })
        .filter(Boolean);

      return {
        recentLikes: likesWithTargets,
      };
    },
    enabled: enabled && (!!username || isOwner),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
