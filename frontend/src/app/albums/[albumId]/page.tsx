import { notFound } from "next/navigation";
import {
  getAlbumById,
  getMediaForAlbum,
  fetchAllPublicAlbums,
} from "../../../lib/data";
import { MediaGallery } from "../../../components/MediaGallery";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import type { Metadata } from "next";
import Link from "next/link";

type AlbumDetailPageProps = {
  params: { albumId: string };
};

export async function generateMetadata({
  params,
}: AlbumDetailPageProps): Promise<Metadata> {
  const { data: album, error } = await getAlbumById(params.albumId);

  if (error || !album) {
    return {
      title: "Album Not Found",
    };
  }

  return {
    title: `${album.title} - Fabularius.art`,
    description: album.description || null,
  };
}

export async function generateStaticParams() {
  const albums = await fetchAllPublicAlbums();
  return albums.map((album) => ({
    albumId: album.id,
  }));
}

export default async function AlbumDetailPage({
  params,
}: AlbumDetailPageProps) {
  const albumId = params.albumId;
  const albumResult = await getAlbumById(albumId);
  const mediaResult = await getMediaForAlbum(albumId);

  if (albumResult.error || !albumResult.data) {
    notFound();
  }

  const album = albumResult.data;
  const media = mediaResult.data?.media || [];

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Albums
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">
          {album.title}
        </span>
      </nav>

      <div className="space-y-4">
        <MediaGallery
          albumId={albumId}
          initialMedia={media}
          initialPagination={mediaResult.data?.pagination}
        />
      </div>
    </div>
  );
}
