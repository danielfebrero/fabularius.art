import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/user/LoginForm";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "auth.login",
  });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default function LoginPage() {
  return <LoginForm />;
}
