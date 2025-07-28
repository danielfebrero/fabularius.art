"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocaleRouter } from "@/lib/navigation";
import LocaleLink from "@/components/ui/LocaleLink";
import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/useUser";
import {
  Heart,
  Bookmark,
  LayoutDashboard,
  Image,
  FolderOpen,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Skeleton,
  HeaderSkeleton,
  GridSkeleton,
} from "@/components/ui/Skeleton";

interface UserLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

const UserLayout: React.FC<UserLayoutProps> = ({
  children,
  params: { locale },
}) => {
  const { user, loading } = useUser();
  const router = useLocaleRouter();
  const pathname = usePathname();
  const t = useTranslations("navigation");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/auth/login`);
    }
  }, [user, loading, router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Skeleton */}
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-4">
                <ul className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <li key={i}>
                      <div className="flex items-center space-x-3 px-3 py-2 rounded-lg">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Main Content Skeleton */}
            <main className="flex-1">
              <div className="space-y-6">
                <HeaderSkeleton />
                <GridSkeleton itemCount={8} itemType="card" />
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigationItems = [
    {
      href: `/${locale}/user/dashboard`,
      label: t("dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/user/profile`,
      label: t("profile"),
      icon: User,
    },
    {
      href: `/${locale}/user/likes`,
      label: t("likes"),
      icon: Heart,
    },
    {
      href: `/${locale}/user/bookmarks`,
      label: t("bookmarks"),
      icon: Bookmark,
    },
    {
      href: `/${locale}/user/images`,
      label: t("images"),
      icon: Image,
    },
    {
      href: `/${locale}/user/albums`,
      label: t("albums"),
      icon: FolderOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto  sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname.includes(item.href);

                  return (
                    <li key={item.href}>
                      <LocaleLink
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-admin-primary to-admin-secondary text-admin-primary-foreground shadow-lg"
                            : "text-muted-foreground hover:bg-admin-primary/10 hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </LocaleLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
