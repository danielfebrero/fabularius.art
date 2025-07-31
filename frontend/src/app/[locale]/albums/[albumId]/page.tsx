import { notFound } from "next/navigation";
import {
  getAlbumById,
  getMediaForAlbum,
  fetchAllPublicAlbums,
} from "@/lib/data";
import { composeAlbumCoverUrl } from "@/lib/urlUtils";
import { AlbumDetailClient } from "@/components/AlbumDetailClient";
import { locales } from "@/i18n";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { generateAlbumMetadata } from "@/lib/opengraph";

type AlbumDetailPageProps = {
  params: {
    locale: string;
    albumId: string;
  };
};

// Enable ISR for album pages
export const revalidate = 0;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: AlbumDetailPageProps): Promise<Metadata> {
  const { locale, albumId } = params;
  const { data: album, error } = await getAlbumById(albumId);

  // Get localized translations for fallback
  const tAlbum = await getTranslations({ locale, namespace: "album" });

  if (error || !album) {
    return {
      title: tAlbum("notFound"),
    };
  }

  return generateAlbumMetadata(locale, albumId, {
    title: album.title,
    tags: album.tags,
    coverImageUrl: album.coverImageUrl
      ? composeAlbumCoverUrl(album.coverImageUrl)
      : undefined,
  });
}

export async function generateStaticParams() {
  const albums = await fetchAllPublicAlbums();

  // Generate params for all locale/album combinations
  const params = [];
  for (const locale of locales) {
    for (const album of albums) {
      params.push({
        locale,
        albumId: album.id,
      });
    }
  }

  return params;
}

export default async function AlbumDetailPage({
  params,
}: AlbumDetailPageProps) {
  const { albumId } = params;
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
