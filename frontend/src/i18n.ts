import { getRequestConfig } from "next-intl/server";

// Static list of available locales - update this when adding new translation files
// This avoids using Node.js modules that aren't available in Edge Runtime
export const locales = ["de", "en", "es", "fr", "ru", "zh"] as const;
export const defaultLocale = "en" as const;

export default getRequestConfig(async ({ locale }) => {
  // Add more detailed logging with stack trace
  console.log(
    "getRequestConfig called with locale:",
    locale,
    "type:",
    typeof locale
  );
  if (!locale) {
    console.log("Stack trace for undefined locale:");
    console.trace();
  }

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    console.log("Invalid locale:", locale, "defaulting to", defaultLocale);
    locale = defaultLocale;
  }

  console.log("Using locale:", locale);

  try {
    const messages = (await import(`./locales/${locale}.json`)).default;
    console.log(
      "Successfully loaded messages for locale:",
      locale,
      "message keys:",
      Object.keys(messages).slice(0, 5)
    );
    return {
      locale,
      messages,
    };
  } catch (error) {
    console.error("Error loading messages for locale:", locale, error);
    // Fallback to default locale if there's an error loading the messages
    const fallbackMessages = (await import(`./locales/${defaultLocale}.json`))
      .default;
    return {
      locale: defaultLocale,
      messages: fallbackMessages,
    };
  }
});
