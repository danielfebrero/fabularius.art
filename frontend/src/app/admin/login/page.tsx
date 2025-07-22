"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminContext } from "../../../contexts/AdminContext";
import { Card } from "../../../components/ui/Card";

export default function AdminLoginPage() {
  const { user, loading, isAdmin, isModerator } = useAdminContext();
  const router = useRouter();

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

  // Show loading while checking auth or redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {loading
                ? "Checking authentication..."
                : "Redirecting to login..."}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Please log in with your admin account to access the admin panel.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
