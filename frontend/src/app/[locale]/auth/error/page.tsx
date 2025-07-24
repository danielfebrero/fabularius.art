import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n";
import { Suspense } from "react";
import { AuthErrorClient } from "@/components/user/AuthErrorClient";

type AuthErrorPageProps = {
  params: { locale: string };
};

// Generate static pages for all locales at build time
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: AuthErrorPageProps): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "auth.error",
  });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

function AuthErrorFallback() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">
        Processing error...
      </h2>

      <p className="text-muted-foreground text-lg">
        Please wait while we process your authentication error.
      </p>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorClient />
    </Suspense>
  );
}
