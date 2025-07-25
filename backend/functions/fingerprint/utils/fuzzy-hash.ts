/**
 * Advanced Fuzzy Hashing for Fingerprint Similarity Detection
 *
 * This module implements locality-sensitive hashing (LSH) to enable
 * similarity detection between fingerprints that are nearly identical
 * but not exact matches.
 *
 * Refactored to directly use complete fingerprint interface objects
 * instead of extracting stable features.
 */

import * as crypto from "crypto";
import type {
  CoreFingerprintData,
  AdvancedFingerprintData,
  BehavioralData,
} from "@shared/types/fingerprint";

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

// Predefined LSH bucket configurations using complete fingerprint objects
const LSH_BUCKET_CONFIGS: LSHBucketConfig[] = [
  {
    name: "coreHardware",
    extractor: (core, _advanced) => {
      const data = {
        canvas: core.canvas?.substring(0, 32) || "",
        webglVendor: core.webgl?.vendor || "",
        webglRenderer: core.webgl?.renderer || "",
        audioContext: core.audio?.contextHash?.substring(0, 16) || "",
      };
      return crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex")
        .substring(0, 16);
    },
    entropy: 0.95,
    weight: 1.0,
    collisionProbability: 0.001,
  },
  {
    name: "deviceRendering",
    extractor: (core) => {
      // Use webgl parameters and canvas as screen substitute
      const data = {
        webglParams: core.webgl?.parameters
          ? JSON.stringify(core.webgl.parameters).substring(0, 100)
          : "",
        canvasHash: core.canvas?.substring(0, 32) || "",
        renderHash: core.webgl?.renderHash || "",
      };
      return crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex")
        .substring(0, 16);
    },
    entropy: 0.7,
    weight: 0.8,
    collisionProbability: 0.05,
  },
  {
    name: "browserEnvironment",
    extractor: (core) => {
      const data = {
        extensions: core.webgl?.extensions?.slice(0, 10).sort().join(",") || "",
        fonts: core.fonts?.systemFonts?.slice(0, 10).sort().join(",") || "",
        css: core.css?.supportedFeatures?.slice(0, 15).sort().join(",") || "",
        timezone: new Date().getTimezoneOffset().toString(),
        // Remove navigator reference for server-side compatibility
        audioTiming: core.timing?.cryptoTiming?.toString() || "0",
      };
      return crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex")
        .substring(0, 16);
    },
    entropy: 0.85,
    weight: 0.9,
    collisionProbability: 0.01,
  },
  {
    name: "networkProfile",
    extractor: (_core, advanced) => {
      const data = {
        webrtcIPs:
          advanced.webrtc?.localIPs?.slice(0, 3).sort().join(",") || "",
        candidateTypes: advanced.webrtc?.candidateTypes?.sort().join(",") || "",
        connectionType: advanced.network?.connection?.type || "unknown",
        rttRange: advanced.network?.analysis?.avgRTT
          ? Math.floor(advanced.network.analysis.avgRTT / 50) * 50
          : 0,
      };
      return crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex")
        .substring(0, 16);
    },
    entropy: 0.6,
    weight: 0.7,
    collisionProbability: 0.1,
  },
  {
    name: "hardwareCapabilities",
    extractor: (core, advanced) => {
      const data = {
        webglParams: core.webgl?.parameters
          ? JSON.stringify(core.webgl.parameters).substring(0, 100)
          : "",
        audioHash: core.audio?.contextHash || "",
        mediaDeviceCount:
          (advanced.mediaDevices?.videoInputs || 0) +
          (advanced.mediaDevices?.audioInputs || 0) +
          (advanced.mediaDevices?.audioOutputs || 0),
        batteryPresent: !!(advanced.battery?.level !== undefined),
        sensorsAvailable:
          advanced.sensors?.accelerometer?.available ||
          advanced.sensors?.gyroscope?.available ||
          false,
      };
      return crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex")
        .substring(0, 16);
    },
    entropy: 0.8,
    weight: 0.85,
    collisionProbability: 0.02,
  },
  {
    name: "performanceProfile",
    extractor: (core) => {
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
      return crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex")
        .substring(0, 16);
    },
    entropy: 0.75,
    weight: 0.6,
    collisionProbability: 0.03,
  },
  {
    name: "behavioralSignature",
    extractor: (_core, _advanced, behavioral) => {
      if (!behavioral) return "";
      const data = {
        mouseEntropy: behavioral.mouseMovements?.entropy || 0,
        typingSpeed: behavioral.keyboardPatterns?.typingSpeed || 0,
        touchAvailable: !!behavioral.touchBehavior,
        scrollPatterns: behavioral.scrollBehavior?.patterns?.length || 0,
      };
      return crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex")
        .substring(0, 16);
    },
    entropy: 0.9,
    weight: 1.2,
    collisionProbability: 0.005,
  },
  {
    name: "userIdentity",
    extractor: (core, _advanced, _behavioral, userId) => {
      const data = {
        userId: userId || "",
        // Combine with some device characteristics for stronger binding
        canvas: core.canvas?.substring(0, 16) || "",
        webglVendor: core.webgl?.vendor || "",
      };
      return crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex")
        .substring(0, 16);
    },
    entropy: 1.0,
    weight: 1.5,
    collisionProbability: 0.0001,
  },
];

/**
 * Generate LSH hashes directly from complete fingerprint objects
 */
export function generateLocalitySensitiveHashes(
  coreFingerprint: CoreFingerprintData,
  advancedFingerprint: AdvancedFingerprintData,
  behavioralData?: BehavioralData,
  userId?: string
): string[] {
  return LSH_BUCKET_CONFIGS.map((config) =>
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
  for (
    let i = 0;
    i < Math.min(hashes1.length, hashes2.length, LSH_BUCKET_CONFIGS.length);
    i++
  ) {
    const config = LSH_BUCKET_CONFIGS[i];
    if (!config) continue; // Safety check

    const matched = hashes1[i] === hashes2[i];
    const weight = config.weight || 1.0;
    const entropy = config.entropy || 0.5;

    bucketMatches.push({
      bucketName: config.name,
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
  // Create a hash that's more stable than SHA256 of the entire object
  // by focusing on the most stable and identifying components
  const reducedData = {
    core: {
      canvas: coreFingerprint.canvas?.substring(0, 32) || "",
      webgl: `${coreFingerprint.webgl?.vendor || ""}-${
        coreFingerprint.webgl?.renderer || ""
      }`,
      audio: coreFingerprint.audio?.contextHash || "",
    },
    device: {
      screen: coreFingerprint.webgl?.parameters
        ? JSON.stringify(coreFingerprint.webgl.parameters).substring(0, 50)
        : "",
      timezone: new Date().getTimezoneOffset().toString(),
      // Remove navigator reference for server-side compatibility
      timing: coreFingerprint.timing?.cryptoTiming?.toString() || "0",
    },
    browser: {
      extensions:
        coreFingerprint.webgl?.extensions?.slice(0, 10).sort().join(",") || "",
      fonts:
        coreFingerprint.fonts?.systemFonts?.slice(0, 10).sort().join(",") || "",
      cssFeatures:
        coreFingerprint.css?.supportedFeatures?.slice(0, 10).sort().join(",") ||
        "",
    },
    network: {
      webrtcIPs:
        advancedFingerprint.webrtc?.localIPs?.slice(0, 3).sort().join(",") ||
        "",
    },
    user: {
      userId: userId || "", // Include userId in hash
    },
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(reducedData))
    .digest("hex");
}
