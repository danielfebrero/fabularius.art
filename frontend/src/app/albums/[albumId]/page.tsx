import { notFound } from "next/navigation";
import { getAlbumById, getAlbums, getMediaForAlbum } from "../../../lib/data";
import { MediaGallery } from "../../../components/MediaGallery";
import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
import type { Metadata } from "next";
import Link from "next/link";
import { AlbumActions } from "./AlbumActions";

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
  const { data } = await getAlbums({ isPublic: true, limit: 100 }); // Fetch all public albums
  const albums = data?.albums || [];
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
          Home
        </Link>
        <span>/</span>
        <Link href="/" className="hover:text-foreground transition-colors">
          Albums
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">
          {album.title}
        </span>
      </nav>

      <AlbumActions />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                {album.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Created: {formatDate(album.createdAt)}</span>
                <span>•</span>
                <span>
                  {album.mediaCount} {album.mediaCount === 1 ? "item" : "items"}
                </span>
                {album.isPublic && (
                  <>
                    <span>•</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Public
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        {album.description && (
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {album.description}
            </p>
          </CardContent>
        )}
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Media Gallery</h2>
        <MediaGallery
          albumId={albumId}
          initialMedia={media}
          initialPagination={mediaResult.data?.pagination}
        />
      </div>
    </div>
  );
}
