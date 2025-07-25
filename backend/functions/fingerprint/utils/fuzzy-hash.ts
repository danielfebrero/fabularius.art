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

// LSH bucket configuration type with entropy weighting
interface LSHBucketConfig {
  name: string;
  features: FeatureName[];
  entropy?: number; // Calculated entropy weight (0-1, higher = more unique)
  weight?: number; // Final weight for similarity calculations
  collisionProbability?: number; // Estimated collision probability
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

// Predefined LSH bucket configurations with entropy weights
const LSH_BUCKET_CONFIGS: LSHBucketConfig[] = [
  {
    name: 'coreHardware',
    features: ['canvas', 'webglVendor', 'webglRenderer', 'audioContext'],
    entropy: 0.95, // Very high uniqueness - hardware combinations are highly diverse
    weight: 1.0,
    collisionProbability: 0.001
  },
  {
    name: 'deviceEnvironment',
    features: ['screenResolution', 'timezone', 'language', 'webglVendor'],
    entropy: 0.75, // Good uniqueness - but common resolutions/timezones exist
    weight: 0.85,
    collisionProbability: 0.05
  },
  {
    name: 'browserCapabilities',
    features: ['canvas', 'webglExtensions', 'fontSample'],
    entropy: 0.85, // High uniqueness - browser/font combinations diverse
    weight: 0.9,
    collisionProbability: 0.02
  },
  {
    name: 'mixedStability',
    features: ['webglRenderer', 'audioContext', 'screenResolution', 'userAgent'],
    entropy: 0.70, // Medium uniqueness - userAgent/resolution more common
    weight: 0.75,
    collisionProbability: 0.08
  },
  {
    name: 'displayAudio',
    features: ['canvas', 'audioContext', 'screenResolution'],
    entropy: 0.80, // Good uniqueness - canvas+audio combination unique
    weight: 0.85,
    collisionProbability: 0.03
  },
  {
    name: 'webglProfile',
    features: ['webglVendor', 'webglRenderer', 'webglExtensions'],
    entropy: 0.90, // Very high uniqueness - GPU profiles highly specific
    weight: 0.95,
    collisionProbability: 0.005
  },
  {
    name: 'userProfile',
    features: ['userId', 'timezone', 'language', 'screenResolution'],
    entropy: 0.98, // Highest uniqueness when userId available
    weight: 1.0,
    collisionProbability: 0.0001
  },
  {
    name: 'userDevice',
    features: ['userId', 'webglVendor', 'webglRenderer', 'canvas'],
    entropy: 0.99, // Maximum uniqueness - user + hardware combination
    weight: 1.0,
    collisionProbability: 0.00005
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
 * Get LSH bucket configurations for external analysis
 */
export function getLSHBucketConfigs(): LSHBucketConfig[] {
  return LSH_BUCKET_CONFIGS;
}

/**
 * Calculate entropy-weighted similarity between two sets of LSH hashes
 * Returns both raw similarity and confidence score with signal analysis
 */
export function calculateLSHSimilarity(
  hashes1: string[],
  hashes2: string[]
): {
  similarity: number;
  confidence: number;
  signals: number;
  bucketMatches: Array<{
    bucketName: string;
    matched: boolean;
    weight: number;
    entropy: number;
  }>;
} {
  if (!hashes1.length || !hashes2.length) {
    return { similarity: 0, confidence: 0, signals: 0, bucketMatches: [] };
  }

  let weightedMatches = 0;
  let totalWeight = 0;
  let signals = 0;
  const bucketMatches: Array<{
    bucketName: string;
    matched: boolean;
    weight: number;
    entropy: number;
  }> = [];

  // Compare each bucket with entropy weighting
  for (let i = 0; i < Math.min(hashes1.length, hashes2.length, LSH_BUCKET_CONFIGS.length); i++) {
    const config = LSH_BUCKET_CONFIGS[i];
    if (!config) continue; // Safety check
    
    const matched = hashes1[i] === hashes2[i];
    const weight = config.weight || 1.0;
    const entropy = config.entropy || 0.5;

    bucketMatches.push({
      bucketName: config.name,
      matched,
      weight,
      entropy
    });

    totalWeight += weight;

    if (matched) {
      // Weight the match by both the bucket weight and entropy
      // Higher entropy buckets (more unique) get more weight when they match
      weightedMatches += weight * entropy;
      signals++;
    }
  }

  // Raw similarity based on weighted matches
  const similarity = totalWeight > 0 ? weightedMatches / totalWeight : 0;

  // Confidence calculation factors in:
  // 1. Number of matching signals (more signals = higher confidence)
  // 2. Quality of signals (high-entropy matches = higher confidence)
  // 3. Consistency across bucket types
  const signalBonus = Math.min(signals / LSH_BUCKET_CONFIGS.length, 1.0);
  const entropyBonus = similarity; // Already entropy-weighted
  const consistencyBonus = signals >= 3 ? 0.1 : 0; // Bonus for multiple consistent signals

  const confidence = Math.min(
    similarity * signalBonus * 1.2 + entropyBonus * 0.3 + consistencyBonus,
    1.0
  );

  return {
    similarity,
    confidence,
    signals,
    bucketMatches
  };
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
