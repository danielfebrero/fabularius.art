import { useState, useEffect, useCallback } from "react";
import { interactionApi } from "@/lib/api";
import { UserInteractionsResponse, UserInteraction } from "@/types/user";
import { Media, Album } from "@/types";

interface UseUserLikesOptions {
  username: string;
  limit?: number;
}

interface UserLikesData {
  likes: Array<{
    id: string;
    targetId: string;
    targetType: "media" | "album";
    createdAt: string;
    target?: Media | Album;
  }>;
  loading: boolean;
  error: string | null;
  hasNext: boolean;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
}

export function useUserLikes({
  username,
  limit = 20,
}: UseUserLikesOptions): UserLikesData {
  const [likes, setLikes] = useState<
    Array<{
      id: string;
      targetId: string;
      targetType: "media" | "album";
      createdAt: string;
      target?: Media | Album;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextKey, setNextKey] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const transformInteraction = useCallback((interaction: UserInteraction) => {
    if (!interaction.target) return null;

    if (interaction.targetType === "media") {
      const mediaTarget: Media = {
        id: interaction.target.id,
        filename: interaction.target.id + ".jpg", // Backend doesn't return filename, generate one
        originalFilename: interaction.target.title || "Untitled Media",
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
        createdAt: interaction.target.createdAt || interaction.createdAt,
        updatedAt: interaction.target.updatedAt || interaction.createdAt,
        likeCount: 0, // Would need separate call to get like counts
        viewCount: interaction.target.viewCount || 0,
      };

      return {
        id: `${interaction.userId}_${interaction.targetId}_${interaction.createdAt}`,
        targetId: interaction.targetId,
        targetType: interaction.targetType,
        createdAt: interaction.createdAt,
        target: mediaTarget,
      };
    } else if (interaction.targetType === "album") {
      const albumTarget: Album = {
        id: interaction.target.id,
        title: interaction.target.title || "Untitled Album",
        isPublic: interaction.target.isPublic !== false, // Default to true if not specified
        mediaCount: interaction.target.mediaCount || 0,
        coverImageUrl: interaction.target.coverImageUrl || "",
        thumbnailUrls: interaction.target.thumbnailUrls || {
          cover: "",
          small: "",
          medium: "",
          large: "",
          xlarge: "",
        },
        createdAt: interaction.target.createdAt || interaction.createdAt,
        updatedAt: interaction.target.updatedAt || interaction.createdAt,
        likeCount: 0, // Would need separate call to get like counts
        viewCount: interaction.target.viewCount || 0,
        tags: [], // Backend doesn't provide tags in interactions
      };

      return {
        id: `${interaction.userId}_${interaction.targetId}_${interaction.createdAt}`,
        targetId: interaction.targetId,
        targetType: interaction.targetType,
        createdAt: interaction.createdAt,
        target: albumTarget,
      };
    }

    return null;
  }, []);

  const fetchLikes = useCallback(
    async (pageNum: number = 1, lastKey?: string, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response: UserInteractionsResponse =
          await interactionApi.getLikesByUsername(
            username,
            pageNum,
            limit,
            lastKey
          );

        if (response.success && response.data) {
          const transformedLikes = response.data.interactions
            .map(transformInteraction)
            .filter(Boolean) as Array<{
            id: string;
            targetId: string;
            targetType: "media" | "album";
            createdAt: string;
            target?: Media | Album;
          }>;

          if (append) {
            setLikes((prev) => [...prev, ...transformedLikes]);
          } else {
            setLikes(transformedLikes);
          }

          setHasNext(response.data.pagination.hasNext);
          setNextKey(response.data.pagination.nextKey);
        } else {
          setError(response.error || "Failed to fetch likes");
        }
      } catch (err) {
        console.error("Error fetching user likes:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [username, limit, transformInteraction]
  );

  const loadMore = useCallback(async () => {
    if (hasNext && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchLikes(nextPage, nextKey, true);
    }
  }, [hasNext, loadingMore, page, nextKey, fetchLikes]);

  useEffect(() => {
    if (username) {
      setPage(1);
      setLikes([]);
      setNextKey(undefined);
      fetchLikes(1);
    }
  }, [username, limit, fetchLikes]);

  return {
    likes,
    loading,
    error,
    hasNext,
    loadMore,
    loadingMore,
  };
}
