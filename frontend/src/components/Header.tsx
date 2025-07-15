"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useAdminContext } from "@/contexts/AdminContext";
import { Button } from "./ui/Button";
import { UserMenu } from "./user/UserMenu";

export function Header() {
  const { user, loading } = useUser();
  const { user: adminUser } = useAdminContext();

  // If admin is logged in, don't show this header (admin has its own header)
  if (adminUser) {
    return null;
  }

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PornSpot.ai</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                AI Generated Content
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/generate"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Generate
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
              </div>
            ) : user ? (
              <UserMenu user={user} />
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-flex h-9 rounded-md px-3 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground items-center justify-center font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="h-9 rounded-md px-3 text-sm bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border py-3">
          <nav className="flex items-center justify-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/generate"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Generate
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
