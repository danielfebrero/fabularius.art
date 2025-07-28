"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/useUser";
import { useAdminContext } from "@/contexts/AdminContext";
import { useLocaleRouter } from "@/lib/navigation";
import { User } from "@/types/user";
import { UserPlanBadge } from "@/components/UserPlanBadge";
import {
  Compass,
  DollarSign,
  ImageIcon,
  Bookmark,
  Heart,
  FolderOpen,
} from "lucide-react";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout, loading } = useUser();
  const { user: adminUser } = useAdminContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useLocaleRouter();

  const t = useTranslations("common");
  const tNav = useTranslations("navigation");
  const tProfile = useTranslations("user.profile");

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const displayName = user.username || user.email.split("@")[0];

  const initials = displayName.slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
          {initials.toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-foreground">
            {displayName}
          </div>
          {!user.isEmailVerified && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              {tProfile("unverified")}
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {initials.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
                <div className="mt-2">
                  <UserPlanBadge />
                </div>
                {!user.isEmailVerified && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    {tProfile("emailNotVerified")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-2">
            {/* Mobile Navigation Items - Only show on mobile */}
            <div className="sm:hidden border-b border-border pb-2 mb-2">
              <button
                onClick={() => handleMenuItemClick(() => router.push("/"))}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4" />
                  <span>{t("discover")}</span>
                </div>
              </button>

              <button
                onClick={() =>
                  handleMenuItemClick(() => router.push("/generate"))
                }
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>{t("generate")}</span>
                </div>
              </button>

              <button
                onClick={() =>
                  handleMenuItemClick(() => router.push("/pricing"))
                }
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{t("pricing")}</span>
                </div>
              </button>

              <button
                onClick={() =>
                  handleMenuItemClick(() => router.push("/user/images"))
                }
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>{tNav("images")}</span>
                </div>
              </button>

              <button
                onClick={() =>
                  handleMenuItemClick(() => router.push("/user/bookmarks"))
                }
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-4 h-4" />
                  <span>{tNav("bookmarks")}</span>
                </div>
              </button>

              <button
                onClick={() =>
                  handleMenuItemClick(() => router.push("/user/likes"))
                }
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>{tNav("likes")}</span>
                </div>
              </button>

              <button
                onClick={() =>
                  handleMenuItemClick(() => router.push("/user/albums"))
                }
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4" />
                  <span>{tNav("albums")}</span>
                </div>
              </button>
            </div>

            <button
              onClick={() =>
                handleMenuItemClick(() => router.push("/user/profile"))
              }
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{tProfile("profile")}</span>
              </div>
            </button>

            <button
              onClick={() =>
                handleMenuItemClick(() => router.push("/user/dashboard"))
              }
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span>{tProfile("dashboard")}</span>
              </div>
            </button>

            <button
              onClick={() =>
                handleMenuItemClick(() => router.push("/settings"))
              }
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{tProfile("settings")}</span>
              </div>
            </button>

            {/* Show Admin menu item if user is logged in as admin */}
            {adminUser && (
              <button
                onClick={() => handleMenuItemClick(() => router.push("/admin"))}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>{t("admin")}</span>
                </div>
              </button>
            )}

            <div className="border-t border-border my-2"></div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>
                  {loading ? tProfile("signingOut") : tProfile("signOut")}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
