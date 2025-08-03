"use client";

import { usePathname } from "next/navigation";
import LocaleLink from "@/components/ui/LocaleLink";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { SectionErrorBoundary } from "@/components/ErrorBoundaries";
import { isActivePath } from "@/lib/navigation";

interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exactPath?: boolean; // Optional for exact path matching
}

interface MobileNavigationProps {
  navigationItems: NavigationItem[];
  className?: string;
}

export function MobileNavigation({
  navigationItems,
  className,
}: MobileNavigationProps) {
  const pathname = usePathname();

  return (
    <SectionErrorBoundary context="Mobile Navigation">
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg lg:hidden z-40",
          className
        )}
      >
        <div className="flex items-center justify-around py-2 px-4 max-w-screen-sm mx-auto">
          {navigationItems.map((item) => {
            const isActive = item.exactPath
              ? isActivePath(pathname, item.href)
              : pathname.includes(item.href);

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
  );
}
