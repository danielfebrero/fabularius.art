import { getAlbums } from "@/lib/data";
import { AlbumGrid } from "../components/AlbumGrid";

export default async function HomePage() {
  const { data, error } = await getAlbums({ isPublic: true, limit: 12 });

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  return <AlbumGrid albums={data?.albums || []} />;
}
