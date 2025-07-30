import { notFound } from "next/navigation";
import { getMediaById, fetchAllPublicMedia } from "@/lib/data";
import { composeMediaUrl } from "@/lib/urlUtils";
import { getMediaDisplayUrl } from "@/lib/utils";
import { locales } from "@/i18n";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { MediaDetailClient } from "@/components/MediaDetailClient";
import { generateMediaMetadata } from "@/lib/opengraph";

interface MediaDetailPageProps {
  params: {
    locale: string;
    mediaId: string;
  };
}

export async function generateMetadata({
  params,
}: MediaDetailPageProps): Promise<Metadata> {
  const { locale, mediaId } = params;
  const { data: media, error } = await getMediaById(mediaId);

  // Get localized translations for fallback
  const tMedia = await getTranslations({ locale, namespace: "media" });

  if (error || !media) {
    return {
      title: tMedia("errors.notFound"),
    };
  }

  const displayImageUrl = composeMediaUrl(getMediaDisplayUrl(media));

  return generateMediaMetadata(locale, mediaId, media, displayImageUrl);
}

export const revalidate = false; // Disable automatic revalidation - use on-demand only
export const dynamic = "force-static"; // Force static generation at build time

export async function generateStaticParams() {
  const media = await fetchAllPublicMedia();

  // Generate all combinations of locale and mediaId
  const params = [];
  for (const locale of locales) {
    for (const item of media) {
      params.push({
        locale,
        mediaId: item.id,
      });
    }
  }

  return params;
}

export default async function MediaDetailPage({
  params,
}: MediaDetailPageProps) {
  const { mediaId } = params;
  const mediaResult = await getMediaById(mediaId);

  if (mediaResult.error || !mediaResult.data) {
    notFound();
  }

  const media = mediaResult.data;

  return <MediaDetailClient media={media} />;
}
