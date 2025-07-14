import { Metadata } from "next";
import { getAlbums } from "@/lib/data";
import { AlbumGrid } from "../components/AlbumGrid";
import { Album } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "PornSpot.ai - Discover AI Generated Porn",
    description:
      "Browse and generate AI-powered porn images and videos. Free to start, with premium plans for unlimited creation.",
  };
}

export default async function HomePage() {
  let albums: Album[] = [];
  let error: string | null = null;

  try {
    const result = await getAlbums({ isPublic: true, limit: 12 });

    if (result.error) {
      console.error("Error fetching albums:", result.error);
      error = result.error;
    } else {
      albums = result.data?.albums || [];
      console.log(`Successfully fetched ${albums.length} albums`);
    }
  } catch (fetchError) {
    console.error("Exception while fetching albums:", fetchError);
    error = String(fetchError);
  }

  return (
    <>
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to PornSpot.ai</h1>
        <p className="text-xl mb-8">
          Explore and create AI-generated adult content: images, videos, and
          more.
        </p>
      </section>

      {error ? (
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
        <AlbumGrid albums={albums} />
      )}
    </>
  );
}
