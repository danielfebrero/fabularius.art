import { Metadata } from "next";
import { getAlbums } from "@/lib/data";
import { Album } from "@/types";
import { DiscoverClient } from "@/components/DiscoverClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { tag?: string };
}): Promise<Metadata> {
  const tag = searchParams.tag;
  const baseTitle = "PornSpot.ai - Discover AI Generated Porn";
  const title = tag ? `${baseTitle} - ${tag}` : baseTitle;
  const baseDescription =
    "Browse and generate AI-powered porn images and videos. Free to start, with premium plans for unlimited creation. Explore AI-generated adult content: images, videos, and more.";
  const description = tag
    ? `${baseDescription} Filtered by: ${tag}`
    : baseDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "PornSpot.ai",
    },
    twitter: {
      title,
      description,
    },
    keywords: [
      "AI porn",
      "AI generated content",
      "adult content",
      "AI videos",
      "AI images",
      "generated porn",
      ...(tag ? [tag] : []),
    ],
  };
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const tag = searchParams.tag;
  let albums: Album[] = [];
  let pagination: any = null;
  let error: string | null = null;

  try {
    const result = await getAlbums({
      isPublic: true,
      limit: 12,
      ...(tag && { tag }), // Include tag if provided
    });

    if (result.error) {
      console.error("Error fetching albums:", result.error);
      error = result.error;
    } else {
      albums = result.data?.albums || [];
      pagination = result.data?.pagination || null;
      console.log(`Successfully fetched ${albums.length} albums`);
    }
  } catch (fetchError) {
    console.error("Exception while fetching albums:", fetchError);
    error = String(fetchError);
  }

  return (
    <>
      {/* SEO-friendly hidden content for search engines */}
      <div className="sr-only">
        <h1>Welcome to PornSpot.ai - AI Generated Adult Content</h1>
        <p>
          Explore and create AI-generated adult content: images, videos, and
          more.
        </p>
      </div>

      {error && albums.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Error loading albums: {error}</p>
          <p className="text-gray-500">Please try refreshing the page.</p>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No albums found. Create your first album to get started!
          </p>
        </div>
      ) : (
        <DiscoverClient
          initialAlbums={albums}
          initialPagination={pagination}
          initialError={error}
          initialTag={tag}
        />
      )}
    </>
  );
}
