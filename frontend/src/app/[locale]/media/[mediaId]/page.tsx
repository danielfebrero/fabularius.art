import { notFound } from "next/navigation";
import { getMediaById, fetchAllPublicMedia } from "@/lib/data";
import { composeMediaUrl } from "@/lib/urlUtils";
import { getMediaDisplayUrl } from "@/lib/utils";
import { locales } from "@/i18n";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { MediaDetailClient } from "@/components/MediaDetailClient";

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

  // Get localized translations
  const t = await getTranslations({ locale, namespace: "site" });
  const tMedia = await getTranslations({ locale, namespace: "media" });

  if (error || !media) {
    return {
      title: tMedia("errors.notFound"),
    };
  }

  const mediaTitle = media.originalFilename || media.filename;
  const mediaDescription =
    media.metadata?.prompt || `View ${mediaTitle} on ${t("name")}`;

  const displayImageUrl = composeMediaUrl(getMediaDisplayUrl(media));

  // Use locale in URL generation
  const mediaUrl = `https://pornspot.ai/${locale}/media/${mediaId}`;
  const siteName = t("name");

  // Localized metadata
  const metaTitle = `${mediaTitle} - ${siteName}`;
  const metaDescription = `${mediaDescription}. AI-generated adult content on ${siteName}.`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [
      "AI generated image",
      "adult content",
      "porn image",
      "AI art",
      ...(media.metadata?.tags || []),
    ],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: mediaUrl,
      type: "article",
      locale: locale,
      siteName: siteName,
      images: [
        {
          url: displayImageUrl,
          width: media.width || 1024,
          height: media.height || 1024,
          alt: mediaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [displayImageUrl],
    },
  };
}

export const revalidate = 3600 * 24; // Revalidate every hour
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
