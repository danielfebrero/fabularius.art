import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n";
import { RegisterForm } from "@/components/user/RegisterForm";

type RegisterPageProps = {
  params: { locale: string };
};

// Generate static pages for all locales at build time
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: RegisterPageProps): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "auth.register",
  });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
