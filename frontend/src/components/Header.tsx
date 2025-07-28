"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/useUser";
import { UserMenu } from "./user/UserMenu";
import LocaleLink from "@/components/ui/LocaleLink";
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
  const t = useTranslations("common");
  const tNav = useTranslations("navigation");
  const tSite = useTranslations("site");

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
          <LocaleLink href="/" className="flex items-center space-x-3">
            <img src="/logo.svg" alt="PornSpot.ai" className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {tSite("name")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {tSite("tagline")}
              </p>
            </div>
          </LocaleLink>

          {/* Mobile Generate Button - Center */}
          <LocaleLink
            href="/generate"
            className="sm:hidden flex items-center justify-center p-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Zap className="h-6 w-6" />
            <span className="sr-only">{t("generate")}</span>
          </LocaleLink>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden sm:flex items-center space-x-6">
            <LocaleLink
              href="/"
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Compass className="h-4 w-4 lg:hidden" />
              <span className="hidden lg:block">{t("discover")}</span>
              <span className="lg:hidden sr-only">{t("discover")}</span>
            </LocaleLink>
            <LocaleLink
              href="/generate"
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Zap className="h-4 w-4 lg:hidden" />
              <span className="hidden lg:block">{t("generate")}</span>
              <span className="lg:hidden sr-only">{t("generate")}</span>
            </LocaleLink>
            <LocaleLink
              href="/pricing"
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <DollarSign className="h-4 w-4 lg:hidden" />
              <span className="hidden lg:block">{t("pricing")}</span>
              <span className="lg:hidden sr-only">{t("pricing")}</span>
            </LocaleLink>
            {user && (
              <>
                <LocaleLink
                  href="/user/medias"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImageIcon className="h-4 w-4 lg:hidden" />
                  <span className="hidden lg:block">{tNav("medias")}</span>
                  <span className="lg:hidden sr-only">{tNav("medias")}</span>
                </LocaleLink>
                <LocaleLink
                  href="/user/bookmarks"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bookmark className="h-4 w-4 lg:hidden" />
                  <span className="hidden lg:block">{tNav("bookmarks")}</span>
                  <span className="lg:hidden sr-only">{tNav("bookmarks")}</span>
                </LocaleLink>
                <LocaleLink
                  href="/user/likes"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Heart className="h-4 w-4 lg:hidden" />
                  <span className="hidden lg:block">{tNav("likes")}</span>
                  <span className="lg:hidden sr-only">{tNav("likes")}</span>
                </LocaleLink>
                <LocaleLink
                  href="/user/albums"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FolderOpen className="h-4 w-4 lg:hidden" />
                  <span className="hidden lg:block">{tNav("albums")}</span>
                  <span className="lg:hidden sr-only">{tNav("albums")}</span>
                </LocaleLink>
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
                  <LocaleLink
                    href="/auth/login"
                    className="h-9 rounded-md px-3 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {t("login")}
                  </LocaleLink>
                  <LocaleLink
                    href="/auth/register"
                    className="h-9 rounded-md px-3 text-sm bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {t("register")}
                  </LocaleLink>
                </div>
                {/* Mobile Menu Button - Show for unauthenticated users for login/register and navigation */}
                <button
                  onClick={toggleMobileMenu}
                  className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label={tNav("menu")}
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
              {/* Navigation LocaleLinks */}
              <LocaleLink
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <Compass className="h-4 w-4" />
                <span>{t("discover")}</span>
              </LocaleLink>
              <LocaleLink
                href="/generate"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>{t("generate")}</span>
              </LocaleLink>
              <LocaleLink
                href="/pricing"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                <span>{t("pricing")}</span>
              </LocaleLink>

              {/* Auth LocaleLinks */}
              <div className="border-t border-border pt-2 mt-2">
                <LocaleLink
                  href="/auth/login"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-md transition-colors"
                >
                  {t("login")}
                </LocaleLink>
                <LocaleLink
                  href="/auth/register"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                >
                  {t("register")}
                </LocaleLink>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
