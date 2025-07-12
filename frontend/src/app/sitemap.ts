import { MetadataRoute } from "next";
import { fetchAllPublicAlbums } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env["NEXT_PUBLIC_SITE_URL"] || "https://fabularius.art";

  // Static routes that should be included in the sitemap
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
  ];

  // Fetch all public albums to generate dynamic routes
  try {
    const albums = await fetchAllPublicAlbums();

    // Generate album-specific routes
    const albumRoutes: MetadataRoute.Sitemap = albums.map((album) => ({
      url: `${baseUrl}/albums/${album.id}`,
      lastModified: album.updatedAt ? new Date(album.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...albumRoutes];
  } catch (error) {
    console.error("Error fetching albums for sitemap:", error);
    // Return static routes only if album fetching fails
    return staticRoutes;
  }
}
