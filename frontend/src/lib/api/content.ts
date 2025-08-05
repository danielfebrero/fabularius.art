const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

// Content API Functions
export const contentApi = {
  // Get view counts for multiple targets (bulk fetch)
  getViewCounts: async (
    targets: Array<{
      targetType: "album" | "media";
      targetId: string;
    }>
  ): Promise<{
    success: boolean;
    data: {
      viewCounts: Array<{
        targetType: "album" | "media";
        targetId: string;
        viewCount: number;
      }>;
    };
    error?: string;
  }> => {
    const response = await fetch(`${API_URL}/content/view-count`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // No credentials needed for public view count endpoint
      body: JSON.stringify({ targets }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get view counts: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  },
};
