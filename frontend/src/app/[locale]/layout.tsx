import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AdminProvider } from "@/contexts/AdminContext";
import { UserProvider } from "@/contexts/UserContext";
import { UserInteractionProvider } from "@/hooks/useUserInteractionStatus";
import { Header } from "@/components/Header";
import { PermissionsWrapper } from "@/components/PermissionsWrapper";
import { MainContentWrapper } from "@/components/MainContentWrapper";

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "site" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "AI porn",
      "generated porn",
      "AI adult content",
      "porn images",
      "porn videos",
      "AI generator",
      "adult AI",
      "custom porn",
      "LoRA porn",
    ],
    authors: [{ name: "PornSpot.ai" }],
    creator: "PornSpot.ai",
    publisher: "PornSpot.ai",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(
      process.env["NEXT_PUBLIC_SITE_URL"] || "https://pornspot.ai"
    ),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://pornspot.ai",
      siteName: "PornSpot.ai",
      images: [
        {
          url: "/website.png",
          width: 1024,
          height: 1024,
          alt: "PornSpot.ai - AI Generated Porn",
        },
      ],
      locale: locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/website.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    ...(process.env["GOOGLE_SITE_VERIFICATION"] && {
      verification: {
        google: process.env["GOOGLE_SITE_VERIFICATION"],
      },
    }),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Props) {
  console.log("LocaleLayout called with locale:", locale);
  const messages = await getMessages({ locale });
  console.log(
    "getMessages returned messages for locale:",
    locale,
    "keys:",
    Object.keys(messages || {})
  );

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <UserProvider>
        <UserInteractionProvider>
          <PermissionsWrapper>
            <AdminProvider>
              <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <MainContentWrapper>{children}</MainContentWrapper>
                <footer className="border-t border-border mt-16">
                  <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        &copy; 2024 PornSpot.ai. All rights reserved.
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            </AdminProvider>
          </PermissionsWrapper>
        </UserInteractionProvider>
      </UserProvider>
    </NextIntlClientProvider>
  );
}
