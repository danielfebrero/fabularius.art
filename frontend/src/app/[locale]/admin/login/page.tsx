"use client";

import { useEffect } from "react";
import { useLocaleRouter } from "@/lib/navigation";
import { useAdminContext } from "@/contexts/AdminContext";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLoginPage() {
  const { user, loading, isAdmin, isModerator } = useAdminContext();
  const router = useLocaleRouter();

  // Redirect logic
  useEffect(() => {
    if (loading) return; // Wait for loading to complete

    if (user && (isAdmin || isModerator)) {
      // User is logged in and has admin access
      router.push("/admin");
    } else {
      // Redirect to regular login with admin return path
      router.push("/auth/login?returnTo=/admin");
    }
  }, [user, loading, isAdmin, isModerator, router]);

  // Show skeleton placeholder while checking auth or redirecting
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-8 h-8" />
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)]">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl shadow-lg border border-admin-primary/10 p-8">
            <div className="text-center space-y-4">
              <Skeleton className="w-16 h-16 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-40 mx-auto" />
              <Skeleton className="h-3 w-56 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
