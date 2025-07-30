#!/usr/bin/env node

/**
 * Manual script to revalidate a specific media page across all locales
 *
 * Usage: node scripts/revalidate-media.js <mediaId>
 *
 * This triggers on-demand revalidation for:
 * - /[locale]/media/[mediaId] paths for all supported locales
 * - media-[mediaId] and media cache tags
 *
 * Useful when media data changes (new comments, updated metadata, etc.)
 */

async function revalidateMedia(mediaId) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const SECRET = process.env.REVALIDATE_SECRET;

  if (!SECRET) {
    console.error("❌ REVALIDATE_SECRET environment variable is required");
    process.exit(1);
  }

  if (!mediaId) {
    console.error("❌ Media ID is required");
    console.log("Usage: node scripts/revalidate-media.js <mediaId>");
    process.exit(1);
  }

  const url = new URL("/api/revalidate", SITE_URL);
  url.searchParams.set("secret", SECRET);
  url.searchParams.set("type", "media");
  url.searchParams.set("mediaId", mediaId);

  console.log(`🔄 Revalidating media ${mediaId} for all locales...`);
  console.log("📍 URL:", url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Media revalidated successfully!");
      console.log("📊 Result:", data);
      console.log("🌍 Locales updated:", data.locales?.join(", "));
      console.log("🎬 Media ID:", data.mediaId);
    } else {
      console.error("❌ Revalidation failed:", data.message);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during revalidation:", error.message);
    process.exit(1);
  }
}

// Get mediaId from command line arguments
const mediaId = process.argv[2];
revalidateMedia(mediaId);
