import { Metadata } from "next";
import { getAlbums } from "@/lib/data";
import { AlbumGrid } from "../components/AlbumGrid";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "PornSpot.ai - Discover AI Generated Porn",
    description:
      "Browse and generate AI-powered porn images and videos. Free to start, with premium plans for unlimited creation.",
  };
}

export default async function HomePage() {
  const { data, error } = await getAlbums({ isPublic: true, limit: 12 });

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
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
      <AlbumGrid albums={data?.albums || []} />
    </>
  );
}
