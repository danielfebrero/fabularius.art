import { getTranslations } from "next-intl/server";
import { ConditionalWhyRegisterSection } from "@/components/user/ConditionalWhyRegisterSection";

interface AuthLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const t = await getTranslations("site");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="w-full max-w-md lg:max-w-6xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                PornSpot.ai
              </h1>
              <p className="text-muted-foreground mt-2 lg:text-lg">
                {t("tagline")}
              </p>
            </div>

            <div className="lg:flex lg:gap-12 lg:items-start">
              {/* Form Card */}
              <div className="lg:w-96 lg:flex-shrink-0">
                <div className="bg-card border border-border rounded-lg shadow-lg p-6">
                  {children}
                </div>
              </div>

              {/* Why Register Section */}
              <div className="lg:flex-1 mt-8 lg:mt-0">
                <ConditionalWhyRegisterSection />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
