"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { UserMenu } from "./user/UserMenu";
import { Menu, X } from "lucide-react";

export function Header() {
  const { user, loading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Homepage
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
            {user && (
              <>
                <Link
                  href="/user/images"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Images
                </Link>
                <Link
                  href="/user/bookmarks"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Bookmarks
                </Link>
                <Link
                  href="/user/likes"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Likes
                </Link>
                <Link
                  href="/user/albums"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Albums
                </Link>
              </>
            )}
          </nav>

          {/* Auth Section / Mobile Menu Button */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
              </div>
            ) : user ? (
              <>
                <UserMenu user={user} />
                {/* Mobile Menu Button - Only show for authenticated users */}
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Open menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center space-x-2">
                  <Link
                    href="/auth/login"
                    className="h-9 rounded-md px-3 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                {/* Mobile Menu Button - Show for unauthenticated users too */}
                <button
                  onClick={toggleMobileMenu}
                  className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Open menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="py-4 space-y-2">
              {/* Main Navigation */}
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                Homepage
              </Link>
              <Link
                href="/generate"
                onClick={closeMobileMenu}
                className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                Generate
              </Link>
              <Link
                href="/pricing"
                onClick={closeMobileMenu}
                className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                Pricing
              </Link>

              {user ? (
                <>
                  {/* Authenticated User Links */}
                  <div className="border-t border-border pt-2 mt-2">
                    <Link
                      href="/user/images"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      My Images
                    </Link>
                    <Link
                      href="/user/bookmarks"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      My Bookmarks
                    </Link>
                    <Link
                      href="/user/likes"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      My Likes
                    </Link>
                    <Link
                      href="/user/albums"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      My Albums
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {/* Unauthenticated User Links */}
                  <div className="border-t border-border pt-2 mt-2">
                    <Link
                      href="/auth/login"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-md transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
