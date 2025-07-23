import { notFound } from "next/navigation";
import {
  getAlbumById,
  getMediaForAlbum,
  fetchAllPublicAlbums,
} from "../../../lib/data";
import { composeAlbumCoverUrl } from "../../../lib/urlUtils";
import { AlbumDetailClient } from "../../../components/AlbumDetailClient";
import type { Metadata } from "next";

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
    <AlbumDetailClient
      album={album}
      initialMedia={media}
      initialPagination={mediaResult.data?.pagination || null}
    />
  );
}
