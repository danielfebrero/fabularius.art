import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { locales, defaultLocale } from "./i18n";

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always show locale prefix in the URL for clarity
  localePrefix: "always",
});

export default function middleware(request: NextRequest) {
  // Get the locale from the pathname
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split("/")[1] || defaultLocale;

  // Run the intl middleware
  const response = intlMiddleware(request);

  // Add the locale as a header
  response.headers.set("x-locale", locale);

  return response;
}

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, and static assets
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico|.*\\.txt|.*\\.xml|manifest.json).*)",
  ],
};
