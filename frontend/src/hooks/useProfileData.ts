import { useState, useEffect } from "react";
import { interactionApi } from "@/lib/api";
import { UserInteractionsResponse } from "@/types/user";

interface UseProfileDataOptions {
  username?: string;
  isOwner?: boolean;
  limit?: number;
}

interface ProfileData {
  recentLikes: any[];
  loading: boolean;
  error: string | null;
}

export function useProfileData({
  username,
  isOwner = false,
  limit = 3,
}: UseProfileDataOptions): ProfileData {
  const [recentLikes, setRecentLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentLikes = async () => {
      if (!username && !isOwner) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let response: UserInteractionsResponse;

        if (username) {
          // Fetch likes for specific user by username
          response = await interactionApi.getLikesByUsername(
            username,
            1,
            limit
          );
        } else {
          // Fetch current user's likes (for owner view)
          response = await interactionApi.getLikes(1, limit);
        }

        if (response.success && response.data) {
          // Transform interactions to include target details
          const likesWithTargets = response.data.interactions
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

          setRecentLikes(likesWithTargets);
        } else {
          setError(response.error || "Failed to fetch likes");
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentLikes();
  }, [username, isOwner, limit]);

  return {
    recentLikes,
    loading,
    error,
  };
}
