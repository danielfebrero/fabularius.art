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

type AlbumDetailPageProps = {
  params: { 
    locale: string;
    albumId: string;
  };
};

// Enable ISR for album pages
export const revalidate = 7200; // Revalidate every 2 hours (less frequent than homepage)
export const dynamic = 'force-static';
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: AlbumDetailPageProps): Promise<Metadata> {
  const { locale, albumId } = params;
  const { data: album, error } = await getAlbumById(albumId);

  // Get localized translations
  const t = await getTranslations({ locale, namespace: "site" });
  const tAlbum = await getTranslations({ locale, namespace: "album" });

  if (error || !album) {
    return {
      title: tAlbum("notFound"),
    };
  }

  const albumDescription =
    album.tags?.join(", ") ||
    tAlbum("defaultDescription", { title: album.title });

  // Use locale in URL generation
  const albumUrl = `https://pornspot.ai/${locale}/albums/${albumId}`;
  const siteName = t("name");

  // Localized metadata titles and descriptions
  const metaTitle = tAlbum("metaTitle", { title: album.title, siteName });
  const metaDescription = tAlbum("metaDescription", { 
    description: albumDescription, 
    siteName 
  });

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [
      tAlbum("keywords.aiAlbum"),
      tAlbum("keywords.generatedContent"), 
      tAlbum("keywords.images"),
      tAlbum("keywords.videos"),
      ...(album.tags || []),
    ],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: albumUrl,
      type: "article",
      locale: locale,
      siteName: siteName,
      images: [
        album.coverImageUrl
          ? composeAlbumCoverUrl(album.coverImageUrl)
          : "/website.png",
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
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
  const { locale, albumId } = params;
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
