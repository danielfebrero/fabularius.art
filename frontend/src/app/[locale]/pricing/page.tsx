import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n";
import { PricingClient } from "@/components/PricingClient";

type PricingPageProps = {
  params: { locale: string };
};

// Generate static pages for all locales at build time
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Enable static generation with periodic revalidation
export const revalidate = 86400; // Revalidate every 24 hours (pricing changes rarely)
export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: PricingPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "site" });
  const tPricing = await getTranslations({ locale, namespace: "pricing" });

  const title = tPricing("metaTitle", { siteName: t("name") });
  const description = tPricing("metaDescription");
  const url = `https://pornspot.ai/${locale}/pricing`;

  return {
    title,
    description,
    keywords: [
      tPricing("keywords.aiPricing"),
      tPricing("keywords.generatedPlans"),
      tPricing("keywords.adultSubscription"),
      tPricing("keywords.generationPricing"),
      tPricing("keywords.membership"),
      tPricing("keywords.adultPlans"),
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

export default function PricingPage({ params }: PricingPageProps) {
  return <PricingClient />;
}
