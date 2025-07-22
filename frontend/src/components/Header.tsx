"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { UserMenu } from "./user/UserMenu";
import {
  Menu,
  X,
  Compass,
  Zap,
  DollarSign,
  ImageIcon,
  Bookmark,
  Heart,
  FolderOpen,
} from "lucide-react";

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
          {/* Logo/Brand - Always visible */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <img src="/logo.svg" alt="PornSpot.ai" className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PornSpot.ai</h1>
              <p className="text-xs text-muted-foreground">
                AI Generated Content
              </p>
            </div>
          </Link>

          {/* Mobile Generate Button - Center */}
          <Link
            href="/generate"
            className="sm:hidden flex items-center justify-center p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Zap className="h-6 w-6" />
            <span className="sr-only">Generate</span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden sm:flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Compass className="h-4 w-4 lg:hidden" />
              <span className="hidden lg:block">Discover</span>
              <span className="lg:hidden sr-only">Discover</span>
            </Link>
            <Link
              href="/generate"
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Zap className="h-4 w-4 lg:hidden" />
              <span className="hidden lg:block">Generate</span>
              <span className="lg:hidden sr-only">Generate</span>
            </Link>
            <Link
              href="/pricing"
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <DollarSign className="h-4 w-4 lg:hidden" />
              <span className="hidden lg:block">Pricing</span>
              <span className="lg:hidden sr-only">Pricing</span>
            </Link>
            {user && (
              <>
                <Link
                  href="/user/images"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImageIcon className="h-4 w-4 lg:hidden" />
                  <span className="hidden lg:block">Images</span>
                  <span className="lg:hidden sr-only">Images</span>
                </Link>
                <Link
                  href="/user/bookmarks"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bookmark className="h-4 w-4 lg:hidden" />
                  <span className="hidden lg:block">Bookmarks</span>
                  <span className="lg:hidden sr-only">Bookmarks</span>
                </Link>
                <Link
                  href="/user/likes"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Heart className="h-4 w-4 lg:hidden" />
                  <span className="hidden lg:block">Likes</span>
                  <span className="lg:hidden sr-only">Likes</span>
                </Link>
                <Link
                  href="/user/albums"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FolderOpen className="h-4 w-4 lg:hidden" />
                  <span className="hidden lg:block">Albums</span>
                  <span className="lg:hidden sr-only">Albums</span>
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
                {/* Mobile Menu Button - Show for unauthenticated users for login/register and navigation */}
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

        {/* Mobile Navigation Menu - For unauthenticated users */}
        {isMobileMenuOpen && !user && (
          <div className="sm:hidden border-t border-border">
            <nav className="py-4 space-y-2">
              {/* Navigation Links */}
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <Compass className="h-4 w-4" />
                <span>Discover</span>
              </Link>
              <Link
                href="/generate"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>Generate</span>
              </Link>
              <Link
                href="/pricing"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                <span>Pricing</span>
              </Link>

              {/* Auth Links */}
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
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
