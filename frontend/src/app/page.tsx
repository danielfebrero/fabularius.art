import { Metadata } from "next";
import { getAlbums } from "@/lib/data";
import { Album } from "@/types";
import { DiscoverClient } from "@/components/DiscoverClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "PornSpot.ai - Discover AI Generated Porn",
    description:
      "Browse and generate AI-powered porn images and videos. Free to start, with premium plans for unlimited creation. Explore AI-generated adult content: images, videos, and more.",
    openGraph: {
      title: "PornSpot.ai - Discover AI Generated Porn",
      description:
        "Browse and generate AI-powered porn images and videos. Free to start, with premium plans for unlimited creation.",
      siteName: "PornSpot.ai",
    },
    twitter: {
      title: "PornSpot.ai - Discover AI Generated Porn",
      description:
        "Browse and generate AI-powered porn images and videos. Free to start, with premium plans for unlimited creation.",
    },
    keywords: [
      "AI porn",
      "AI generated content",
      "adult content",
      "AI videos",
      "AI images",
      "generated porn",
    ],
  };
}

export default async function DiscoverPage() {
  let albums: Album[] = [];
  let pagination: any = null;
  let error: string | null = null;

  try {
    const result = await getAlbums({ isPublic: true, limit: 12 });

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
        />
      )}
    </>
  );
}
