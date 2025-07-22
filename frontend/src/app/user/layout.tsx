"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import {
  Heart,
  Bookmark,
  LayoutDashboard,
  Image,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Skeleton,
  HeaderSkeleton,
  GridSkeleton,
} from "@/components/ui/Skeleton";

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

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
      href: "/user/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/user/likes",
      label: "Liked Content",
      icon: Heart,
    },
    {
      href: "/user/bookmarks",
      label: "Bookmarks",
      icon: Bookmark,
    },
    {
      href: "/user/images",
      label: "Images",
      icon: Image,
    },
    {
      href: "/user/albums",
      label: "Albums",
      icon: FolderOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
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
                      </Link>
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
