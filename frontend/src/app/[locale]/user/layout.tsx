"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocaleRouter } from "@/lib/navigation";
import LocaleLink from "@/components/ui/LocaleLink";
import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/useUser";
import { Heart, Bookmark, Image, FolderOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Skeleton,
  HeaderSkeleton,
  GridSkeleton,
} from "@/components/ui/Skeleton";
import {
  PageErrorBoundary,
  SectionErrorBoundary,
} from "@/components/ErrorBoundaries";

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
            {/* Desktop Sidebar Skeleton - Hidden on mobile/tablet */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <nav className="md:bg-card/80 md:backdrop-blur-sm md:rounded-xl md:shadow-lg md:border md:border-admin-primary/10 p-4">
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
            <main className="flex-1 pb-20 lg:pb-0">
              <div className="space-y-6">
                <HeaderSkeleton />
                <GridSkeleton itemCount={8} itemType="card" />
              </div>
            </main>
          </div>
        </div>

        {/* Mobile/Tablet Sticky Footer Skeleton */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg lg:hidden z-40">
          <div className="flex items-center justify-around py-2 px-4 max-w-screen-sm mx-auto">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center space-y-1 py-2 px-1 min-w-0 flex-1"
              >
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-3 w-12 hidden md:block lg:hidden" />
              </div>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigationItems = [
    {
      href: `/user/profile`,
      label: t("profile"),
      icon: User,
    },
    {
      href: `/user/likes`,
      label: t("likes"),
      icon: Heart,
    },
    {
      href: `/user/bookmarks`,
      label: t("bookmarks"),
      icon: Bookmark,
    },
    {
      href: `/user/medias`,
      label: t("medias"),
      icon: Image,
    },
    {
      href: `/user/albums`,
      label: t("albums"),
      icon: FolderOpen,
    },
  ];

  return (
    <PageErrorBoundary context={`User Layout (${locale})`}>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 md:py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Sidebar Navigation - Hidden on mobile/tablet */}
            <SectionErrorBoundary context="User Navigation">
              <aside className="hidden lg:block lg:w-64 flex-shrink-0">
                <nav className="md:bg-card/80 md:backdrop-blur-sm md:rounded-xl md:shadow-lg md:border md:border-admin-primary/10 p-4">
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
            </SectionErrorBoundary>

            {/* Main Content */}
            <SectionErrorBoundary context="User Main Content">
              <main className="flex-1 pb-20 lg:pb-0">{children}</main>
            </SectionErrorBoundary>
          </div>
        </div>

        {/* Mobile/Tablet Sticky Footer Navigation */}
        <SectionErrorBoundary context="Mobile Navigation">
          <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg lg:hidden z-40">
            <div className="flex items-center justify-around py-2 px-4 max-w-screen-sm mx-auto">
              {navigationItems.map((item) => {
                const isActive = pathname.includes(item.href);

                return (
                  <LocaleLink
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center space-y-1 py-2 px-1 rounded-lg transition-all duration-200 min-w-0 flex-1",
                      isActive
                        ? "text-admin-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        isActive ? "scale-110" : "scale-100"
                      )}
                    />
                    {/* Show labels on tablet (md) and up, hide on mobile */}
                    <span
                      className={cn(
                        "text-xs font-medium truncate w-full text-center transition-opacity duration-200",
                        "hidden md:block lg:hidden"
                      )}
                    >
                      {item.label}
                    </span>
                    {/* Show active indicator dot on mobile when no label */}
                    {isActive && (
                      <div className="w-1 h-1 bg-admin-primary rounded-full md:hidden" />
                    )}
                  </LocaleLink>
                );
              })}
            </div>
          </nav>
        </SectionErrorBoundary>
      </div>
    </PageErrorBoundary>
  );
};

export default UserLayout;
