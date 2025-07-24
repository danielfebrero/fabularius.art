import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n";
import { GenerateClient } from "@/components/GenerateClient";

type GeneratePageProps = {
  params: { locale: string };
};

// Generate static pages for all locales at build time
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Enable static generation with periodic revalidation
export const revalidate = 86400; // Revalidate every 24 hours (content changes rarely)
export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: GeneratePageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "site" });
  const tGenerate = await getTranslations({ locale, namespace: "generate" });

  const title = tGenerate("metaTitle", { siteName: t("name") });
  const description = tGenerate("metaDescription");
  const url = `https://pornspot.ai/${locale}/generate`;

  return {
    title,
    description,
    keywords: [
      tGenerate("keywords.aiGeneration"),
      tGenerate("keywords.adultCreation"),
      tGenerate("keywords.customParameters"),
      tGenerate("keywords.loraModels"),
      tGenerate("keywords.bulkGeneration"),
    ],
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: locale,
      siteName: t("name"),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function GeneratePage({ params }: GeneratePageProps) {
  return <GenerateClient />;
}
