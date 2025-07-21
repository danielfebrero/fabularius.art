import { notFound } from "next/navigation";
import {
  getAlbumById,
  getMediaForAlbum,
  fetchAllPublicAlbums,
} from "../../../lib/data";
import { MediaGallery } from "../../../components/MediaGallery";
import { composeAlbumCoverUrl } from "../../../lib/urlUtils";
import { ViewTracker } from "../../../components/ui/ViewTracker";
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

  const albumDescription =
    album.tags?.join(", ") ||
    `Explore this AI-generated porn album: ${album.title}`;

  return {
    title: `${album.title} - AI Generated Porn Album on PornSpot.ai`,
    description: `${albumDescription}. Create your own custom adult content with PornSpot.ai.`,
    keywords: [
      "AI porn album",
      "generated adult content",
      "porn images",
      "porn videos",
      ...(album.tags || []),
    ],
    openGraph: {
      title: `${album.title} - AI Generated Porn Album on PornSpot.ai`,
      description: `${albumDescription}. Create your own custom adult content with PornSpot.ai.`,
      url: `https://pornspot.ai/albums/${params.albumId}`,
      type: "article",
      images: [
        album.coverImageUrl
          ? composeAlbumCoverUrl(album.coverImageUrl)
          : "/website.png",
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${album.title} - AI Generated Porn Album on PornSpot.ai`,
      description: `${albumDescription}. Create your own custom adult content with PornSpot.ai.`,
      images: [
        album.coverImageUrl
          ? composeAlbumCoverUrl(album.coverImageUrl)
          : "/website.png",
      ],
    },
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

  return (
    <div className="space-y-6">
      <ViewTracker targetType="album" targetId={albumId} />

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
        {album.tags && album.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {album.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <MediaGallery
          albumId={albumId}
          initialMedia={media}
          initialPagination={mediaResult.data?.pagination}
        />
      </div>
    </div>
  );
}
