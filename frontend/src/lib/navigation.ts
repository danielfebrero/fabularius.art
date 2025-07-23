import { locales, defaultLocale } from "@/i18n";

/**
 * Creates a locale-aware path
 */
export function createLocalePath(path: string, locale: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // For default locale, we still use explicit prefix as configured
  return `/${locale}/${cleanPath}`;
}

/**
 * Gets the locale from a pathname
 */
export function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (locales.includes(firstSegment as any)) {
    return firstSegment;
  }

  return defaultLocale;
}

/**
 * Removes locale from pathname
 */
export function removeLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (locales.includes(firstSegment as any)) {
    return "/" + segments.slice(1).join("/");
  }

  return pathname;
}

/**
 * Checks if a pathname is the current active path
 */
export function isActivePath(pathname: string, href: string): boolean {
  // Remove locale from both paths for comparison
  const cleanPathname = removeLocaleFromPathname(pathname);
  const cleanHref = removeLocaleFromPathname(href);

  return cleanPathname === cleanHref;
}

/**
 * Navigation item type for consistent navigation across the app
 */
export interface NavigationItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isExternal?: boolean;
}

/**
 * Creates locale-aware navigation items
 */
export function createLocaleNavigation(
  items: Omit<NavigationItem, "href">[],
  paths: string[],
  locale: string
): NavigationItem[] {
  return items.map((item, index) => ({
    ...item,
    href: createLocalePath(paths[index], locale),
  }));
}
