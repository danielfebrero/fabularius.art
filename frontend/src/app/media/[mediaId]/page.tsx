import { notFound } from "next/navigation";
import { getMediaById, fetchAllPublicMedia } from "@/lib/data";
import { composeMediaUrl } from "@/lib/urlUtils";
import type { Metadata } from "next";
import { MediaDetailClient } from "@/components/MediaDetailClient";
import { Media } from "@/types";

interface MediaDetailPageProps {
  params: {
    mediaId: string;
  };
}

export async function generateMetadata({
  params,
}: MediaDetailPageProps): Promise<Metadata> {
  const { data: media, error } = await getMediaById(params.mediaId);

  if (error || !media) {
    return {
      title: "Media Not Found",
    };
  }

  const mediaTitle = media.originalFilename || media.filename;
  const mediaDescription =
    media.metadata?.prompt || `View ${mediaTitle} on PornSpot.ai`;

  return {
    title: `${mediaTitle} - PornSpot.ai`,
    description: `${mediaDescription}. AI-generated adult content on PornSpot.ai.`,
    keywords: [
      "AI generated image",
      "adult content",
      "porn image",
      "AI art",
      ...(media.metadata?.tags || []),
    ],
    openGraph: {
      title: `${mediaTitle} - PornSpot.ai`,
      description: `${mediaDescription}. AI-generated adult content on PornSpot.ai.`,
      url: `https://pornspot.ai/media/${params.mediaId}`,
      type: "article",
      images: [
        {
          url: composeMediaUrl(media.url),
          width: media.width || 1024,
          height: media.height || 1024,
          alt: mediaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${mediaTitle} - PornSpot.ai`,
      description: `${mediaDescription}. AI-generated adult content on PornSpot.ai.`,
      images: [composeMediaUrl(media.url)],
    },
  };
}

export async function generateStaticParams() {
  const media = await fetchAllPublicMedia();
  return media.map((item: Media) => ({
    mediaId: item.id,
  }));
}

export default async function MediaDetailPage({
  params,
}: MediaDetailPageProps) {
  const mediaResult = await getMediaById(params.mediaId);

  if (mediaResult.error || !mediaResult.data) {
    notFound();
  }

  const media = mediaResult.data;

  return <MediaDetailClient media={media} />;
}
