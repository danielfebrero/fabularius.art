/**
 * Advanced Fuzzy Hashing for Fingerprint Similarity Detection
 *
 * This module implements locality-sensitive hashing       extractor: (

        _core: CoreFingerprintData,

            extractor: (core: CoreFingerprin      extractor: (
        _core:      extractor: (
        core: CoreFingerprintData,
        _advanced: AdvancedFingerprintData,
        _behavioral?: BehavioralFingerprint,
        userId?: string
      ) => {
        const userIdStr = userId || "";
        const canvas = core.canvas?.substring(0, 16) || "";
        const webglVendor = core.webgl?.vendor || "";
        const dataStr = `${userIdStr}|${canvas}|${webglVendor}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 16);
      },ntData,
        _advanced: AdvancedFingerprintData,
        behavioral?: BehavioralFingerprint
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
 * 
 * New candidate matching features:
 * - Low-confidence userId and IP buckets for candidate identification
 * - analyzeBucketMatches() to separate strong signals from candidate signals
 * - isGoodCandidate() to determine if a match warrants further investigation
 * 
 * Example usage:
 * ```typescript
 * const result = calculateLSHSimilarity(hashes1, hashes2);
 * const candidate = isGoodCandidate(result.similarity, result.confidence, result.candidateAnalysis);
 * if (candidate.isCandidate) {
 *   console.log(`Potential match: ${candidate.reason} (score: ${candidate.candidateScore})`);
 * }
 * ```
 */

import * as crypto from "crypto";
import type {
  CoreFingerprintData,
  AdvancedFingerprintData,
  BehavioralFingerprint,
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
    behavioral?: BehavioralFingerprint,
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
// - MD5: Used for lower-entropy, performance-sensitive buckets (deviceRendering, networkProfile, performanceProfile, userId, userIP)
//
// Performance optimizations applied:
// - String concatenation instead of JSON.stringify for better performance
// - Pipe delimiter (|) used to separate fields for consistent serialization
// - Memoized hashing available for frequently repeated computations
//
// Candidate matching buckets:
// - userId: Low-confidence matching for user identification candidates
// - userIP: Very low-confidence for rough geolocation/network-based grouping
export const LSH_BUCKET_MAP = new Map<string, LSHBucketMapConfig>([
  [
    "coreHardware",
    {
      extractor: (
        core: CoreFingerprintData,
        _advanced: AdvancedFingerprintData
      ) => {
        const dataStr = `${core.canvas?.basic?.substring(0, 32) || ""}|${
          core.webgl?.vendor || ""
        }|${core.webgl?.renderer || ""}|${
          core.audio?.contextHashes?.oscillator?.substring(0, 16) || ""
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
          core.canvas?.basic?.substring(0, 32) || ""
        }|${core.webgl?.renderHashes?.basic || ""}`;
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
          Object.keys(core.css?.cssFeatures || {})
            .slice(0, 15)
            .sort()
            .join(",") || "";
        const timezone = new Date().getTimezoneOffset().toString();
        const audioTiming =
          Object.values(
            core.timing?.performanceTimings?.cryptoOperations || {}
          )[0]?.toString() || "0";
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
        const audioHash = core.audio?.contextHashes?.hybrid || "";
        const mediaDeviceCount =
          (advanced.mediaDevices?.devices?.videoInputs?.length || 0) +
          (advanced.mediaDevices?.devices?.audioInputs?.length || 0) +
          (advanced.mediaDevices?.devices?.audioOutputs?.length || 0);
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
        const cryptoOperations = timing.performanceTimings?.cryptoOperations;
        const regexOperations = timing.performanceTimings?.regexOperations;
        const sortingAlgorithms = timing.performanceTimings?.sortingAlgorithms;

        const cryptoValues = cryptoOperations
          ? Object.values(cryptoOperations)
          : [];
        const regexValues = regexOperations
          ? Object.values(regexOperations)
          : [];
        const sortingValues = sortingAlgorithms
          ? Object.values(sortingAlgorithms)
          : [];

        const cryptoRange =
          cryptoValues.length > 0 && typeof cryptoValues[0] === "number"
            ? Math.floor(cryptoValues[0] / 10) * 10
            : 0;
        const regexRange =
          regexValues.length > 0 && typeof regexValues[0] === "number"
            ? Math.floor(regexValues[0] / 5) * 5
            : 0;
        const sortRange =
          sortingValues.length > 0 && typeof sortingValues[0] === "number"
            ? Math.floor(sortingValues[0] / 5) * 5
            : 0;
        const wasmSupported = !!timing.wasmTimings?.isSupported;

        const dataStr = `${cryptoRange}|${regexRange}|${sortRange}|${wasmSupported}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.MD5, 16);
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
        behavioral?: BehavioralFingerprint
      ) => {
        if (!behavioral || !behavioral.available) return "";

        // Focus on stable, identifying characteristics that persist across sessions
        // Use pre-computed signatures that are already stable and identifying
        const mouseSignature =
          behavioral.signatures?.mouseSignature?.substring(0, 12) || "";
        const keyboardSignature =
          behavioral.signatures?.keyboardSignature?.substring(0, 12) || "";
        const touchSignature =
          behavioral.signatures?.touchSignature?.substring(0, 8) || "";

        // Simple human verification (stable across sessions for real users)
        const isHuman =
          behavioral.humanVerification?.overallHumanness > 0.7 ? "1" : "0";

        // Privacy level (indicates user's general privacy awareness pattern)
        const privacyLevel = behavioral.privacy?.consentLevel || "unknown";

        // Simple data quality indicator (high quality data suggests consistent user)
        const hasQualityData =
          (behavioral.collectionMetadata?.dataQuality || 0) > 0.5 ? "1" : "0";

        // Combine stable behavioral identifiers
        const dataStr = `${mouseSignature}|${keyboardSignature}|${touchSignature}|${isHuman}|${privacyLevel}|${hasQualityData}`;

        return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 16);
      },
      entropy: 0.7, // Moderate entropy - stable but not too variable
      weight: 0.8, // Moderate weight - good signal but allows for behavioral variation
      collisionProbability: 0.05, // Higher collision probability to allow user identification across sessions
    },
  ],
  [
    "userIdentity",
    {
      extractor: (
        core: CoreFingerprintData,
        _advanced: AdvancedFingerprintData,
        _behavioral?: BehavioralFingerprint,
        userId?: string
      ) => {
        const userIdStr = userId || "";
        const canvas = core.canvas?.basic?.substring(0, 16) || "";
        const webglVendor = core.webgl?.vendor || "";
        const dataStr = `${userIdStr}|${canvas}|${webglVendor}`;
        return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 16);
      },
      entropy: 1.0,
      weight: 1.5,
      collisionProbability: 0.0001,
    },
  ],
  [
    "userId",
    {
      extractor: (
        _core: CoreFingerprintData,
        _advanced: AdvancedFingerprintData,
        _behavioral?: BehavioralFingerprint,
        userId?: string
      ) => {
        // Simple userId hash for candidate matching - low confidence
        return userId ? createShortHash(userId, HASH_ALGORITHMS.MD5, 16) : "";
      },
      entropy: 0.3, // Low entropy - easily spoofable
      weight: 0.2, // Low weight - good for candidates, not strong signal
      collisionProbability: 0.5, // High collision probability
    },
  ],
  [
    "userIP",
    {
      extractor: (
        _core: CoreFingerprintData,
        advanced: AdvancedFingerprintData,
        _behavioral?: BehavioralFingerprint,
        _userId?: string
      ) => {
        // Use external IP if available, otherwise fall back to local IPs or connection info
        // Note: This assumes external IP might be added to the advanced fingerprint data
        const externalIP =
          (advanced as any)?.network?.externalIP ||
          advanced.webrtc?.localIPs?.find(
            (ip) =>
              !ip.startsWith("192.168.") &&
              !ip.startsWith("10.") &&
              !ip.startsWith("172.16.")
          ) ||
          advanced.webrtc?.localIPs?.[0] ||
          "";
        return externalIP
          ? createShortHash(externalIP, HASH_ALGORITHMS.MD5, 16)
          : "";
      },
      entropy: 0.2, // Very low entropy - many users share IPs
      weight: 0.1, // Very low weight - good for rough geolocation matching
      collisionProbability: 0.8, // Very high collision probability
    },
  ],
]);

/**
 * Generate LSH hashes directly from complete fingerprint objects
 */
export function generateLocalitySensitiveHashes(
  coreFingerprint: CoreFingerprintData,
  advancedFingerprint: AdvancedFingerprintData,
  BehavioralFingerprint?: BehavioralFingerprint,
  userId?: string
): string[] {
  return Array.from(LSH_BUCKET_MAP.entries()).map(([_name, config]) =>
    config.extractor(
      coreFingerprint,
      advancedFingerprint,
      BehavioralFingerprint,
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
 * Analyze bucket matches to identify potential candidates
 * Separates high-confidence signals from low-confidence candidate indicators
 */
export function analyzeBucketMatches(
  bucketMatches: Array<{
    bucketName: string;
    matched: boolean;
    weight: number;
    entropy: number;
  }>
): {
  strongSignals: string[];
  candidateSignals: string[];
  hasUserIdMatch: boolean;
  hasIpMatch: boolean;
} {
  const strongSignals: string[] = [];
  const candidateSignals: string[] = [];
  let hasUserIdMatch = false;
  let hasIpMatch = false;

  bucketMatches.forEach((match) => {
    if (match.matched) {
      if (match.bucketName === "userId") {
        hasUserIdMatch = true;
        candidateSignals.push(match.bucketName);
      } else if (match.bucketName === "userIP") {
        hasIpMatch = true;
        candidateSignals.push(match.bucketName);
      } else if (match.weight >= 0.5 && match.entropy >= 0.5) {
        // High-confidence signals
        strongSignals.push(match.bucketName);
      } else {
        // Other low-confidence signals
        candidateSignals.push(match.bucketName);
      }
    }
  });

  return {
    strongSignals,
    candidateSignals,
    hasUserIdMatch,
    hasIpMatch,
  };
}

/**
 * Determine if a fingerprint comparison indicates a good candidate match
 * Based on combination of similarity score and candidate signals
 */
export function isGoodCandidate(
  similarity: number,
  confidence: number,
  candidateAnalysis: {
    strongSignals: string[];
    candidateSignals: string[];
    hasUserIdMatch: boolean;
    hasIpMatch: boolean;
  }
): {
  isCandidate: boolean;
  reason: string;
  candidateScore: number;
} {
  // Base candidate score from similarity and confidence
  let candidateScore = similarity * 0.7 + confidence * 0.3;

  // Boost score based on candidate signals
  if (candidateAnalysis.hasUserIdMatch) {
    candidateScore += 0.3; // Strong candidate indicator
  }

  if (candidateAnalysis.hasIpMatch) {
    candidateScore += 0.1; // Weak but helpful indicator
  }

  // Additional boost for having some strong signals even with low overall similarity
  if (candidateAnalysis.strongSignals.length > 0) {
    candidateScore += candidateAnalysis.strongSignals.length * 0.1;
  }

  // Determine if it's a good candidate
  const isCandidate = candidateScore > 0.3; // Lower threshold for candidates

  // Generate reason
  let reason = "";
  if (candidateAnalysis.hasUserIdMatch && candidateAnalysis.hasIpMatch) {
    reason = "Same user ID and IP with some fingerprint similarity";
  } else if (candidateAnalysis.hasUserIdMatch) {
    reason = "Same user ID with some fingerprint similarity";
  } else if (
    candidateAnalysis.hasIpMatch &&
    candidateAnalysis.strongSignals.length > 0
  ) {
    reason = "Same IP with strong fingerprint signals";
  } else if (candidateAnalysis.strongSignals.length >= 2) {
    reason = `Multiple strong fingerprint matches: ${candidateAnalysis.strongSignals.join(
      ", "
    )}`;
  } else if (similarity > 0.5) {
    reason = "High fingerprint similarity";
  } else {
    reason = "Low similarity, not a good candidate";
  }

  return {
    isCandidate,
    reason,
    candidateScore: Math.min(candidateScore, 1.0),
  };
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
  candidateAnalysis: {
    strongSignals: string[];
    candidateSignals: string[];
    hasUserIdMatch: boolean;
    hasIpMatch: boolean;
  };
} {
  if (!hashes1.length || !hashes2.length) {
    return {
      similarity: 0,
      confidence: 0,
      signals: 0,
      bucketMatches: [],
      candidateAnalysis: {
        strongSignals: [],
        candidateSignals: [],
        hasUserIdMatch: false,
        hasIpMatch: false,
      },
    };
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

  // Analyze bucket matches for candidate identification
  const candidateAnalysis = analyzeBucketMatches(bucketMatches);

  return {
    similarity,
    confidence,
    signals,
    bucketMatches,
    candidateAnalysis,
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
  const canvas = coreFingerprint.canvas?.basic?.substring(0, 32) || "";
  const webgl = `${coreFingerprint.webgl?.vendor || ""}-${
    coreFingerprint.webgl?.renderer || ""
  }`;
  const audio =
    Object.values(coreFingerprint.audio?.contextHashes || {})
      .slice(0, 10)
      .sort()
      .join(",") || "";
  const screen = coreFingerprint.webgl?.parameters
    ? JSON.stringify(coreFingerprint.webgl.parameters).substring(0, 50)
    : "";
  const timezone = new Date().getTimezoneOffset().toString();
  const timing =
    Object.values(
      coreFingerprint.timing?.performanceTimings?.cryptoOperations || {}
    )[0]?.toString() || "0";
  const extensions =
    coreFingerprint.webgl?.extensions?.slice(0, 10).sort().join(",") || "";
  const fonts =
    coreFingerprint.fonts?.systemFonts?.slice(0, 10).sort().join(",") || "";
  const cssFeatures =
    Object.keys(coreFingerprint.css?.cssFeatures || {})
      .slice(0, 10)
      .sort()
      .join(",") || "";
  const webrtcIPs =
    advancedFingerprint.webrtc?.localIPs?.slice(0, 3).sort().join(",") || "";
  const userIdStr = userId || "";

  const dataStr = `${canvas}|${webgl}|${audio}|${screen}|${timezone}|${timing}|${extensions}|${fonts}|${cssFeatures}|${webrtcIPs}|${userIdStr}`;
  return createShortHash(dataStr, HASH_ALGORITHMS.SHA256, 64);
}
