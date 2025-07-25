/**
 * Advanced Fuzzy Hashing for Fingerprint Similarity Detection
 *
 * This module implements locality-sensitive hashing       extractor: (
        _core: CoreFingerprintData,
            extractor: (core: CoreFingerprin      extractor: (
        _core:      extractor: (
        core: CoreFingerprintData,
        _advanced: AdvancedFingerprintData,
        _behavioral?: BehavioralData,
        userId?: string
      ) => {
        const userIdStr = userId || "";
        const canvas = core.canvas?.substring(0, 16) || "";
        const webglVendor = core.webgl?.vendor || "";
        const dataStr = `${userIdStr}|${canvas}|${webglVendor}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 16);
      },ntData,
        _advanced: AdvancedFingerprintData,
        behavioral?: BehavioralData
      ) => {
        if (!behavioral) return "";
        const mouseEntropy = behavioral.mouseMovements?.entropy || 0;
        const typingSpeed = behavioral.keyboardPatterns?.typingSpeed || 0;
        const touchAvailable = !!behavioral.touchBehavior;
        const scrollPatterns = behavioral.scrollBehavior?.patterns?.length || 0;
        const dataStr = `${mouseEntropy}|${typingSpeed}|${touchAvailable}|${scrollPatterns}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 16);
      },      const timing = core.timing || {};
        const cryptoRange = timing.cryptoTiming
          ? Math.floor(timing.cryptoTiming / 10) * 10
          : 0;
        const regexRange = timing.regexTiming
          ? Math.floor(timing.regexTiming / 5) * 5
          : 0;
        const sortRange = timing.sortTiming
          ? Math.floor(timing.sortTiming / 5) * 5
          : 0;
        const wasmSupported = !!timing.wasmTiming;
        const dataStr = `${cryptoRange}|${regexRange}|${sortRange}|${wasmSupported}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.MD5, 16);
      },ncedFingerprintData
      ) => {
        const webrtcIPs = advanced.webrtc?.localIPs?.slice(0, 3).sort().join(",") || "";
        const candidateTypes = advanced.webrtc?.candidateTypes?.sort().join(",") || "";
        const connectionType = advanced.network?.connection?.type || "unknown";
        const rttRange = advanced.network?.analysis?.avgRTT
          ? Math.floor(advanced.network.analysis.avgRTT / 50) * 50
          : 0;
        const dataStr = `${webrtcIPs}|${candidateTypes}|${connectionType}|${rttRange}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.MD5, 16);
      }, * similarity detection between fingerprints that are nearly identical
 * but not exact matches.
 *
 * Refactored to directly use complete fingerprint interface objects
 * instead of extracting stable features. Uses Map-based bucket
 * configuration for easier management and lookup.
 */

import * as crypto from "crypto";
import type {
  CoreFingerprintData,
  AdvancedFingerprintData,
  BehavioralData,
} from "@shared/types/fingerprint";

/**
 * Create a short hash from data for LSH bucket identification
 * Centralized hashing logic for consistency and easy algorithm swapping
 *
 * @param data - The data to hash (string or object that will be JSON stringified)
 * @param algorithm - Hash algorithm ('md5', 'sha256', etc.).
 *                   SHA256 preferred for better collision resistance, MD5 for speed
 * @param length - Length of the output hash substring (default 16)
 * @returns Short hash string
 */
function createShortHash(
  data: string | any,
  algorithm: string = "md5",
  length: number = 16
): string {
  const input = typeof data === "string" ? data : JSON.stringify(data);
  return crypto
    .createHash(algorithm)
    .update(input)
    .digest("hex")
    .substring(0, length);
}

/**
 * Hash algorithm constants for better type safety and documentation
 */
const HASH_ALGORITHMS = {
  MD5: "md5", // Fast, good for non-security-critical LSH buckets
  SHA256: "sha256", // Better collision resistance, recommended for critical buckets
} as const;

/**
 * Cache for memoized hash results to avoid repeated computation
 * Key format: "{algorithm}:{length}:{data}" -> hash result
 */
const hashCache = new Map<string, string>();

/**
 * Clear the hash cache (useful for testing or memory management)
 */
export function clearHashCache(): void {
  hashCache.clear();
}

/**
 * Get current hash cache size (useful for monitoring)
 */
export function getHashCacheSize(): number {
  return hashCache.size;
}

// LSH bucket configuration type with direct fingerprint object access
interface LSHBucketConfig {
  name: string;
  extractor: (
    core: CoreFingerprintData,
    advanced: AdvancedFingerprintData,
    behavioral?: BehavioralData,
    userId?: string
  ) => string;
  entropy: number; // Calculated entropy weight (0-1, higher = more unique)
  weight: number; // Final weight for similarity calculations
  collisionProbability: number; // Estimated collision probability
}

// Bucket configuration without name property for Map values
type LSHBucketMapConfig = Omit<LSHBucketConfig, "name">;

// Predefined LSH bucket configurations using a Map for easier lookup and management
// Hash algorithm selection strategy:
// - SHA256: Used for high-entropy, security-critical buckets (coreHardware, browserEnvironment, hardwareCapabilities, behavioralSignature, userIdentity)
// - MD5: Used for lower-entropy, performance-sensitive buckets (deviceRendering, networkProfile, performanceProfile)
//
// Performance optimizations applied:
// - String concatenation instead of JSON.stringify for better performance
// - Pipe delimiter (|) used to separate fields for consistent serialization
// - Memoized hashing available for frequently repeated computations
const LSH_BUCKET_MAP = new Map<string, LSHBucketMapConfig>([
  [
    "coreHardware",
    {
      extractor: (
        core: CoreFingerprintData,
        _advanced: AdvancedFingerprintData
      ) => {
        const dataStr = `${core.canvas?.substring(0, 32) || ""}|${
          core.webgl?.vendor || ""
        }|${core.webgl?.renderer || ""}|${
          core.audio?.contextHash?.substring(0, 16) || ""
        }`;
        return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 16);
      },
      entropy: 0.95,
      weight: 1.0,
      collisionProbability: 0.001,
    },
  ],
  [
    "deviceRendering",
    {
      extractor: (core: CoreFingerprintData) => {
        // Use webgl parameters and canvas as screen substitute
        const webglParams = core.webgl?.parameters
          ? JSON.stringify(core.webgl.parameters).substring(0, 100)
          : "";
        const dataStr = `${webglParams}|${
          core.canvas?.substring(0, 32) || ""
        }|${core.webgl?.renderHash || ""}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.MD5, 16);
      },
      entropy: 0.7,
      weight: 0.8,
      collisionProbability: 0.05,
    },
  ],
  [
    "browserEnvironment",
    {
      extractor: (core: CoreFingerprintData) => {
        const extensions =
          core.webgl?.extensions?.slice(0, 10).sort().join(",") || "";
        const fonts =
          core.fonts?.systemFonts?.slice(0, 10).sort().join(",") || "";
        const css =
          core.css?.supportedFeatures?.slice(0, 15).sort().join(",") || "";
        const timezone = new Date().getTimezoneOffset().toString();
        const audioTiming = core.timing?.cryptoTiming?.toString() || "0";
        const dataStr = `${extensions}|${fonts}|${css}|${timezone}|${audioTiming}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 16);
      },
      entropy: 0.85,
      weight: 0.9,
      collisionProbability: 0.01,
    },
  ],
  [
    "networkProfile",
    {
      extractor: (
        _core: CoreFingerprintData,
        advanced: AdvancedFingerprintData
      ) => {
        const data = {
          webrtcIPs:
            advanced.webrtc?.localIPs?.slice(0, 3).sort().join(",") || "",
          candidateTypes:
            advanced.webrtc?.candidateTypes?.sort().join(",") || "",
          connectionType: advanced.network?.connection?.type || "unknown",
          rttRange: advanced.network?.analysis?.avgRTT
            ? Math.floor(advanced.network.analysis.avgRTT / 50) * 50
            : 0,
        };
        return createShortHash(data, HASH_ALGORITHMS.MD5, 16);
      },
      entropy: 0.6,
      weight: 0.7,
      collisionProbability: 0.1,
    },
  ],
  [
    "hardwareCapabilities",
    {
      extractor: (
        core: CoreFingerprintData,
        advanced: AdvancedFingerprintData
      ) => {
        const webglParams = core.webgl?.parameters
          ? JSON.stringify(core.webgl.parameters).substring(0, 100)
          : "";
        const audioHash = core.audio?.contextHash || "";
        const mediaDeviceCount =
          (advanced.mediaDevices?.videoInputs || 0) +
          (advanced.mediaDevices?.audioInputs || 0) +
          (advanced.mediaDevices?.audioOutputs || 0);
        const batteryPresent = !!(advanced.battery?.level !== undefined);
        const sensorsAvailable =
          advanced.sensors?.accelerometer?.available ||
          advanced.sensors?.gyroscope?.available ||
          false;
        const dataStr = `${webglParams}|${audioHash}|${mediaDeviceCount}|${batteryPresent}|${sensorsAvailable}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 16);
      },
      entropy: 0.8,
      weight: 0.85,
      collisionProbability: 0.02,
    },
  ],
  [
    "performanceProfile",
    {
      extractor: (core: CoreFingerprintData) => {
        const timing = core.timing || {};
        const data = {
          cryptoRange: timing.cryptoTiming
            ? Math.floor(timing.cryptoTiming / 10) * 10
            : 0,
          regexRange: timing.regexTiming
            ? Math.floor(timing.regexTiming / 5) * 5
            : 0,
          sortRange: timing.sortTiming
            ? Math.floor(timing.sortTiming / 5) * 5
            : 0,
          wasmSupported: !!timing.wasmTiming,
        };
        return createShortHash(data, HASH_ALGORITHMS.MD5, 16);
      },
      entropy: 0.75,
      weight: 0.6,
      collisionProbability: 0.03,
    },
  ],
  [
    "behavioralSignature",
    {
      extractor: (
        _core: CoreFingerprintData,
        _advanced: AdvancedFingerprintData,
        behavioral?: BehavioralData
      ) => {
        if (!behavioral) return "";
        const data = {
          mouseEntropy: behavioral.mouseMovements?.entropy || 0,
          typingSpeed: behavioral.keyboardPatterns?.typingSpeed || 0,
          touchAvailable: !!behavioral.touchBehavior,
          scrollPatterns: behavioral.scrollBehavior?.patterns?.length || 0,
        };
        return createShortHash(data, HASH_ALGORITHMS.SHA256, 16);
      },
      entropy: 0.9,
      weight: 1.2,
      collisionProbability: 0.005,
    },
  ],
  [
    "userIdentity",
    {
      extractor: (
        core: CoreFingerprintData,
        _advanced: AdvancedFingerprintData,
        _behavioral?: BehavioralData,
        userId?: string
      ) => {
        const data = {
          userId: userId || "",
          // Combine with some device characteristics for stronger binding
          canvas: core.canvas?.substring(0, 16) || "",
          webglVendor: core.webgl?.vendor || "",
        };
        return createShortHash(data, HASH_ALGORITHMS.SHA256, 16);
      },
      entropy: 1.0,
      weight: 1.5,
      collisionProbability: 0.0001,
    },
  ],
]);

/**
 * Generate LSH hashes directly from complete fingerprint objects
 */
export function generateLocalitySensitiveHashes(
  coreFingerprint: CoreFingerprintData,
  advancedFingerprint: AdvancedFingerprintData,
  behavioralData?: BehavioralData,
  userId?: string
): string[] {
  return Array.from(LSH_BUCKET_MAP.entries()).map(([_name, config]) =>
    config.extractor(
      coreFingerprint,
      advancedFingerprint,
      behavioralData,
      userId
    )
  );
}

/**
 * Get LSH bucket configurations for external analysis
 */
export function getLSHBucketConfigs(): LSHBucketConfig[] {
  return Array.from(LSH_BUCKET_MAP.entries()).map(([name, config]) => ({
    name,
    ...config,
  }));
}

/**
 * Add or update a bucket configuration
 */
export function setBucketConfig(
  name: string,
  config: LSHBucketMapConfig
): void {
  LSH_BUCKET_MAP.set(name, config);
}

/**
 * Remove a bucket configuration
 */
export function removeBucketConfig(name: string): boolean {
  return LSH_BUCKET_MAP.delete(name);
}

/**
 * Get a specific bucket configuration by name
 */
export function getBucketConfig(name: string): LSHBucketMapConfig | undefined {
  return LSH_BUCKET_MAP.get(name);
}

/**
 * Get all bucket names in order
 */
export function getBucketNames(): string[] {
  return Array.from(LSH_BUCKET_MAP.keys());
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

  // Convert Map to array of entries for ordered comparison
  const bucketEntries = Array.from(LSH_BUCKET_MAP.entries());

  // Compare each bucket with entropy weighting
  for (
    let i = 0;
    i < Math.min(hashes1.length, hashes2.length, bucketEntries.length);
    i++
  ) {
    const entry = bucketEntries[i];
    if (!entry) continue; // Safety check

    const [bucketName, config] = entry;
    const matched = hashes1[i] === hashes2[i];
    const weight = config.weight || 1.0;
    const entropy = config.entropy || 0.5;

    bucketMatches.push({
      bucketName,
      matched,
      weight,
      entropy,
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
  const signalBonus = Math.min(signals / bucketEntries.length, 1.0);
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
    bucketMatches,
  };
}

/**
 * Generate a single "super hash" for exact matching while preserving some fuzzy capability
 * Now directly uses complete fingerprint objects instead of stable features
 */
export function generateFuzzyFingerprintHash(
  coreFingerprint: CoreFingerprintData,
  advancedFingerprint: AdvancedFingerprintData,
  userId?: string
): string {
  // Create a hash using lightweight string concatenation instead of JSON.stringify
  // Focus on the most stable and identifying components
  const canvas = coreFingerprint.canvas?.substring(0, 32) || "";
  const webgl = `${coreFingerprint.webgl?.vendor || ""}-${
    coreFingerprint.webgl?.renderer || ""
  }`;
  const audio = coreFingerprint.audio?.contextHash || "";
  const screen = coreFingerprint.webgl?.parameters
    ? JSON.stringify(coreFingerprint.webgl.parameters).substring(0, 50)
    : "";
  const timezone = new Date().getTimezoneOffset().toString();
  const timing = coreFingerprint.timing?.cryptoTiming?.toString() || "0";
  const extensions =
    coreFingerprint.webgl?.extensions?.slice(0, 10).sort().join(",") || "";
  const fonts =
    coreFingerprint.fonts?.systemFonts?.slice(0, 10).sort().join(",") || "";
  const cssFeatures =
    coreFingerprint.css?.supportedFeatures?.slice(0, 10).sort().join(",") || "";
  const webrtcIPs =
    advancedFingerprint.webrtc?.localIPs?.slice(0, 3).sort().join(",") || "";
  const userIdStr = userId || "";

  const dataStr = `${canvas}|${webgl}|${audio}|${screen}|${timezone}|${timing}|${extensions}|${fonts}|${cssFeatures}|${webrtcIPs}|${userIdStr}`;
  return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 64);
}
