"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import {
  Heart,
  Bookmark,
  User,
  LayoutDashboard,
  Image,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-primary"></div>
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
      label: "My Images",
      icon: Image,
    },
    {
      href: "/user/albums",
      label: "My Albums",
      icon: FolderOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-admin-primary">
                PornSpot.ai
              </Link>
              <span className="text-muted-foreground">|</span>
              <h1 className="text-lg font-semibold text-foreground">
                User Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-admin-primary" />
                <span className="text-sm text-foreground">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

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
