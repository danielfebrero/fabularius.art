import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import * as crypto from "crypto";
import {
  FingerprintEntity,
  FingerprintSessionEntity,
  FingerprintAnalyticsEntity,
  FingerprintCollectionRequest,
  BehavioralFingerprint,
} from "@shared/types/fingerprint";
import {
  UniqueVisitor,
  BehavioralSignature,
  VisitSession,
  SessionBehavior,
} from "@shared/types/visitor-analytics";
import {
  generateLocalitySensitiveHashes,
  generateFuzzyFingerprintHash,
  calculateLSHSimilarity,
  getLSHBucketConfigs,
  LSH_BUCKET_MAP,
} from "./fuzzy-hash";
import { DEFAULT_ENTROPY_WEIGHTS } from "./config";

// Match the isLocal/clientConfig logic from dynamodb.ts
const isLocal = process.env["AWS_SAM_LOCAL"] === "true";
const clientConfig: any = {};

if (isLocal) {
  clientConfig.endpoint = "http://pornspot-local-aws:4566";
  clientConfig.region = "us-east-1";
  clientConfig.credentials = {
    accessKeyId: "test",
    secretAccessKey: "test",
  };
}

const client = new DynamoDBClient(clientConfig);

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env["DYNAMODB_TABLE"] || "pornspot-media";

export class FingerprintDatabaseService {
  /**
   * Generate a unique fingerprint ID
   */
  static generateFingerprintId(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate a hash from fingerprint data
   */
  static generateFingerprintHash(
    coreFingerprint: any,
    advancedFingerprint: any,
    userId?: string
  ): string {
    // Use the fuzzy fingerprint hash for better similarity detection
    return generateFuzzyFingerprintHash(
      coreFingerprint,
      advancedFingerprint,
      userId
    );
  }

  /**
   * Generate multiple fuzzy hashes for similarity detection
   * Creates hashes from different component combinations to enable fuzzy matching
   */
  static generateFuzzyHashes(
    coreFingerprint: any,
    advancedFingerprint: any,
    behavioralData?: BehavioralFingerprint,
    userId?: string
  ): string[] {
    // Use the advanced LSH approach for better fuzzy matching
    const fuzzyHashes = generateLocalitySensitiveHashes(
      coreFingerprint,
      advancedFingerprint,
      behavioralData,
      userId
    );

    console.log("🔍 Generated fuzzy hashes:", {
      count: fuzzyHashes.length,
      hashes: fuzzyHashes,
      userId: userId ? "present" : "not provided",
      coreFeatures: {
        hasCanvas: !!coreFingerprint?.canvas,
        hasWebgl: !!coreFingerprint?.webgl,
        hasAudio: !!coreFingerprint?.audio,
        hasScreen: !!coreFingerprint?.screen,
      },
    });

    return fuzzyHashes;
  }

  /**
   * Calculate entropy for a given data object
   */
  static calculateEntropy(data: string): number {
    if (!data || data.length === 0) return 0;

    const freq: Record<string, number> = {};
    for (const char of data) {
      freq[char] = (freq[char] || 0) + 1;
    }

    const length = data.length;
    let entropy = 0;

    for (const count of Object.values(freq)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Calculate weighted entropy score for entire fingerprint
   */
  static calculateWeightedEntropy(
    coreFingerprint: any,
    advancedFingerprint: any,
    weights = DEFAULT_ENTROPY_WEIGHTS
  ): number {
    let totalEntropy = 0;
    let totalWeight = 0;

    // Core fingerprint entropy
    if (coreFingerprint.canvas) {
      const entropy = this.calculateEntropy(coreFingerprint.canvas);
      totalEntropy += entropy * weights.canvas;
      totalWeight += weights.canvas;
    }

    if (coreFingerprint.webgl) {
      const entropy = this.calculateEntropy(
        JSON.stringify(coreFingerprint.webgl)
      );
      totalEntropy += entropy * weights.webgl;
      totalWeight += weights.webgl;
    }

    if (coreFingerprint.audio) {
      const entropy = this.calculateEntropy(
        JSON.stringify(coreFingerprint.audio)
      );
      totalEntropy += entropy * weights.audio;
      totalWeight += weights.audio;
    }

    if (coreFingerprint.fonts) {
      const entropy = this.calculateEntropy(
        JSON.stringify(coreFingerprint.fonts)
      );
      totalEntropy += entropy * weights.fonts;
      totalWeight += weights.fonts;
    }

    // Advanced fingerprint entropy
    if (advancedFingerprint.webrtc) {
      const entropy = this.calculateEntropy(
        JSON.stringify(advancedFingerprint.webrtc)
      );
      totalEntropy += entropy * weights.webrtc;
      totalWeight += weights.webrtc;
    }

    if (advancedFingerprint.battery) {
      const entropy = this.calculateEntropy(
        JSON.stringify(advancedFingerprint.battery)
      );
      totalEntropy += entropy * weights.battery;
      totalWeight += weights.battery;
    }

    // Add other advanced fingerprint components...

    return totalWeight > 0 ? totalEntropy / totalWeight : 0;
  }

  /**
   * Calculate entropy-weighted similarity between two fingerprints using LSH buckets
   * Improved version:
   * - Fixed typos in audio comparison (coreFingerprint vs core)
   * - Added comparisons for more components: CSS, Timing, WebAssembly, Storage, Plugins, Sensors, MediaDevices, Network, Behavioral, ServerEnhancement
   * - Used appropriate similarity metrics: Jaccard for arrays/sets, exact match for hashes/strings, normalized difference for numbers
   * - Incorporated component-specific entropy for dynamic weighting where available
   * - Enhanced combining logic: weighted average of LSH and legacy scores, biased towards LSH if signals are strong
   * - Handled missing data more gracefully
   * - Added more granular matchedComponents
   */
  static calculateSimilarity(
    fp1: FingerprintEntity,
    fp2: FingerprintEntity,
    weights = DEFAULT_ENTROPY_WEIGHTS
  ): {
    similarity: number;
    confidence: number;
    signals: number;
    matchedComponents: string[];
  } {
    let lshSimilarity = 0;
    let lshSignals = 0;
    let lshComponents: string[] = [];

    // If both fingerprints have fuzzy hashes, use the advanced LSH similarity
    if (
      fp1.fuzzyHashes &&
      fp2.fuzzyHashes &&
      fp1.fuzzyHashes.length > 0 &&
      fp2.fuzzyHashes.length > 0
    ) {
      const lshResult = calculateLSHSimilarity(
        fp1.fuzzyHashes,
        fp2.fuzzyHashes
      );

      // Extract matched components from bucket matches
      lshComponents = lshResult.bucketMatches
        .filter((bucket) => bucket.matched)
        .map((bucket) => bucket.bucketName);

      lshSimilarity = lshResult.similarity;
      lshSignals = lshResult.signals;
    }

    // Legacy similarity calculation for comprehensive component analysis
    let totalSimilarity = 0;
    let totalWeight = 0;
    const matchedComponents: string[] = [];

    // Helper function for Jaccard similarity
    const jaccardSimilarity = (set1: any[], set2: any[]): number => {
      const intersection = set1.filter((item) => set2.includes(item));
      const union = [...new Set([...set1, ...set2])];
      return union.length > 0 ? intersection.length / union.length : 0;
    };

    // Helper for normalized difference (for numbers)
    const normalizedDiff = (a: number, b: number): number => {
      if (a === undefined || b === undefined) return 0;
      const maxVal = Math.max(Math.abs(a), Math.abs(b));
      return maxVal > 0 ? 1 - Math.abs(a - b) / maxVal : 1;
    };

    // Canvas similarity
    if (fp1.coreFingerprint.canvas && fp2.coreFingerprint.canvas) {
      const similarity =
        fp1.coreFingerprint.canvas.basic === fp2.coreFingerprint.canvas.basic
          ? 1
          : 0;
      const dynamicWeight =
        (weights.canvas *
          (fp1.coreFingerprint.canvas.entropy +
            fp2.coreFingerprint.canvas.entropy)) /
        2;
      totalSimilarity += similarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (similarity > 0.8) matchedComponents.push("canvas");
    }

    // WebGL similarity
    if (fp1.coreFingerprint.webgl && fp2.coreFingerprint.webgl) {
      let webglSimilarity = 0;
      if (fp1.coreFingerprint.webgl.vendor === fp2.coreFingerprint.webgl.vendor)
        webglSimilarity += 0.2;
      if (
        fp1.coreFingerprint.webgl.renderer ===
        fp2.coreFingerprint.webgl.renderer
      )
        webglSimilarity += 0.2;
      if (
        fp1.coreFingerprint.webgl.unmaskedVendor ===
        fp2.coreFingerprint.webgl.unmaskedVendor
      )
        webglSimilarity += 0.1;
      if (
        fp1.coreFingerprint.webgl.unmaskedRenderer ===
        fp2.coreFingerprint.webgl.unmaskedRenderer
      )
        webglSimilarity += 0.1;
      webglSimilarity +=
        jaccardSimilarity(
          fp1.coreFingerprint.webgl.extensions,
          fp2.coreFingerprint.webgl.extensions
        ) * 0.2;
      const renderHashes1 = fp1.coreFingerprint.webgl.renderHashes;
      const renderHashes2 = fp2.coreFingerprint.webgl.renderHashes;
      if (renderHashes1 && renderHashes2) {
        let hashMatches = 0;
        (["basic", "triangle", "gradient", "floating"] as const).forEach(
          (key) => {
            if (renderHashes1[key] === renderHashes2[key]) hashMatches++;
          }
        );
        webglSimilarity += (hashMatches / 4) * 0.2;
      }
      const dynamicWeight =
        (weights.webgl *
          (fp1.coreFingerprint.webgl.entropy +
            fp2.coreFingerprint.webgl.entropy)) /
        2;
      totalSimilarity += webglSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (webglSimilarity > 0.8) matchedComponents.push("webgl");
    }

    // Audio similarity
    if (fp1.coreFingerprint.audio && fp2.coreFingerprint.audio) {
      let audioSimilarity = 0;
      const hashes1 = fp1.coreFingerprint.audio.contextHashes;
      const hashes2 = fp2.coreFingerprint.audio.contextHashes;
      if (hashes1 && hashes2) {
        const hashKeys = Object.keys(hashes1) as (keyof typeof hashes1)[];
        let matchingHashes = 0;
        hashKeys.forEach((key) => {
          if (hashes1[key] === hashes2[key]) matchingHashes++;
        });
        audioSimilarity += (matchingHashes / hashKeys.length) * 0.6;
      }
      audioSimilarity +=
        normalizedDiff(
          fp1.coreFingerprint.audio.sampleRate,
          fp2.coreFingerprint.audio.sampleRate
        ) * 0.1;
      audioSimilarity +=
        normalizedDiff(
          fp1.coreFingerprint.audio.compressionRatio,
          fp2.coreFingerprint.audio.compressionRatio
        ) * 0.1;
      audioSimilarity +=
        jaccardSimilarity(
          fp1.coreFingerprint.audio.audioCapabilities.audioFormats,
          fp2.coreFingerprint.audio.audioCapabilities.audioFormats
        ) * 0.2;
      const dynamicWeight =
        (weights.audio *
          (fp1.coreFingerprint.audio.entropy +
            fp2.coreFingerprint.audio.entropy)) /
        2;
      totalSimilarity += audioSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (audioSimilarity > 0.8) matchedComponents.push("audio");
    }

    // Font similarity
    if (fp1.coreFingerprint.fonts && fp2.coreFingerprint.fonts) {
      const fontSimilarity =
        jaccardSimilarity(
          fp1.coreFingerprint.fonts.availableFonts,
          fp2.coreFingerprint.fonts.availableFonts
        ) *
          0.5 +
        jaccardSimilarity(
          fp1.coreFingerprint.fonts.systemFonts,
          fp2.coreFingerprint.fonts.systemFonts
        ) *
          0.3 +
        jaccardSimilarity(
          fp1.coreFingerprint.fonts.webFonts,
          fp2.coreFingerprint.fonts.webFonts
        ) *
          0.2;
      const dynamicWeight =
        (weights.fonts *
          (fp1.coreFingerprint.fonts.entropy +
            fp2.coreFingerprint.fonts.entropy)) /
        2;
      totalSimilarity += fontSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (fontSimilarity > 0.8) matchedComponents.push("fonts");
    }

    // CSS similarity
    if (fp1.coreFingerprint.css && fp2.coreFingerprint.css) {
      let cssSimilarity = 0;
      cssSimilarity +=
        jaccardSimilarity(
          Object.keys(fp1.coreFingerprint.css.mediaQueries),
          Object.keys(fp2.coreFingerprint.css.mediaQueries)
        ) * 0.3;
      cssSimilarity +=
        jaccardSimilarity(
          Object.keys(fp1.coreFingerprint.css.cssFeatures),
          Object.keys(fp2.coreFingerprint.css.cssFeatures)
        ) * 0.3;
      cssSimilarity +=
        jaccardSimilarity(
          fp1.coreFingerprint.css.vendorPrefixes,
          fp2.coreFingerprint.css.vendorPrefixes
        ) * 0.2;
      // Compare computedStyles by matching values
      let styleMatches = 0;
      const styles1 = fp1.coreFingerprint.css.computedStyles;
      const styles2 = fp2.coreFingerprint.css.computedStyles;
      Object.keys(styles1).forEach((key) => {
        if (styles1[key] === styles2[key]) styleMatches++;
      });
      cssSimilarity += (styleMatches / Object.keys(styles1).length) * 0.2;
      const dynamicWeight =
        (weights.css *
          (fp1.coreFingerprint.css.entropy + fp2.coreFingerprint.css.entropy)) /
        2;
      totalSimilarity += cssSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (cssSimilarity > 0.8) matchedComponents.push("css");
    }

    // Timing similarity
    if (fp1.coreFingerprint.timing && fp2.coreFingerprint.timing) {
      let timingSimilarity = 0;
      // Average normalized diffs for performanceTimings subrecords
      const timings1 = fp1.coreFingerprint.timing.performanceTimings;
      const timings2 = fp2.coreFingerprint.timing.performanceTimings;
      let subSimilarity = 0;
      let subCount = 0;
      (Object.keys(timings1) as (keyof typeof timings1)[]).forEach(
        (category) => {
          Object.keys(timings1[category]).forEach((key) => {
            const value1 = timings1[category][key];
            const value2 = timings2[category][key];
            if (value1 !== undefined && value2 !== undefined) {
              subSimilarity += normalizedDiff(value1, value2);
              subCount++;
            }
          });
        }
      );
      timingSimilarity += (subSimilarity / subCount) * 0.4;
      // WASM timings
      if (
        fp1.coreFingerprint.timing.wasmTimings &&
        fp2.coreFingerprint.timing.wasmTimings
      ) {
        timingSimilarity +=
          normalizedDiff(
            fp1.coreFingerprint.timing.wasmTimings.compilationTime,
            fp2.coreFingerprint.timing.wasmTimings.compilationTime
          ) * 0.1;
        timingSimilarity +=
          normalizedDiff(
            fp1.coreFingerprint.timing.wasmTimings.executionTimings?.[
              "mathOperations"
            ] || 0,
            fp2.coreFingerprint.timing.wasmTimings.executionTimings?.[
              "mathOperations"
            ] || 0
          ) * 0.1;
      }
      // CPU benchmarks, etc.
      timingSimilarity +=
        normalizedDiff(
          fp1.coreFingerprint.timing.clockResolution,
          fp2.coreFingerprint.timing.clockResolution
        ) * 0.2;
      const dynamicWeight =
        (weights.timing *
          (fp1.coreFingerprint.timing.entropy +
            fp2.coreFingerprint.timing.entropy)) /
        2;
      totalSimilarity += timingSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (timingSimilarity > 0.8) matchedComponents.push("timing");
    }

    // WebRTC similarity
    if (fp1.advancedFingerprint.webrtc && fp2.advancedFingerprint.webrtc) {
      const ips1 = fp1.advancedFingerprint.webrtc.localIPs;
      const ips2 = fp2.advancedFingerprint.webrtc.localIPs;
      const ipSimilarity = jaccardSimilarity(ips1, ips2);
      let webrtcSimilarity = ipSimilarity * 0.5;
      webrtcSimilarity +=
        jaccardSimilarity(
          fp1.advancedFingerprint.webrtc.candidateTypes,
          fp2.advancedFingerprint.webrtc.candidateTypes
        ) * 0.2;
      webrtcSimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.webrtc.iceGatheringTime,
          fp2.advancedFingerprint.webrtc.iceGatheringTime
        ) * 0.1;
      webrtcSimilarity +=
        jaccardSimilarity(
          fp1.advancedFingerprint.webrtc.connectionTypes,
          fp2.advancedFingerprint.webrtc.connectionTypes
        ) * 0.1;
      webrtcSimilarity +=
        (fp1.advancedFingerprint.webrtc.fingerprint ===
        fp2.advancedFingerprint.webrtc.fingerprint
          ? 1
          : 0) * 0.1;
      const dynamicWeight =
        (weights.webrtc *
          (fp1.advancedFingerprint.webrtc.entropy +
            fp2.advancedFingerprint.webrtc.entropy)) /
        2;
      totalSimilarity += webrtcSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (webrtcSimilarity > 0.8) matchedComponents.push("webrtc");
    }

    // Battery similarity
    if (fp1.advancedFingerprint.battery && fp2.advancedFingerprint.battery) {
      let batterySimilarity =
        (fp1.advancedFingerprint.battery.batteryHash ===
        fp2.advancedFingerprint.battery.batteryHash
          ? 1
          : 0) * 0.4;
      batterySimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.battery.level || 0,
          fp2.advancedFingerprint.battery.level || 0
        ) * 0.2;
      batterySimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.battery.chargingTime || 0,
          fp2.advancedFingerprint.battery.chargingTime || 0
        ) * 0.1;
      batterySimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.battery.dischargingTime || 0,
          fp2.advancedFingerprint.battery.dischargingTime || 0
        ) * 0.1;
      batterySimilarity +=
        (fp1.advancedFingerprint.battery.hardwareSignature.capacityEstimate ===
        fp2.advancedFingerprint.battery.hardwareSignature.capacityEstimate
          ? 1
          : 0) * 0.2;
      const dynamicWeight =
        (weights.battery *
          (fp1.advancedFingerprint.battery.confidenceLevel / 100 +
            fp2.advancedFingerprint.battery.confidenceLevel / 100)) /
        2; // Using confidence as proxy if no entropy
      totalSimilarity += batterySimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (batterySimilarity > 0.8) matchedComponents.push("battery");
    }

    // MediaDevices similarity
    if (
      fp1.advancedFingerprint.mediaDevices &&
      fp2.advancedFingerprint.mediaDevices
    ) {
      let mediaSimilarity =
        (fp1.advancedFingerprint.mediaDevices.mediaDeviceHash ===
        fp2.advancedFingerprint.mediaDevices.mediaDeviceHash
          ? 1
          : 0) * 0.4;
      mediaSimilarity +=
        jaccardSimilarity(
          fp1.advancedFingerprint.mediaDevices.capabilities.video.audioFormats,
          fp2.advancedFingerprint.mediaDevices.capabilities.video.audioFormats
        ) * 0.2;
      mediaSimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.mediaDevices.devices.totalCount,
          fp2.advancedFingerprint.mediaDevices.devices.totalCount
        ) * 0.1;
      mediaSimilarity +=
        (fp1.advancedFingerprint.mediaDevices.hardwareSignature
          .deviceFingerprint ===
        fp2.advancedFingerprint.mediaDevices.hardwareSignature.deviceFingerprint
          ? 1
          : 0) * 0.3;
      const dynamicWeight =
        (weights.mediaDevices *
          (fp1.advancedFingerprint.mediaDevices.confidenceLevel / 100 +
            fp2.advancedFingerprint.mediaDevices.confidenceLevel / 100)) /
        2;
      totalSimilarity += mediaSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (mediaSimilarity > 0.8) matchedComponents.push("mediaDevices");
    }

    // Sensors similarity
    if (fp1.advancedFingerprint.sensors && fp2.advancedFingerprint.sensors) {
      let sensorsSimilarity =
        (fp1.advancedFingerprint.sensors.sensorHash ===
        fp2.advancedFingerprint.sensors.sensorHash
          ? 1
          : 0) * 0.4;
      sensorsSimilarity +=
        (fp1.advancedFingerprint.sensors.hardwareHash ===
        fp2.advancedFingerprint.sensors.hardwareHash
          ? 1
          : 0) * 0.3;
      sensorsSimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.sensors.correlation.stabilityScore,
          fp2.advancedFingerprint.sensors.correlation.stabilityScore
        ) * 0.1;
      sensorsSimilarity +=
        jaccardSimilarity(
          fp1.advancedFingerprint.sensors.capabilities.sensorTypes,
          fp2.advancedFingerprint.sensors.capabilities.sensorTypes
        ) * 0.2;
      const dynamicWeight =
        (weights.sensors *
          (fp1.advancedFingerprint.sensors.confidenceLevel / 100 +
            fp2.advancedFingerprint.sensors.confidenceLevel / 100)) /
        2;
      totalSimilarity += sensorsSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (sensorsSimilarity > 0.8) matchedComponents.push("sensors");
    }

    // Network similarity
    if (fp1.advancedFingerprint.network && fp2.advancedFingerprint.network) {
      let networkSimilarity =
        (fp1.advancedFingerprint.network.networkHash ===
        fp2.advancedFingerprint.network.networkHash
          ? 1
          : 0) * 0.3;
      networkSimilarity +=
        (fp1.advancedFingerprint.network.timingHash ===
        fp2.advancedFingerprint.network.timingHash
          ? 1
          : 0) * 0.2;
      networkSimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.network.analysis.avgRTT,
          fp2.advancedFingerprint.network.analysis.avgRTT
        ) * 0.1;
      networkSimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.network.bandwidth.estimated,
          fp2.advancedFingerprint.network.bandwidth.estimated
        ) * 0.1;
      networkSimilarity +=
        (fp1.advancedFingerprint.network.geographic.timezone ===
        fp2.advancedFingerprint.network.geographic.timezone
          ? 1
          : 0) * 0.1;
      networkSimilarity +=
        (fp1.advancedFingerprint.network.characteristics.proxy ===
        fp2.advancedFingerprint.network.characteristics.proxy
          ? 1
          : 0) * 0.1;
      networkSimilarity +=
        (fp1.advancedFingerprint.network.characteristics.vpn ===
        fp2.advancedFingerprint.network.characteristics.vpn
          ? 1
          : 0) * 0.1;
      const dynamicWeight =
        (weights.network *
          (fp1.advancedFingerprint.network.confidenceLevel / 100 +
            fp2.advancedFingerprint.network.confidenceLevel / 100)) /
        2;
      totalSimilarity += networkSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (networkSimilarity > 0.8) matchedComponents.push("network");
    }

    // WebAssembly similarity
    if (
      fp1.advancedFingerprint.webassembly &&
      fp2.advancedFingerprint.webassembly
    ) {
      let wasmSimilarity =
        jaccardSimilarity(
          Object.keys(fp1.advancedFingerprint.webassembly.capabilities),
          Object.keys(fp2.advancedFingerprint.webassembly.capabilities)
        ) * 0.3;
      wasmSimilarity +=
        (fp1.advancedFingerprint.webassembly.fingerprints.capabilityHash ===
        fp2.advancedFingerprint.webassembly.fingerprints.capabilityHash
          ? 1
          : 0) * 0.2;
      wasmSimilarity +=
        (fp1.advancedFingerprint.webassembly.fingerprints.performanceHash ===
        fp2.advancedFingerprint.webassembly.fingerprints.performanceHash
          ? 1
          : 0) * 0.2;
      wasmSimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.webassembly.performance.executionTime,
          fp2.advancedFingerprint.webassembly.performance.executionTime
        ) * 0.1;
      wasmSimilarity +=
        (fp1.advancedFingerprint.webassembly.hardware.cpuArchitecture ===
        fp2.advancedFingerprint.webassembly.hardware.cpuArchitecture
          ? 1
          : 0) * 0.2;
      const dynamicWeight =
        (weights.webassembly *
          (fp1.advancedFingerprint.webassembly.confidenceLevel / 100 +
            fp2.advancedFingerprint.webassembly.confidenceLevel / 100)) /
        2;
      totalSimilarity += wasmSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (wasmSimilarity > 0.8) matchedComponents.push("webassembly");
    }

    // Storage similarity
    if (fp1.advancedFingerprint.storage && fp2.advancedFingerprint.storage) {
      let storageSimilarity =
        (fp1.advancedFingerprint.storage.fingerprints.storageHash ===
        fp2.advancedFingerprint.storage.fingerprints.storageHash
          ? 1
          : 0) * 0.4;
      storageSimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.storage.storageAnalysis.totalQuota,
          fp2.advancedFingerprint.storage.storageAnalysis.totalQuota
        ) * 0.2;
      storageSimilarity +=
        normalizedDiff(
          fp1.advancedFingerprint.storage.indexedDB.storageQuota,
          fp2.advancedFingerprint.storage.indexedDB.storageQuota
        ) * 0.2;
      storageSimilarity +=
        jaccardSimilarity(
          fp1.advancedFingerprint.storage.storageAnalysis.accessPatterns,
          fp2.advancedFingerprint.storage.storageAnalysis.accessPatterns
        ) * 0.2;
      const dynamicWeight =
        (weights.storage *
          (fp1.advancedFingerprint.storage.confidenceLevel / 100 +
            fp2.advancedFingerprint.storage.confidenceLevel / 100)) /
        2;
      totalSimilarity += storageSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (storageSimilarity > 0.8) matchedComponents.push("storage");
    }

    // Plugins similarity
    if (fp1.advancedFingerprint.plugins && fp2.advancedFingerprint.plugins) {
      let pluginsSimilarity =
        (fp1.advancedFingerprint.plugins.fingerprints.pluginHash ===
        fp2.advancedFingerprint.plugins.fingerprints.pluginHash
          ? 1
          : 0) * 0.3;
      pluginsSimilarity +=
        jaccardSimilarity(
          fp1.advancedFingerprint.plugins.plugins.enabledPlugins,
          fp2.advancedFingerprint.plugins.plugins.enabledPlugins
        ) * 0.2;
      pluginsSimilarity +=
        jaccardSimilarity(
          fp1.advancedFingerprint.plugins.extensions.detected,
          fp2.advancedFingerprint.plugins.extensions.detected
        ) * 0.2;
      pluginsSimilarity +=
        (fp1.advancedFingerprint.plugins.automation.headless ===
        fp2.advancedFingerprint.plugins.automation.headless
          ? 1
          : 0) * 0.1;
      pluginsSimilarity +=
        jaccardSimilarity(
          Object.keys(fp1.advancedFingerprint.plugins.browserFeatures),
          Object.keys(fp2.advancedFingerprint.plugins.browserFeatures)
        ) * 0.2;
      const dynamicWeight =
        (weights.plugins *
          (fp1.advancedFingerprint.plugins.confidenceLevel / 100 +
            fp2.advancedFingerprint.plugins.confidenceLevel / 100)) /
        2;
      totalSimilarity += pluginsSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (pluginsSimilarity > 0.8) matchedComponents.push("plugins");
    }

    // Behavioral similarity
    if (fp1.behavioralData && fp2.behavioralData) {
      let behavioralSimilarity =
        (fp1.behavioralData.behavioralHash === fp2.behavioralData.behavioralHash
          ? 1
          : 0) * 0.3;

      behavioralSimilarity +=
        (fp1.behavioralData.signatures.mouseSignature ===
        fp2.behavioralData.signatures.mouseSignature
          ? 1
          : 0) * 0.1;
      behavioralSimilarity +=
        (fp1.behavioralData.signatures.keyboardSignature ===
        fp2.behavioralData.signatures.keyboardSignature
          ? 1
          : 0) * 0.1;
      behavioralSimilarity +=
        normalizedDiff(
          fp1.behavioralData.humanVerification.overallHumanness,
          fp2.behavioralData.humanVerification.overallHumanness
        ) * 0.1;
      behavioralSimilarity +=
        normalizedDiff(
          fp1.behavioralData.statistics.entropy,
          fp2.behavioralData.statistics.entropy
        ) * 0.1;
      const dynamicWeight =
        (weights.behavioral *
          (fp1.behavioralData.statistics.entropy +
            fp2.behavioralData.statistics.entropy)) /
        2;
      totalSimilarity += behavioralSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (behavioralSimilarity > 0.8) matchedComponents.push("behavioral");
    }

    // Server Enhancement similarity
    if (fp1.serverEnhancement && fp2.serverEnhancement) {
      let serverSimilarity = 0;
      if (fp1.serverEnhancement.tlsFingerprint) {
        serverSimilarity +=
          (fp1.serverEnhancement.tlsFingerprint.tlsVersion ===
          fp2.serverEnhancement.tlsFingerprint.tlsVersion
            ? 1
            : 0) * 0.2;
        serverSimilarity +=
          jaccardSimilarity(
            fp1.serverEnhancement.tlsFingerprint.extensions || [],
            fp2.serverEnhancement.tlsFingerprint.extensions || []
          ) * 0.2;
      }
      serverSimilarity +=
        (fp1.serverEnhancement.httpHeaders.userAgent ===
        fp2.serverEnhancement.httpHeaders.userAgent
          ? 1
          : 0) * 0.2;
      serverSimilarity +=
        (fp1.serverEnhancement.ipGeolocation.country ===
        fp2.serverEnhancement.ipGeolocation.country
          ? 1
          : 0) * 0.1;
      serverSimilarity +=
        (fp1.serverEnhancement.ipGeolocation.timezone ===
        fp2.serverEnhancement.ipGeolocation.timezone
          ? 1
          : 0) * 0.1;
      serverSimilarity +=
        normalizedDiff(
          fp1.serverEnhancement.serverTiming.processingTime,
          fp2.serverEnhancement.serverTiming.processingTime
        ) * 0.1;
      const dynamicWeight = weights.server;
      totalSimilarity += serverSimilarity * dynamicWeight;
      totalWeight += dynamicWeight;
      if (serverSimilarity > 0.8) matchedComponents.push("serverEnhancement");
    }

    const legacySimilarity =
      totalWeight > 0 ? totalSimilarity / totalWeight : 0;

    // Combine LSH and legacy similarity scores
    // Weighted average, with more weight to LSH if it has more signals
    const lshWeight = lshSignals > 3 ? 0.7 : 0.5;
    const legacyWeight = 1 - lshWeight;
    const finalSimilarity =
      lshSimilarity * lshWeight + legacySimilarity * legacyWeight;

    // Combine matched components from both approaches
    const allMatchedComponents = [
      ...new Set([...lshComponents, ...matchedComponents]),
    ];
    const totalSignals = lshSignals + matchedComponents.length;

    return {
      similarity: finalSimilarity,
      confidence:
        finalSimilarity *
        (totalSignals / (LSH_BUCKET_MAP.size + Object.keys(weights).length)), // Normalize confidence by total possible components
      signals: totalSignals,
      matchedComponents: allMatchedComponents,
    };
  }

  /**
   * Create a new fingerprint entity
   */
  static async createFingerprint(
    fingerprintData: FingerprintCollectionRequest,
    serverEnhancement: any,
    userId?: string,
    sessionId?: string
  ): Promise<FingerprintEntity> {
    const now = new Date();
    const fingerprintId = this.generateFingerprintId();
    const fingerprintHash = this.generateFingerprintHash(
      fingerprintData.coreFingerprint,
      fingerprintData.advancedFingerprint,
      userId
    );

    // Generate fuzzy hashes for similarity detection
    const fuzzyHashes = this.generateFuzzyHashes(
      fingerprintData.coreFingerprint,
      fingerprintData.advancedFingerprint,
      fingerprintData.behavioralData,
      userId
    );

    const entropy = this.calculateWeightedEntropy(
      fingerprintData.coreFingerprint,
      fingerprintData.advancedFingerprint
    );

    // Calculate TTL (90 days from now)
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const ttl = Math.floor(expiresAt.getTime() / 1000);

    // Determine device category from user agent
    const userAgent = serverEnhancement.httpHeaders.userAgent;
    let deviceCategory: "desktop" | "mobile" | "tablet" | "unknown" = "unknown";
    if (userAgent.includes("Mobile")) {
      deviceCategory = userAgent.includes("Tablet") ? "tablet" : "mobile";
    } else if (
      userAgent.includes("Desktop") ||
      userAgent.includes("Windows") ||
      userAgent.includes("Macintosh")
    ) {
      deviceCategory = "desktop";
    }

    const entity: FingerprintEntity = {
      // Primary Keys
      PK: `FINGERPRINT#${fingerprintId}`,
      SK: "METADATA",

      // Global Secondary Indexes
      GSI1PK: userId ? `USER#${userId}` : "ANONYMOUS",
      GSI1SK: `${now.toISOString()}#${fingerprintId}`,
      GSI2PK: `FP_HASH#${fingerprintHash}`,
      GSI2SK: `${Math.round(entropy * 100)}#${now.toISOString()}`,
      GSI3PK: `ANALYTICS#${now.toISOString().split("T")[0]}`,
      GSI3SK: `${now.getHours().toString().padStart(2, "0")}#${fingerprintId}`,
      GSI4PK: `DEVICE_TYPE#${deviceCategory}`,
      GSI4SK: `${
        serverEnhancement.httpHeaders.userAgent.split(" ")[0]
      }#${now.toISOString()}`,

      // Entity metadata
      EntityType: "Fingerprint",

      // Core identification
      fingerprintId,
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
      fingerprintHash,
      fuzzyHashes, // Store fuzzy hashes for similarity detection
      confidence: Math.round(entropy * 100),
      deviceCategory,

      // Fingerprint data
      coreFingerprint: fingerprintData.coreFingerprint,
      advancedFingerprint: fingerprintData.advancedFingerprint,
      serverEnhancement,
      ...(fingerprintData.behavioralData && {
        behavioralData: fingerprintData.behavioralData,
      }),

      // Analytics metadata
      entropy,
      uniqueness: Math.min(entropy / 10, 1), // Normalize to 0-1
      riskScore: 0, // Will be calculated by ML models

      // Browser/Device info
      userAgent: serverEnhancement.httpHeaders.userAgent,
      browserName: "Unknown", // Will be parsed from user agent
      browserVersion: "Unknown",
      osName: "Unknown",
      osVersion: "Unknown",

      // Location and network
      ipAddress: crypto
        .createHash("sha256")
        .update(serverEnhancement.ipGeolocation.country)
        .digest("hex")
        .slice(0, 16),
      country: serverEnhancement.ipGeolocation.country,
      timezone: serverEnhancement.ipGeolocation.timezone,

      // Timestamps and TTL
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ttl,

      // Privacy and compliance
      consentGiven: fingerprintData.consentGiven,
      dataProcessingPurpose: fingerprintData.dataProcessingPurpose,
      retentionCategory: "analytics",

      // Store all raw data from the request for advanced similarity or analytics
      rawFingerprint: { ...fingerprintData },
    };

    // Write the main entity as usual
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: entity,
    });

    await docClient.send(command);

    // Write one additional record per fuzzy hash for GSI4 indexing
    // (Each will have different GSI4PK but can share the same GSI4 index)
    const fuzzyWritePromises = fuzzyHashes.map((fuzzyHash, index) => {
      const fuzzyEntity = {
        ...entity,
        // Use a unique SK to avoid conflicts with main entity
        SK: `FUZZY#${index}`,
        GSI4PK: `FINGERPRINT_FUZZY#${fuzzyHash}`,
        GSI4SK: `${now.toISOString()}#${entity.fingerprintId}`,
      };
      return docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: fuzzyEntity,
        })
      );
    });
    await Promise.all(fuzzyWritePromises);

    return entity;
  }

  /**
   * Get fingerprint by ID
   */
  static async getFingerprintById(
    fingerprintId: string
  ): Promise<FingerprintEntity | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `FINGERPRINT#${fingerprintId}`,
        SK: "METADATA",
      },
    });

    const result = await docClient.send(command);
    return (result.Item as FingerprintEntity) || null;
  }

  /**
   * Find similar fingerprints using fuzzy hashing
   */
  static async findSimilarFingerprints(
    fingerprintHash: string,
    limit = 10
  ): Promise<FingerprintEntity[]> {
    // First, try to find exact matches using the original method
    const exactMatches = await this.findExactHashMatches(
      fingerprintHash,
      limit
    );

    // If we have enough exact matches, return them
    if (exactMatches.length >= limit) {
      return exactMatches.slice(0, limit);
    }

    // If not enough exact matches, perform fuzzy matching
    const remainingLimit = limit - exactMatches.length;
    const fuzzyMatches = await this.findFuzzyMatches(remainingLimit);

    // Combine and deduplicate results
    const allMatches = [...exactMatches];
    const existingIds = new Set(exactMatches.map((fp) => fp.fingerprintId));

    for (const fuzzyMatch of fuzzyMatches) {
      if (!existingIds.has(fuzzyMatch.fingerprintId)) {
        allMatches.push(fuzzyMatch);
        existingIds.add(fuzzyMatch.fingerprintId);
      }
    }

    return allMatches.slice(0, limit);
  }

  /**
   * Find exact hash matches (original method)
   */
  private static async findExactHashMatches(
    fingerprintHash: string,
    limit: number
  ): Promise<FingerprintEntity[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :hashPK",
      ExpressionAttributeValues: {
        ":hashPK": `FP_HASH#${fingerprintHash}`,
      },
      Limit: limit,
      ScanIndexForward: false, // Get most recent first
    });

    const result = await docClient.send(command);
    return (result.Items as FingerprintEntity[]) || [];
  }

  /**
   * Find fuzzy matches by scanning recent fingerprints
   */
  private static async findFuzzyMatches(
    limit: number
  ): Promise<FingerprintEntity[]> {
    // Get recent fingerprints from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "EntityType = :entityType AND lastSeenAt > :minDate",
      ExpressionAttributeValues: {
        ":entityType": "Fingerprint",
        ":minDate": thirtyDaysAgo.toISOString(),
      },
      Limit: Math.min(500, limit * 10), // Scan more candidates for better fuzzy matching
    });

    const result = await docClient.send(command);
    const candidates = (result.Items as FingerprintEntity[]) || [];

    // Return fingerprints that have fuzzy hashes (support fuzzy matching)
    const fuzzyMatches = candidates.filter(
      (fp) => fp.fuzzyHashes && fp.fuzzyHashes.length > 0
    );

    return fuzzyMatches.slice(0, limit);
  }

  /**
   * Enhanced fuzzy matching with entropy-weighted scoring and reconciliation
   * This method generates fuzzy hashes for the current fingerprint and finds matches
   * with confidence scoring based on signal quality and collision probabilities
   */
  static async findSimilarFingerprintsAdvanced(
    coreFingerprint: any,
    advancedFingerprint: any,
    behavioralData?: BehavioralFingerprint,
    userId?: string,
    limit = 10,
    confidenceThreshold = 0.7
  ): Promise<
    Array<
      FingerprintEntity & {
        similarity: number;
        confidence: number;
        signals: number;
        matchedComponents: string[];
      }
    >
  > {
    // Generate fuzzy hashes for the current fingerprint
    const currentFuzzyHashes = this.generateFuzzyHashes(
      coreFingerprint,
      advancedFingerprint,
      behavioralData,
      userId
    );

    console.log("🎯 Enhanced similarity search:", {
      fuzzyHashCount: currentFuzzyHashes.length,
      confidenceThreshold,
      limit,
    });

    // Try exact matches first (highest confidence)
    const mainHash = this.generateFingerprintHash(
      coreFingerprint,
      advancedFingerprint,
      userId
    );
    const exactMatches = await this.findExactHashMatches(mainHash, limit);

    // Process exact matches with perfect confidence
    const candidatesWithScores: Array<
      FingerprintEntity & {
        similarity: number;
        confidence: number;
        signals: number;
        matchedComponents: string[];
      }
    > = exactMatches.map((match) => ({
      ...match,
      similarity: 1.0,
      confidence: 1.0,
      signals: 8, // All LSH buckets would match for exact matches
      matchedComponents: ["exact_match"],
    }));

    if (candidatesWithScores.length >= limit) {
      return candidatesWithScores.slice(0, limit);
    }

    // Find fuzzy matches using entropy-weighted scoring
    const allCandidates = [...candidatesWithScores];
    const existingIds = new Set(exactMatches.map((fp) => fp.fingerprintId));
    const remainingLimit = Math.max(limit - exactMatches.length, 10); // Get more candidates for scoring

    // Collect potential matches from all fuzzy hash buckets
    const bucketConfigs = getLSHBucketConfigs();
    const potentialMatches: Map<string, FingerprintEntity> = new Map();

    for (
      let i = 0;
      i < currentFuzzyHashes.length && i < bucketConfigs.length;
      i++
    ) {
      const fuzzyHash = currentFuzzyHashes[i];
      const bucketConfig = bucketConfigs[i];

      if (!bucketConfig || !fuzzyHash) continue;

      // Weight the search by bucket entropy (focus on high-entropy buckets first)
      const bucketLimit = Math.ceil(
        remainingLimit * (bucketConfig.entropy || 0.5)
      );

      const fuzzyMatches = await this.findFuzzyHashMatches(
        fuzzyHash,
        bucketLimit
      );

      console.log(
        `🔍 Bucket ${bucketConfig.name}: found ${fuzzyMatches.length} matches (entropy: ${bucketConfig.entropy})`
      );

      for (const match of fuzzyMatches) {
        if (!existingIds.has(match.fingerprintId)) {
          potentialMatches.set(match.fingerprintId, match);
        }
      }
    }

    // Score all potential matches using entropy-weighted similarity
    const currentFingerprint = {
      fingerprintId: "temp-current",
      fingerprintHash: mainHash,
      coreFingerprint,
      advancedFingerprint,
      fuzzyHashes: currentFuzzyHashes,
    } as FingerprintEntity;

    for (const candidate of potentialMatches.values()) {
      const similarityResult = this.calculateSimilarity(
        currentFingerprint,
        candidate
      );

      // Only include candidates that meet the confidence threshold
      if (similarityResult.confidence >= confidenceThreshold) {
        allCandidates.push({
          ...candidate,
          similarity: similarityResult.similarity,
          confidence: similarityResult.confidence,
          signals: similarityResult.signals,
          matchedComponents: similarityResult.matchedComponents,
        });

        console.log(
          `✅ Qualified candidate: ${candidate.fingerprintId.substring(
            0,
            8
          )}... (confidence: ${similarityResult.confidence.toFixed(
            3
          )}, signals: ${similarityResult.signals})`
        );
      } else {
        console.log(
          `❌ Rejected candidate: ${candidate.fingerprintId.substring(
            0,
            8
          )}... (confidence: ${similarityResult.confidence.toFixed(
            3
          )} < ${confidenceThreshold})`
        );
      }
    }

    // Sort by confidence (entropy-weighted), then by signals count, then by similarity
    allCandidates.sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) > 0.01) {
        return b.confidence - a.confidence; // Higher confidence first
      }
      if (a.signals !== b.signals) {
        return b.signals - a.signals; // More signals first
      }
      return b.similarity - a.similarity; // Higher similarity first
    });

    console.log(
      `🎯 Final results: ${allCandidates.length} candidates, top confidence: ${
        allCandidates[0]?.confidence.toFixed(3) || "none"
      }`
    );

    return allCandidates.slice(0, limit);
  }

  /**
   * Query the fuzzy hash GSI for candidates
   */
  static async findFuzzyHashMatches(
    fuzzyHash: string,
    limit = 10
  ): Promise<FingerprintEntity[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI4", // Use GSI4 - it can handle both DEVICE_TYPE and FINGERPRINT_FUZZY patterns
      KeyConditionExpression: "GSI4PK = :fuzzyPK",
      ExpressionAttributeValues: {
        ":fuzzyPK": `FINGERPRINT_FUZZY#${fuzzyHash}`,
      },
      Limit: limit,
      ScanIndexForward: false,
    });

    const result = await docClient.send(command);
    // Filter duplicates, only return one per fingerprintId (canonical)
    const unique: Record<string, FingerprintEntity> = {};
    for (const item of (result.Items as FingerprintEntity[]) ?? []) {
      unique[item.fingerprintId] = item;
    }
    return Object.values(unique);
  }

  /**
   * Get fingerprints by user ID
   */
  static async getFingerprintsByUserId(
    userId: string,
    limit = 20,
    lastEvaluatedKey?: any
  ): Promise<{ fingerprints: FingerprintEntity[]; lastEvaluatedKey?: any }> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :userPK",
      ExpressionAttributeValues: {
        ":userPK": `USER#${userId}`,
      },
      Limit: limit,
      ScanIndexForward: false,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const result = await docClient.send(command);
    return {
      fingerprints: (result.Items as FingerprintEntity[]) || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  /**
   * Update fingerprint last seen time
   */
  static async updateLastSeen(fingerprintId: string): Promise<void> {
    const now = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `FINGERPRINT#${fingerprintId}`,
        SK: "METADATA",
      },
      UpdateExpression: "SET lastSeenAt = :now, updatedAt = :now",
      ExpressionAttributeValues: {
        ":now": now,
      },
    });

    await docClient.send(command);
  }

  /**
   * Create fingerprint session correlation
   */
  static async createFingerprintSession(
    fingerprintId: string,
    sessionId: string,
    userId?: string,
    correlationScore = 100
  ): Promise<FingerprintSessionEntity> {
    const now = new Date();
    const ttl = Math.floor((now.getTime() + 30 * 24 * 60 * 60 * 1000) / 1000); // 30 days

    const entity: FingerprintSessionEntity = {
      PK: `FINGERPRINT#${fingerprintId}`,
      SK: `SESSION#${sessionId}`,
      GSI1PK: `SESSION#${sessionId}`,
      GSI1SK: `${now.toISOString()}#${fingerprintId}`,
      EntityType: "FingerprintSession",

      fingerprintId,
      sessionId,
      ...(userId && { userId }),
      correlationScore,
      sessionStartTime: now.toISOString(),
      pageViews: 1,
      actionsCount: 0,
      createdAt: now.toISOString(),
      ttl,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: entity,
    });

    await docClient.send(command);
    return entity;
  }

  /**
   * Store the association between visitorId and fingerprintId in the database
   * ENHANCED: Now includes triangular table reconciliation to merge visitor identities
   * when fingerprint matching reveals they belong to the same user
   */
  static async storeVisitorFingerprintAssociation(
    visitorId: string,
    fingerprintId: string,
    metadata: {
      isNewVisitor: boolean;
      confidence: number;
      timestamp: string;
      fingerprintHash: string;
    }
  ): Promise<void> {
    try {
      // STEP 1: Perform triangular reconciliation
      await this.performTriangularReconciliation(
        visitorId,
        fingerprintId,
        metadata
      );

      // STEP 2: Store the association record (after reconciliation)
      const associationRecord = {
        PK: `VISITOR#${visitorId}`,
        SK: `FINGERPRINT#${fingerprintId}`,
        GSI1PK: `FINGERPRINT#${fingerprintId}`,
        GSI1SK: `VISITOR#${visitorId}`,
        EntityType: "VisitorFingerprintAssociation",
        visitorId,
        fingerprintId,
        fingerprintHash: metadata.fingerprintHash,
        isNewVisitor: metadata.isNewVisitor,
        confidence: metadata.confidence,
        associatedAt: metadata.timestamp,
        ttl: Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000), // 90 days TTL
      };

      console.log("🔗 Storing visitor-fingerprint association:", {
        visitorId: visitorId.substring(0, 8) + "...",
        fingerprintId: fingerprintId.substring(0, 8) + "...",
        isNewVisitor: metadata.isNewVisitor,
        confidence: metadata.confidence,
      });

      // Store the association in DynamoDB
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: associationRecord,
      });

      await docClient.send(command);

      // STEP 3: Ensure user-visitor relationship exists if userId is available
      const fingerprint = await this.getFingerprintById(fingerprintId);
      if (fingerprint?.userId) {
        await this.createOrUpdateUserVisitorRelationship(
          fingerprint.userId,
          visitorId,
          metadata.confidence
        );
      }
    } catch (error) {
      console.warn("Failed to store visitor-fingerprint association:", error);
      // Don't fail the entire request if this association storage fails
    }
  }

  /**
   * Perform triangular table reconciliation
   * This detects when multiple visitor_ids should be merged into one identity
   * based on fingerprint similarity and userId matching
   */
  private static async performTriangularReconciliation(
    currentVisitorId: string,
    currentFingerprintId: string,
    metadata: {
      isNewVisitor: boolean;
      confidence: number;
      timestamp: string;
      fingerprintHash: string;
    }
  ): Promise<void> {
    try {
      console.log("🔺 Starting triangular reconciliation for visitor:", {
        visitorId: currentVisitorId.substring(0, 8) + "...",
        fingerprintId: currentFingerprintId.substring(0, 8) + "...",
      });

      // Get the current fingerprint to extract userId and fuzzy hashes
      const currentFingerprint = await this.getFingerprintById(
        currentFingerprintId
      );
      if (!currentFingerprint) {
        console.log(
          "⚠️ Current fingerprint not found, skipping reconciliation"
        );
        return;
      }

      // Extract userId from fingerprint data (optional - reconciliation works without it)
      const userId = currentFingerprint.userId;

      console.log("🔺 Reconciliation context:", {
        hasUserId: !!userId,
        fingerprintId: currentFingerprintId.substring(0, 8) + "...",
        approach: userId ? "user-guided" : "fingerprint-based",
      });

      // STEP 1: Find all similar fingerprints using fuzzy matching
      const similarFingerprints = await this.findSimilarFingerprintsAdvanced(
        currentFingerprint.coreFingerprint,
        currentFingerprint.advancedFingerprint,
        currentFingerprint.behavioralData,
        userId, // Pass userId if available for enhanced matching
        20 // Get more matches for comprehensive reconciliation
      );

      // STEP 2: Extract visitor IDs from similar fingerprints
      const candidateVisitorIds = new Set<string>();
      const fingerprintToVisitorMap = new Map<string, string>();

      for (const similarFingerprint of similarFingerprints) {
        // Skip if it's the same fingerprint
        if (similarFingerprint.fingerprintId === currentFingerprintId) {
          continue;
        }

        // For fingerprint-based reconciliation, we look for any similar fingerprints
        // regardless of userId match - the similarity itself is the signal
        console.log("🔍 Evaluating similar fingerprint:", {
          fingerprintId:
            similarFingerprint.fingerprintId.substring(0, 8) + "...",
          similarity: similarFingerprint.similarity?.toFixed(3),
          confidence: similarFingerprint.confidence?.toFixed(3),
          signals: similarFingerprint.signals,
          hasUserId: !!similarFingerprint.userId,
          userIdMatch: userId && similarFingerprint.userId === userId,
        });

        // Find existing visitor associations for this fingerprint
        const associations = await this.getVisitorAssociationsForFingerprint(
          similarFingerprint.fingerprintId
        );

        for (const association of associations) {
          if (association.visitorId !== currentVisitorId) {
            candidateVisitorIds.add(association.visitorId);
            fingerprintToVisitorMap.set(
              similarFingerprint.fingerprintId,
              association.visitorId
            );
          }
        }
      }

      if (candidateVisitorIds.size === 0) {
        console.log("✅ No visitor reconciliation needed");
        return;
      }

      console.log("🔍 Found candidate visitors for reconciliation:", {
        candidates: candidateVisitorIds.size,
        visitorIds: Array.from(candidateVisitorIds).map(
          (id) => id.substring(0, 8) + "..."
        ),
      });

      // STEP 3: Determine the primary visitor ID (oldest one)
      let primaryVisitorId = currentVisitorId;
      let earliestTimestamp = metadata.timestamp;

      // Check current visitor's creation time
      const currentVisitor = await this.getVisitorById(currentVisitorId);
      if (currentVisitor && currentVisitor.createdAt) {
        earliestTimestamp = currentVisitor.createdAt;
      }

      // Compare with candidate visitors to find the truly oldest one
      for (const candidateId of candidateVisitorIds) {
        const visitor = await this.getVisitorById(candidateId);
        if (
          visitor &&
          visitor.createdAt &&
          visitor.createdAt < earliestTimestamp
        ) {
          primaryVisitorId = candidateId;
          earliestTimestamp = visitor.createdAt;
        }
      }

      console.log("🏆 Primary visitor selection:", {
        currentVisitor: currentVisitorId.substring(0, 8) + "...",
        currentCreatedAt: currentVisitor?.createdAt || metadata.timestamp,
        selectedPrimary: primaryVisitorId.substring(0, 8) + "...",
        primaryCreatedAt: earliestTimestamp,
        candidatesEvaluated: candidateVisitorIds.size,
        willMerge: primaryVisitorId !== currentVisitorId,
      });

      // If current visitor is already primary, no need to reconcile
      if (primaryVisitorId === currentVisitorId) {
        console.log(
          "✅ Current visitor is already primary, no reconciliation needed"
        );
        return;
      }

      console.log("🔄 Reconciling visitors under primary:", {
        primaryVisitorId: primaryVisitorId.substring(0, 8) + "...",
        mergingCount: candidateVisitorIds.size,
      });

      // STEP 4: Merge all candidate visitors into the primary visitor
      const allVisitorIds = [
        currentVisitorId,
        ...Array.from(candidateVisitorIds),
      ];
      await this.mergeVisitorsIntoPrimary(primaryVisitorId, allVisitorIds);

      // STEP 5: Handle user-visitor relationships through triangular table (only if userId available)
      if (userId) {
        await this.reconcileUserVisitorRelationships(
          primaryVisitorId,
          allVisitorIds,
          userId
        );
      } else {
        console.log(
          "ℹ️ No userId available - skipping user-visitor relationship reconciliation"
        );
      }
    } catch (error) {
      console.error("❌ Triangular reconciliation failed:", error);
      // Don't throw - reconciliation failure shouldn't break fingerprint collection
    }
  }

  /**
   * Reconcile user-visitor relationships in the triangular table
   * Supports many-to-many relationships:
   * - One person with multiple accounts (many user_ids → one visitor_id)
   * - Shared accounts (one user_id → many visitor_ids)
   */
  private static async reconcileUserVisitorRelationships(
    primaryVisitorId: string,
    allVisitorIds: string[],
    currentUserId: string
  ): Promise<void> {
    console.log("🔺 Reconciling user-visitor relationships:", {
      primaryVisitor: primaryVisitorId.substring(0, 8) + "...",
      allVisitors: allVisitorIds.length,
      currentUser: currentUserId.substring(0, 8) + "...",
    });

    // 1. Get all existing user-visitor relationships for these visitors
    const existingRelationships = await this.getUserVisitorRelationships(
      allVisitorIds
    );

    console.log("📊 Found existing relationships:", {
      total: existingRelationships.length,
      relationships: existingRelationships.map((r) => ({
        user: r.userId.substring(0, 8) + "...",
        visitor: r.visitorId.substring(0, 8) + "...",
        confidence: r.confidence,
      })),
    });

    // 2. Collect all unique user IDs from existing relationships
    const allUserIds = new Set<string>();
    allUserIds.add(currentUserId); // Always include current user

    for (const relationship of existingRelationships) {
      allUserIds.add(relationship.userId);
    }

    // 3. Create/update relationships for primary visitor with all users
    for (const userId of allUserIds) {
      await this.createOrUpdateUserVisitorRelationship(
        userId,
        primaryVisitorId,
        this.calculateRelationshipConfidence(
          userId,
          allVisitorIds,
          existingRelationships
        )
      );
    }

    // 4. Remove old relationships for secondary visitors
    const secondaryVisitorIds = allVisitorIds.filter(
      (id) => id !== primaryVisitorId
    );
    for (const secondaryVisitorId of secondaryVisitorIds) {
      await this.removeVisitorRelationships(secondaryVisitorId);
    }

    console.log("✅ User-visitor relationships reconciled successfully");
  }

  /**
   * Calculate confidence score for user-visitor relationship
   */
  private static calculateRelationshipConfidence(
    userId: string,
    visitorIds: string[],
    existingRelationships: Array<{
      userId: string;
      visitorId: string;
      confidence: number;
    }>
  ): number {
    const userRelationships = existingRelationships.filter(
      (r) => r.userId === userId
    );

    if (userRelationships.length === 0) {
      return 0.8; // Default confidence for new relationship
    }

    // Higher confidence if user has relationships with multiple visitors being merged
    const matchingVisitors = userRelationships.filter((r) =>
      visitorIds.includes(r.visitorId)
    );
    const confidenceBoost = Math.min(matchingVisitors.length * 0.1, 0.2);

    const avgConfidence =
      userRelationships.reduce((sum, r) => sum + r.confidence, 0) /
      userRelationships.length;
    return Math.min(avgConfidence + confidenceBoost, 1.0);
  }

  /**
   * Create or update user-visitor relationship in triangular table
   */
  private static async createOrUpdateUserVisitorRelationship(
    userId: string,
    visitorId: string,
    confidence: number
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    // Store bidirectional relationship for efficient querying
    const relationship = {
      userId,
      visitorId,
      confidence,
      createdAt: timestamp,
      updatedAt: timestamp,
      ttl: Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000), // 1 year TTL
    };

    // Primary record: USER -> VISITOR (for finding visitors by user)
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER_VISITOR#${userId}`,
          SK: `VISITOR#${visitorId}`,
          GSI1PK: `VISITOR_USER#${visitorId}`, // Reverse lookup
          GSI1SK: `USER#${userId}`,
          GSI2PK: `USER_CONFIDENCE#${userId}`,
          GSI2SK: `${confidence.toFixed(3)}#${timestamp}`, // Sort by confidence
          EntityType: "UserVisitorRelationship",
          ...relationship,
        },
      })
    );

    console.log("🔗 Created/updated user-visitor relationship:", {
      user: userId.substring(0, 8) + "...",
      visitor: visitorId.substring(0, 8) + "...",
      confidence,
    });
  }

  /**
   * Get all user-visitor relationships for given visitor IDs
   */
  private static async getUserVisitorRelationships(
    visitorIds: string[]
  ): Promise<Array<{ userId: string; visitorId: string; confidence: number }>> {
    const relationships: Array<{
      userId: string;
      visitorId: string;
      confidence: number;
    }> = [];

    // Query each visitor ID to find associated users
    for (const visitorId of visitorIds) {
      try {
        const command = new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :visitorPK",
          ExpressionAttributeValues: {
            ":visitorPK": `VISITOR_USER#${visitorId}`,
          },
        });

        const result = await docClient.send(command);

        if (result.Items) {
          for (const item of result.Items) {
            relationships.push({
              userId: item["userId"],
              visitorId: item["visitorId"],
              confidence: item["confidence"] || 0.8,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error querying relationships for visitor ${visitorId}:`,
          error
        );
      }
    }

    return relationships;
  }

  /**
   * Remove all relationships for a visitor (used when merging visitors)
   */
  private static async removeVisitorRelationships(
    visitorId: string
  ): Promise<void> {
    try {
      // Find all relationships for this visitor
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :visitorPK",
        ExpressionAttributeValues: {
          ":visitorPK": `VISITOR_USER#${visitorId}`,
        },
      });

      const result = await docClient.send(command);

      if (result.Items && result.Items.length > 0) {
        // Delete each relationship
        const deletePromises = result.Items.map((item) =>
          docClient.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: `USER_VISITOR#${item["userId"]}`,
                SK: `VISITOR#${visitorId}`,
              },
            })
          )
        );

        await Promise.all(deletePromises);

        console.log("🗑️ Removed relationships for visitor:", {
          visitorId: visitorId.substring(0, 8) + "...",
          count: result.Items.length,
        });
      }
    } catch (error) {
      console.error("Error removing visitor relationships:", error);
    }
  }

  // ============ TRIANGULAR TABLE QUERY METHODS ============

  /**
   * Get all visitors associated with a user (for finding all identities using one shared account)
   */
  static async getVisitorsByUserId(
    userId: string,
    minConfidence = 0.5
  ): Promise<
    Array<{ visitorId: string; confidence: number; createdAt: string }>
  > {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :userPK",
        FilterExpression: "confidence >= :minConfidence",
        ExpressionAttributeValues: {
          ":userPK": `USER_VISITOR#${userId}`,
          ":minConfidence": minConfidence,
        },
      });

      const result = await docClient.send(command);

      return (result.Items || []).map((item) => ({
        visitorId: item["visitorId"],
        confidence: item["confidence"],
        createdAt: item["createdAt"],
      }));
    } catch (error) {
      console.error("Error getting visitors by user ID:", error);
      return [];
    }
  }

  /**
   * Get all users associated with a visitor (for multiple accounts used by the same identity)
   */
  static async getUsersByVisitorId(
    visitorId: string,
    minConfidence = 0.5
  ): Promise<Array<{ userId: string; confidence: number; createdAt: string }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :visitorPK",
        FilterExpression: "confidence >= :minConfidence",
        ExpressionAttributeValues: {
          ":visitorPK": `VISITOR_USER#${visitorId}`,
          ":minConfidence": minConfidence,
        },
      });

      const result = await docClient.send(command);

      return (result.Items || []).map((item) => ({
        userId: item["userId"],
        confidence: item["confidence"],
        createdAt: item["createdAt"],
      }));
    } catch (error) {
      console.error("Error getting users by visitor ID:", error);
      return [];
    }
  }

  /**
   * Get high-confidence visitors for a user (sorted by confidence)
   */
  static async getHighConfidenceVisitorsByUserId(
    userId: string,
    limit = 10
  ): Promise<Array<{ visitorId: string; confidence: number }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :userPK",
        ExpressionAttributeValues: {
          ":userPK": `USER_CONFIDENCE#${userId}`,
        },
        ScanIndexForward: false, // Sort by confidence DESC
        Limit: limit,
      });

      const result = await docClient.send(command);

      return (result.Items || []).map((item) => ({
        visitorId: item["visitorId"],
        confidence: item["confidence"],
      }));
    } catch (error) {
      console.error("Error getting high-confidence visitors:", error);
      return [];
    }
  }

  /**
   * Check if user and visitor are associated
   */
  static async isUserVisitorAssociated(
    userId: string,
    visitorId: string
  ): Promise<{ associated: boolean; confidence?: number }> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER_VISITOR#${userId}`,
          SK: `VISITOR#${visitorId}`,
        },
      });

      const result = await docClient.send(command);

      if (result.Item) {
        return {
          associated: true,
          confidence: result.Item["confidence"],
        };
      }

      return { associated: false };
    } catch (error) {
      console.error("Error checking user-visitor association:", error);
      return { associated: false };
    }
  }

  /**
   * Get visitor associations for a specific fingerprint
   */
  static async getVisitorAssociationsForFingerprint(
    fingerprintId: string
  ): Promise<Array<{ visitorId: string; associatedAt: string }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :fingerprintPK",
        ExpressionAttributeValues: {
          ":fingerprintPK": `FINGERPRINT#${fingerprintId}`,
        },
      });

      const result = await docClient.send(command);
      return (result.Items || []).map((item) => ({
        visitorId: item["visitorId"],
        associatedAt: item["associatedAt"],
      }));
    } catch (error) {
      console.error("Error getting visitor associations:", error);
      return [];
    }
  }

  /**
   * Merge multiple visitors into a primary visitor identity
   * This is the core of the triangular reconciliation system
   */
  private static async mergeVisitorsIntoPrimary(
    primaryVisitorId: string,
    allVisitorIds: string[]
  ): Promise<void> {
    console.log("🔀 Merging visitors into primary:", {
      primary: primaryVisitorId.substring(0, 8) + "...",
      merging: allVisitorIds.length,
      approach: "fingerprint-based",
    });

    const secondaryVisitorIds = allVisitorIds.filter(
      (id) => id !== primaryVisitorId
    );

    for (const secondaryVisitorId of secondaryVisitorIds) {
      try {
        // 1. Get all fingerprint associations for secondary visitor
        const secondaryAssociations = await this.getAssociationsForVisitor(
          secondaryVisitorId
        );

        // 2. Re-associate all fingerprints to primary visitor
        for (const association of secondaryAssociations) {
          await this.reassociateFingerprintToPrimaryVisitor(
            association.fingerprintId,
            secondaryVisitorId,
            primaryVisitorId
          );
        }

        // 3. Merge visitor profile data
        await this.mergeVisitorProfiles(primaryVisitorId, secondaryVisitorId);

        // 4. Clean up secondary visitor record
        await this.cleanupSecondaryVisitor(secondaryVisitorId);

        console.log("✅ Merged secondary visitor:", {
          secondary: secondaryVisitorId.substring(0, 8) + "...",
          associations: secondaryAssociations.length,
        });
      } catch (error) {
        console.error("❌ Failed to merge visitor:", secondaryVisitorId, error);
        // Continue with other visitors even if one fails
      }
    }

    console.log("🎉 Triangular reconciliation completed successfully");
  }

  /**
   * Get all fingerprint associations for a visitor
   */
  private static async getAssociationsForVisitor(
    visitorId: string
  ): Promise<Array<{ fingerprintId: string; fingerprintHash: string }>> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression:
          "PK = :visitorPK AND begins_with(SK, :fingerprintPrefix)",
        ExpressionAttributeValues: {
          ":visitorPK": `VISITOR#${visitorId}`,
          ":fingerprintPrefix": "FINGERPRINT#",
        },
      });

      const result = await docClient.send(command);
      return (result.Items || []).map((item) => ({
        fingerprintId: item["fingerprintId"],
        fingerprintHash: item["fingerprintHash"],
      }));
    } catch (error) {
      console.error("Error getting associations for visitor:", error);
      return [];
    }
  }

  /**
   * Re-associate a fingerprint from secondary to primary visitor
   */
  private static async reassociateFingerprintToPrimaryVisitor(
    fingerprintId: string,
    secondaryVisitorId: string,
    _primaryVisitorId: string
  ): Promise<void> {
    try {
      // Delete old association
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `VISITOR#${secondaryVisitorId}`,
            SK: `FINGERPRINT#${fingerprintId}`,
          },
        })
      );

      // The new association will be created by the calling function
      // We just need to clean up the old one here
    } catch (error) {
      console.error("Error reassociating fingerprint:", error);
    }
  }

  /**
   * Merge visitor profile data from secondary into primary
   */
  private static async mergeVisitorProfiles(
    primaryVisitorId: string,
    secondaryVisitorId: string
  ): Promise<void> {
    try {
      const [primaryVisitor, secondaryVisitor] = await Promise.all([
        this.getVisitorById(primaryVisitorId),
        this.getVisitorById(secondaryVisitorId),
      ]);

      if (!primaryVisitor || !secondaryVisitor) {
        return;
      }

      // Merge visit counts and session times
      const mergedData = {
        visitCount:
          (primaryVisitor.visitCount || 0) + (secondaryVisitor.visitCount || 0),
        totalSessionTime:
          (primaryVisitor.totalSessionTime || 0) +
          (secondaryVisitor.totalSessionTime || 0),
        associatedFingerprints: [
          ...new Set([
            ...(primaryVisitor.associatedFingerprints || []),
            ...(secondaryVisitor.associatedFingerprints || []),
          ]),
        ],
        // Use the earlier creation date
        createdAt:
          primaryVisitor.createdAt < secondaryVisitor.createdAt
            ? primaryVisitor.createdAt
            : secondaryVisitor.createdAt,
        // Use the latest last seen date
        lastSeenAt:
          primaryVisitor.lastSeenAt > secondaryVisitor.lastSeenAt
            ? primaryVisitor.lastSeenAt
            : secondaryVisitor.lastSeenAt,
      };

      // Update primary visitor with merged data
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `VISITOR#${primaryVisitorId}`,
            SK: "PROFILE",
          },
          UpdateExpression: `
          SET visitCount = :visitCount,
              totalSessionTime = :totalSessionTime,
              associatedFingerprints = :fingerprints,
              createdAt = :createdAt,
              lastSeenAt = :lastSeenAt
        `,
          ExpressionAttributeValues: {
            ":visitCount": mergedData.visitCount,
            ":totalSessionTime": mergedData.totalSessionTime,
            ":fingerprints": mergedData.associatedFingerprints,
            ":createdAt": mergedData.createdAt,
            ":lastSeenAt": mergedData.lastSeenAt,
          },
        })
      );
    } catch (error) {
      console.error("Error merging visitor profiles:", error);
    }
  }

  /**
   * Clean up secondary visitor record after merge
   */
  private static async cleanupSecondaryVisitor(
    secondaryVisitorId: string
  ): Promise<void> {
    try {
      // Delete visitor profile
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `VISITOR#${secondaryVisitorId}`,
            SK: "PROFILE",
          },
        })
      );

      console.log("🗑️ Cleaned up secondary visitor:", {
        visitorId: secondaryVisitorId.substring(0, 8) + "...",
      });
    } catch (error) {
      console.error("Error cleaning up secondary visitor:", error);
    }
  }

  /**
   * Get analytics data for a date range
   */
  static async getAnalyticsData(
    startDate: string,
    endDate: string,
    analyticsType?: string
  ): Promise<FingerprintAnalyticsEntity[]> {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: analyticsType ? "GSI1" : "GSI3",
      KeyConditionExpression: analyticsType
        ? "GSI1PK = :typePK AND GSI1SK BETWEEN :start AND :end"
        : "GSI3PK BETWEEN :startPK AND :endPK",
      ExpressionAttributeValues: analyticsType
        ? {
            ":typePK": `ANALYTICS_TYPE#${analyticsType}`,
            ":start": startDate,
            ":end": endDate,
          }
        : {
            ":startPK": `ANALYTICS#${startDate}`,
            ":endPK": `ANALYTICS#${endDate}`,
          },
    });

    const result = await docClient.send(command);
    return (result.Items as FingerprintAnalyticsEntity[]) || [];
  }

  /**
   * Delete expired fingerprints (cleanup job)
   */
  static async deleteExpiredFingerprints(): Promise<number> {
    // DynamoDB TTL will handle automatic deletion
    // This method can be used for manual cleanup if needed
    console.log("TTL-based cleanup is handled automatically by DynamoDB");
    return 0;
  }

  // ============ VISITOR TRACKING METHODS ============

  /**
   * Find visitor by fingerprint hash
   */
  static async findVisitorByFingerprint(
    fingerprintHash: string
  ): Promise<UniqueVisitor | null> {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI4",
        KeyConditionExpression: "GSI4PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `FINGERPRINT#${fingerprintHash}`,
        },
        Limit: 1,
      });

      const result = await docClient.send(command);

      if (result.Items && result.Items.length > 0) {
        const item = result.Items[0];
        if (!item) return null;

        return {
          visitorId: item["visitorId"],
          createdAt: item["createdAt"],
          lastSeenAt: item["lastSeenAt"],
          associatedFingerprints: item["associatedFingerprints"] || [
            fingerprintHash,
          ],
          primaryFingerprintHash: item["primaryFingerprintHash"],
          behavioralSignature: JSON.parse(item["behavioralSignature"] || "{}"),
          visitCount: item["visitCount"] || 0,
          totalSessionTime: item["totalSessionTime"] || 0,
          hourlyVisits: JSON.parse(item["hourlyVisits"] || "{}"),
          dailyVisits: JSON.parse(item["dailyVisits"] || "{}"),
          confidenceScore: item["confidenceScore"] || 1.0,
          lastBehavioralUpdate: item["lastBehavioralUpdate"],
        };
      }
      return null;
    } catch (error) {
      console.error("Error finding visitor by fingerprint:", error);
      return null;
    }
  }

  /**
   * Create new unique visitor
   */
  static async createNewVisitor(
    visitorId: string,
    fingerprintHash: string,
    behavioralSignature: BehavioralSignature,
    timestamp: string
  ): Promise<UniqueVisitor> {
    const visitor: UniqueVisitor = {
      visitorId,
      createdAt: timestamp,
      lastSeenAt: timestamp,
      associatedFingerprints: [fingerprintHash],
      primaryFingerprintHash: fingerprintHash,
      behavioralSignature,
      visitCount: 1,
      totalSessionTime: 0,
      hourlyVisits: {},
      dailyVisits: {},
      confidenceScore: 1.0,
      lastBehavioralUpdate: timestamp,
    };

    // Store visitor record
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `VISITOR#${visitorId}`,
        SK: "PROFILE",
        GSI1PK: "VISITORS",
        GSI1SK: timestamp,
        GSI4PK: `FINGERPRINT#${fingerprintHash}`,
        GSI4SK: visitorId,
        ...visitor,
        behavioralSignature: JSON.stringify(behavioralSignature),
        hourlyVisits: JSON.stringify(visitor.hourlyVisits),
        dailyVisits: JSON.stringify(visitor.dailyVisits),
        entityType: "Visitor",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    await docClient.send(command);
    return visitor;
  }

  /**
   * Create session record
   */
  static async createSession(
    sessionId: string,
    visitorId: string,
    fingerprintHash: string,
    sessionBehavior: SessionBehavior,
    context: {
      userAgent: string;
      ipAddress: string;
      referrer?: string;
    },
    timestamp: string
  ): Promise<VisitSession> {
    const hour = timestamp.substring(0, 13); // YYYY-MM-DDTHH
    const day = timestamp.substring(0, 10); // YYYY-MM-DD

    const session: VisitSession = {
      sessionId,
      visitorId,
      fingerprintHash,
      startTime: timestamp,
      pageViews: 1,
      interactions: sessionBehavior.mouseMovements + sessionBehavior.keystrokes,
      sessionBehavior,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      ...(context.referrer && { referrer: context.referrer }),
      timeWindow: { hour, day },
    };

    // Store session
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `SESSION#${sessionId}`,
        SK: "DETAILS",
        GSI1PK: `VISITOR#${visitorId}`,
        GSI1SK: timestamp,
        GSI2PK: `TIMEWINDOW#${hour}`,
        GSI2SK: sessionId,
        ...session,
        sessionBehavior: JSON.stringify(sessionBehavior),
        entityType: "Session",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    await docClient.send(command);
    return session;
  }

  /**
   * Update visitor statistics
   */
  static async updateVisitorStatistics(
    visitorId: string,
    hour: string,
    day: string,
    timestamp: string
  ): Promise<void> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `VISITOR#${visitorId}`,
          SK: "PROFILE",
        },
        UpdateExpression: `
          SET lastSeenAt = :timestamp,
              visitCount = visitCount + :one,
              hourlyVisits.#hour = if_not_exists(hourlyVisits.#hour, :zero) + :one,
              dailyVisits.#day = if_not_exists(dailyVisits.#day, :zero) + :one,
              updatedAt = :timestamp
        `,
        ExpressionAttributeNames: {
          "#hour": hour,
          "#day": day,
        },
        ExpressionAttributeValues: {
          ":timestamp": timestamp,
          ":one": 1,
          ":zero": 0,
        },
      });

      await docClient.send(command);
    } catch (error) {
      console.error("Error updating visitor statistics:", error);
    }
  }

  /**
   * Get sessions in time window
   */
  static async getSessionsInTimeWindow(
    start: Date,
    end: Date
  ): Promise<VisitSession[]> {
    const sessions: VisitSession[] = [];

    // Generate hourly time windows to query
    const current = new Date(start);
    while (current <= end) {
      const hourKey = current.toISOString().substring(0, 13);

      try {
        const command = new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI2",
          KeyConditionExpression: "GSI2PK = :pk",
          ExpressionAttributeValues: {
            ":pk": `TIMEWINDOW#${hourKey}`,
          },
        });

        const result = await docClient.send(command);

        if (result.Items) {
          sessions.push(
            ...result.Items.map((item: any) => ({
              sessionId: item.sessionId,
              visitorId: item.visitorId,
              fingerprintHash: item.fingerprintHash,
              startTime: item.startTime,
              endTime: item.endTime,
              duration: item.duration,
              pageViews: item.pageViews,
              interactions: item.interactions,
              sessionBehavior: JSON.parse(item.sessionBehavior || "{}"),
              userAgent: item.userAgent,
              ipAddress: item.ipAddress,
              referrer: item.referrer,
              timeWindow: item.timeWindow,
            }))
          );
        }
      } catch (error) {
        console.error(`Error querying sessions for ${hourKey}:`, error);
      }

      current.setHours(current.getHours() + 1);
    }

    return sessions;
  }

  /**
   * Get visitor by ID
   */
  static async getVisitorById(
    visitorId: string
  ): Promise<UniqueVisitor | null> {
    try {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `VISITOR#${visitorId}`,
          SK: "PROFILE",
        },
      });

      const result = await docClient.send(command);

      if (result.Item) {
        return {
          visitorId: result.Item["visitorId"],
          createdAt: result.Item["createdAt"],
          lastSeenAt: result.Item["lastSeenAt"],
          associatedFingerprints: result.Item["associatedFingerprints"],
          primaryFingerprintHash: result.Item["primaryFingerprintHash"],
          behavioralSignature: JSON.parse(
            result.Item["behavioralSignature"] || "{}"
          ),
          visitCount: result.Item["visitCount"],
          totalSessionTime: result.Item["totalSessionTime"],
          hourlyVisits: JSON.parse(result.Item["hourlyVisits"] || "{}"),
          dailyVisits: JSON.parse(result.Item["dailyVisits"] || "{}"),
          confidenceScore: result.Item["confidenceScore"],
          lastBehavioralUpdate: result.Item["lastBehavioralUpdate"],
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting visitor by ID:", error);
      return null;
    }
  }

  /**
   * Associate fingerprint with visitor
   */
  static async associateFingerprintWithVisitor(
    visitorId: string,
    fingerprintHash: string
  ): Promise<void> {
    // Update visitor's associated fingerprints
    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `VISITOR#${visitorId}`,
        SK: "PROFILE",
      },
      UpdateExpression: "ADD associatedFingerprints :fingerprint",
      ExpressionAttributeValues: {
        ":fingerprint": [fingerprintHash],
      },
    });

    await docClient.send(updateCommand);

    // Also create reverse lookup
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `FINGERPRINT_VISITOR#${fingerprintHash}`,
        SK: visitorId,
        GSI4PK: `FINGERPRINT#${fingerprintHash}`,
        GSI4SK: visitorId,
        entityType: "FingerprintVisitorMapping",
        createdAt: new Date().toISOString(),
      },
    });

    await docClient.send(putCommand);
  }

  /**
   * Update behavioral signature
   */
  static async updateBehavioralSignature(
    visitorId: string,
    behavioralSignature: BehavioralSignature,
    timestamp: string
  ): Promise<void> {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `VISITOR#${visitorId}`,
        SK: "PROFILE",
      },
      UpdateExpression:
        "SET behavioralSignature = :signature, lastBehavioralUpdate = :timestamp",
      ExpressionAttributeValues: {
        ":signature": JSON.stringify(behavioralSignature),
        ":timestamp": timestamp,
      },
    });

    await docClient.send(command);
  }

  // ================= HELPER METHODS =================

  /**
   * Gets all user-visitor relationships for a given user with detailed metadata
   */
  static async getUserVisitorRelationshipsWithDetails(userId: string): Promise<
    Array<{
      visitorId: string;
      confidence: number;
      firstSeen: string;
      lastSeen: string;
      associationCount: number;
    }>
  > {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI3",
        KeyConditionExpression: "GSI3PK = :userPk",
        ExpressionAttributeValues: {
          ":userPk": `USER_VISITOR#${userId}`,
        },
      });

      const result = await docClient.send(command);
      return (
        result.Items?.map((item) => ({
          visitorId: item["visitorId"] as string,
          confidence: item["confidence"] as number,
          firstSeen: item["firstSeen"] as string,
          lastSeen: item["lastSeen"] as string,
          associationCount: item["associationCount"] as number,
        })) || []
      );
    } catch (error) {
      console.error(
        "Error getting user-visitor relationships with details:",
        error
      );
      return [];
    }
  }

  /**
   * Gets all visitor-user relationships for a given visitor with detailed metadata
   */
  static async getVisitorUserRelationshipsWithDetails(
    visitorId: string
  ): Promise<
    Array<{
      userId: string;
      confidence: number;
      firstSeen: string;
      lastSeen: string;
      associationCount: number;
    }>
  > {
    try {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI3",
        KeyConditionExpression: "GSI3PK = :visitorPk",
        ExpressionAttributeValues: {
          ":visitorPk": `VISITOR_USER#${visitorId}`,
        },
      });

      const result = await docClient.send(command);
      return (
        result.Items?.map((item) => ({
          userId: item["userId"] as string,
          confidence: item["confidence"] as number,
          firstSeen: item["firstSeen"] as string,
          lastSeen: item["lastSeen"] as string,
          associationCount: item["associationCount"] as number,
        })) || []
      );
    } catch (error) {
      console.error(
        "Error getting visitor-user relationships with details:",
        error
      );
      return [];
    }
  }

  /**
   * Bulk update user-visitor relationships for visitor merging scenarios
   */
  static async bulkUpdateUserVisitorRelationships(
    oldVisitorId: string,
    newVisitorId: string
  ): Promise<void> {
    try {
      // Get all user relationships for the old visitor
      const oldRelationships =
        await this.getVisitorUserRelationshipsWithDetails(oldVisitorId);

      // Update each relationship to point to the new visitor
      for (const relationship of oldRelationships) {
        // Create new relationship with new visitor
        await this.createOrUpdateUserVisitorRelationship(
          relationship.userId,
          newVisitorId,
          relationship.confidence
        );

        // Remove old relationship
        await this.removeUserVisitorRelationship(
          relationship.userId,
          oldVisitorId
        );
      }

      console.log(
        `🔄 Bulk updated ${oldRelationships.length} user-visitor relationships from ${oldVisitorId} to ${newVisitorId}`
      );
    } catch (error) {
      console.error("Error in bulk update user-visitor relationships:", error);
      throw error;
    }
  }

  /**
   * Remove a specific user-visitor relationship
   */
  static async removeUserVisitorRelationship(
    userId: string,
    visitorId: string
  ): Promise<void> {
    try {
      const batch = [
        // Remove USER_VISITOR record
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER_VISITOR#${userId}`,
            SK: `VISITOR#${visitorId}`,
          },
        }),
        // Remove VISITOR_USER record
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `VISITOR_USER#${visitorId}`,
            SK: `USER#${userId}`,
          },
        }),
      ];

      await Promise.all(batch.map((command) => docClient.send(command)));
      console.log(
        `🗑️ Removed user-visitor relationship: ${userId} <-> ${visitorId}`
      );
    } catch (error) {
      console.error("Error removing user-visitor relationship:", error);
      throw error;
    }
  }
}
