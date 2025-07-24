import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always show locale prefix in the URL for clarity
  localePrefix: "always",
});

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, and static assets
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico|.*\\.txt|.*\\.xml|manifest.json).*)",
  ],
};
