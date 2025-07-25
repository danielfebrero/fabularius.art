/**
 * Advanced Fuzzy Hashing for Fingerprint Similarity Detection
 *
 * This module implements locality-sensitive hashing (LSH) to enable
 * similarity detection between fingerprints that are nearly identical
 * but not exact matches.
 */

import * as crypto from "crypto";

// Define the possible feature types
type FeatureName = 
  | 'canvas'
  | 'webglVendor'
  | 'webglRenderer'
  | 'audioContext'
  | 'screenResolution'
  | 'timezone'
  | 'language'
  | 'webglExtensions'
  | 'fontSample'
  | 'userAgent'
  | 'userId'; // Add userId as a stable feature

// LSH bucket configuration type
interface LSHBucketConfig {
  name: string;
  features: FeatureName[];
}

// Stable features extracted from fingerprints
interface StableFeatures {
  canvas: string;
  webglVendor: string;
  webglRenderer: string;
  audioContext: string;
  screenResolution: string;
  timezone: string;
  language: string;
  webglExtensions: string;
  fontSample: string;
  userAgent: string;
  userId: string; // Add userId as a stable feature
}

// Predefined LSH bucket configurations
const LSH_BUCKET_CONFIGS: LSHBucketConfig[] = [
  {
    name: 'coreHardware',
    features: ['canvas', 'webglVendor', 'webglRenderer', 'audioContext']
  },
  {
    name: 'deviceEnvironment',
    features: ['screenResolution', 'timezone', 'language', 'webglVendor']
  },
  {
    name: 'browserCapabilities',
    features: ['canvas', 'webglExtensions', 'fontSample']
  },
  {
    name: 'mixedStability',
    features: ['webglRenderer', 'audioContext', 'screenResolution', 'userAgent']
  },
  {
    name: 'displayAudio',
    features: ['canvas', 'audioContext', 'screenResolution']
  },
  {
    name: 'webglProfile',
    features: ['webglVendor', 'webglRenderer', 'webglExtensions']
  },
  {
    name: 'userProfile',
    features: ['userId', 'timezone', 'language', 'screenResolution']
  },
  {
    name: 'userDevice',
    features: ['userId', 'webglVendor', 'webglRenderer', 'canvas']
  }
];

/**
 * Generate a locality-sensitive hash (LSH) from fingerprint data
 * This creates multiple hash "buckets" that similar fingerprints will likely share
 */
export function generateLocalitySensitiveHashes(
  coreFingerprint: any,
  advancedFingerprint: any,
  userId?: string
): string[] {
  const hashes: string[] = [];

  // Extract stable features for LSH
  const stableFeatures = extractStableFeatures(
    coreFingerprint,
    advancedFingerprint,
    userId
  );

  // Generate LSH buckets for each predefined configuration
  for (const config of LSH_BUCKET_CONFIGS) {
    const bucket = generateLSHBucket(stableFeatures, config);
    hashes.push(bucket);
  }

  return hashes;
}

/**
 * Extract the most stable features for similarity hashing
 */
function extractStableFeatures(
  coreFingerprint: any,
  advancedFingerprint: any,
  userId?: string
): StableFeatures {
  return {
    // High stability features (rarely change)
    canvas: coreFingerprint.canvas?.substring(0, 32) || "", // Truncate for fuzzy matching
    webglVendor: coreFingerprint.webgl?.vendor || "",
    webglRenderer: coreFingerprint.webgl?.renderer || "",
    audioContext: coreFingerprint.audio?.contextHash?.substring(0, 16) || "",

    // Medium stability features
    screenResolution: extractScreenResolution(coreFingerprint),
    timezone: extractTimezone(coreFingerprint),
    language: extractLanguage(coreFingerprint),

    // Low volatility browser features
    webglExtensions: normalizeExtensions(
      coreFingerprint.webgl?.extensions || []
    ),
    fontSample: extractFontSample(coreFingerprint.fonts),

    // Device category indicators
    userAgent: extractUserAgentFeatures(advancedFingerprint),

    // User identity (highest stability when available)
    userId: userId || "", // Empty string when not authenticated
  };
}

/**
 * Generate a single LSH bucket using the specified feature configuration
 */
function generateLSHBucket(features: StableFeatures, config: LSHBucketConfig): string {
  const bucketData: Partial<StableFeatures> = {};

  // Extract only the specified features for this bucket
  for (const featureName of config.features) {
    bucketData[featureName] = features[featureName];
  }

  // Create a hash that's more forgiving of small changes
  const data = JSON.stringify(bucketData);
  return crypto.createHash("md5").update(data).digest("hex").substring(0, 16);
}

/**
 * Extract normalized screen resolution for fuzzy matching
 */
function extractScreenResolution(coreFingerprint: any): string {
  try {
    const screen = coreFingerprint.screen || {};
    // Group similar resolutions together
    const width = Math.floor((screen.width || 1920) / 100) * 100;
    const height = Math.floor((screen.height || 1080) / 100) * 100;
    return `${width}x${height}`;
  } catch {
    return "1920x1080"; // Default
  }
}

/**
 * Extract timezone for device correlation
 */
function extractTimezone(coreFingerprint: any): string {
  try {
    return coreFingerprint.screen?.timezone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Extract language for regional correlation
 */
function extractLanguage(coreFingerprint: any): string {
  try {
    const lang = coreFingerprint.screen?.language || "en-US";
    // Group similar languages (e.g., en-US, en-GB -> en)
    return lang.split("-")[0];
  } catch {
    return "en";
  }
}

/**
 * Normalize WebGL extensions for consistent comparison
 */
function normalizeExtensions(extensions: string[]): string {
  if (!Array.isArray(extensions)) return "";

  // Sort and take only the most common/stable extensions
  const commonExtensions = extensions
    .filter((ext) => ext && typeof ext === "string")
    .sort()
    .slice(0, 10) // Take first 10 extensions
    .join(",");

  return crypto
    .createHash("md5")
    .update(commonExtensions)
    .digest("hex")
    .substring(0, 8);
}

/**
 * Extract a representative font sample for device correlation
 */
function extractFontSample(fonts: any): string {
  try {
    if (!fonts?.available) return "";

    const fontNames = Object.keys(fonts.available);
    // Take a stable subset of fonts that are commonly available
    const stableFonts = fontNames
      .filter(
        (font) =>
          font.includes("Arial") ||
          font.includes("Times") ||
          font.includes("Helvetica") ||
          font.includes("System")
      )
      .sort()
      .slice(0, 5)
      .join(",");

    return crypto
      .createHash("md5")
      .update(stableFonts)
      .digest("hex")
      .substring(0, 8);
  } catch {
    return "";
  }
}

/**
 * Extract key user agent features for device type correlation
 */
function extractUserAgentFeatures(advancedFingerprint: any): string {
  try {
    // This would come from server enhancement data
    const userAgent = advancedFingerprint?.userAgent || "";

    // Extract key identifiers
    const isMobile = userAgent.includes("Mobile");
    const isTablet = userAgent.includes("Tablet");
    const isChrome = userAgent.includes("Chrome");
    const isFirefox = userAgent.includes("Firefox");
    const isSafari =
      userAgent.includes("Safari") && !userAgent.includes("Chrome");

    const features = {
      mobile: isMobile,
      tablet: isTablet,
      chrome: isChrome,
      firefox: isFirefox,
      safari: isSafari,
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(features))
      .digest("hex")
      .substring(0, 8);
  } catch {
    return "";
  }
}

/**
 * Calculate similarity between two sets of LSH hashes
 * Returns a score between 0 and 1
 */
export function calculateLSHSimilarity(
  hashes1: string[],
  hashes2: string[]
): number {
  if (!hashes1.length || !hashes2.length) return 0;

  let matches = 0;
  const totalBuckets = Math.max(hashes1.length, hashes2.length);

  for (let i = 0; i < Math.min(hashes1.length, hashes2.length); i++) {
    if (hashes1[i] === hashes2[i]) {
      matches++;
    }
  }

  return matches / totalBuckets;
}

/**
 * Generate a single "super hash" for exact matching while preserving some fuzzy capability
 */
export function generateFuzzyFingerprintHash(
  coreFingerprint: any,
  advancedFingerprint: any,
  userId?: string
): string {
  const stableFeatures = extractStableFeatures(
    coreFingerprint,
    advancedFingerprint,
    userId
  );

  // Create a hash that's more stable than SHA256 of the entire object
  const reducedData = {
    core: {
      canvas: stableFeatures.canvas,
      webgl: stableFeatures.webglVendor + stableFeatures.webglRenderer,
      audio: stableFeatures.audioContext,
    },
    device: {
      screen: stableFeatures.screenResolution,
      timezone: stableFeatures.timezone,
      language: stableFeatures.language,
    },
    browser: {
      extensions: stableFeatures.webglExtensions,
      fonts: stableFeatures.fontSample,
      userAgent: stableFeatures.userAgent,
    },
    user: {
      userId: stableFeatures.userId, // Include userId in hash
    },
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(reducedData))
    .digest("hex");
}
