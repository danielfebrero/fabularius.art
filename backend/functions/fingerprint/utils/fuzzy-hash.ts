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
  | "canvas"
  | "webglVendor"
  | "webglRenderer"
  | "audioContext"
  | "screenResolution"
  | "timezone"
  | "language"
  | "webglExtensions"
  | "fontSample"
  | "userAgent"
  | "userId" // User identity when available
  | "webrtcLocalIPs" // WebRTC local IP addresses
  | "webrtcNATType" // NAT type from WebRTC
  | "webrtcCapabilities" // RTC codec capabilities
  | "batteryCharacteristics" // Battery level and charging patterns
  | "mediaDeviceSignature" // Available media devices
  | "sensorCapabilities" // Device sensor availability
  | "networkTiming" // Network characteristics and timing
  | "storageCapabilities" // Available storage APIs
  | "pluginSignature" // Browser plugins and extensions
  | "cssCapabilities" // Advanced CSS feature support
  | "timingProfile" // Performance timing characteristics
  | "hardwareProfile" // Combined hardware indicators
  | "behavioralSignature"; // User behavioral patterns

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
  userId: string; // User identity when available
  webrtcLocalIPs: string; // Hashed local IP addresses
  webrtcNATType: string; // NAT type characteristics
  webrtcCapabilities: string; // Codec and transport capabilities
  batteryCharacteristics: string; // Battery level and charging patterns
  mediaDeviceSignature: string; // Available media devices hash
  sensorCapabilities: string; // Device sensor availability
  networkTiming: string; // Network timing patterns
  storageCapabilities: string; // Available storage APIs
  pluginSignature: string; // Browser plugins and extensions
  cssCapabilities: string; // Advanced CSS feature support
  timingProfile: string; // Performance timing characteristics
  hardwareProfile: string; // Combined hardware indicators
  behavioralSignature: string; // User behavioral patterns
}

// Predefined LSH bucket configurations with entropy weights
const LSH_BUCKET_CONFIGS: LSHBucketConfig[] = [
  {
    name: "coreHardware",
    features: ["canvas", "webglVendor", "webglRenderer", "audioContext"],
    entropy: 0.95, // Very high uniqueness - hardware combinations are highly diverse
    weight: 1.0,
    collisionProbability: 0.001,
  },
  {
    name: "userLocationProfile",
    features: ["userId", "webrtcLocalIPs"],
    entropy: 0.99, // MAXIMUM uniqueness - user + network location is nearly unique
    weight: 1.0,
    collisionProbability: 0.00001,
  },
  {
    name: "userBehaviorProfile",
    features: ["userId", "behavioralSignature"],
    entropy: 0.98, // Very high uniqueness - user + behavior patterns
    weight: 1.0,
    collisionProbability: 0.00005,
  },
  {
    name: "localIPHardware",
    features: ["webrtcLocalIPs", "hardwareProfile"],
    entropy: 0.94, // Very high uniqueness - network location + device hardware
    weight: 0.95,
    collisionProbability: 0.002,
  },
  {
    name: "behaviorNetworkDevice",
    features: ["behavioralSignature", "webrtcLocalIPs", "mediaDeviceSignature"],
    entropy: 0.91, // Very high uniqueness - behavior + network + device
    weight: 0.92,
    collisionProbability: 0.003,
  },
  {
    name: "webrtcNetworkProfile",
    features: [
      "webrtcLocalIPs",
      "webrtcNATType",
      "webrtcCapabilities",
      "networkTiming",
    ],
    entropy: 0.92, // Very high uniqueness - comprehensive network fingerprint
    weight: 0.95,
    collisionProbability: 0.002,
  },
  {
    name: "userDeviceComplete",
    features: [
      "userId",
      "hardwareProfile",
      "webrtcLocalIPs",
      "behavioralSignature",
    ],
    entropy: 0.99, // Maximum uniqueness - complete user-device-network-behavior profile
    weight: 1.0,
    collisionProbability: 0.00001,
  },
  {
    name: "hardwareCapabilities",
    features: [
      "hardwareProfile",
      "mediaDeviceSignature",
      "sensorCapabilities",
      "batteryCharacteristics",
    ],
    entropy: 0.88, // High uniqueness - device hardware combinations are diverse
    weight: 0.9,
    collisionProbability: 0.005,
  },
  {
    name: "behaviorHardware",
    features: ["behavioralSignature", "hardwareProfile", "timingProfile"],
    entropy: 0.87, // High uniqueness - behavior + hardware performance patterns
    weight: 0.88,
    collisionProbability: 0.006,
  },
  {
    name: "networkBehaviorTiming",
    features: ["networkTiming", "behavioralSignature", "webrtcNATType"],
    entropy: 0.85, // High uniqueness - network performance + behavior patterns
    weight: 0.85,
    collisionProbability: 0.008,
  },
  {
    name: "browserPlatform",
    features: [
      "cssCapabilities",
      "storageCapabilities",
      "pluginSignature",
      "timingProfile",
    ],
    entropy: 0.85, // High uniqueness - browser/platform combinations are varied
    weight: 0.85,
    collisionProbability: 0.008,
  },
  {
    name: "localIPEnvironment",
    features: ["webrtcLocalIPs", "timezone", "language", "screenResolution"],
    entropy: 0.89, // High uniqueness - network location + environmental context
    weight: 0.88,
    collisionProbability: 0.005,
  },
  {
    name: "deviceEnvironment",
    features: [
      "screenResolution",
      "timezone",
      "language",
      "sensorCapabilities",
    ],
    entropy: 0.75, // Good uniqueness - but common resolutions/timezones exist
    weight: 0.8,
    collisionProbability: 0.05,
  },
  {
    name: "webglCapabilities",
    features: [
      "webglVendor",
      "webglRenderer",
      "webglExtensions",
      "timingProfile",
    ],
    entropy: 0.9, // Very high uniqueness - GPU profiles highly specific
    weight: 0.95,
    collisionProbability: 0.005,
  },
  {
    name: "networkDevice",
    features: [
      "webrtcLocalIPs",
      "networkTiming",
      "batteryCharacteristics",
      "mediaDeviceSignature",
    ],
    entropy: 0.87, // High uniqueness - network + device combination
    weight: 0.9,
    collisionProbability: 0.006,
  },
  {
    name: "audioVisualProfile",
    features: [
      "canvas",
      "audioContext",
      "mediaDeviceSignature",
      "hardwareProfile",
    ],
    entropy: 0.83, // High uniqueness - multimedia capabilities combination
    weight: 0.85,
    collisionProbability: 0.01,
  },
  {
    name: "userProfile",
    features: ["userId", "timezone", "language", "screenResolution"],
    entropy: 0.98, // Highest uniqueness when userId available
    weight: 1.0,
    collisionProbability: 0.0001,
  },
  {
    name: "behavioralDevice",
    features: [
      "behavioralSignature",
      "sensorCapabilities",
      "mediaDeviceSignature",
      "batteryCharacteristics",
    ],
    entropy: 0.84, // High uniqueness - behavior + physical device characteristics
    weight: 0.86,
    collisionProbability: 0.008,
  },
  {
    name: "browserFingerprint",
    features: [
      "fontSample",
      "cssCapabilities",
      "pluginSignature",
      "storageCapabilities",
    ],
    entropy: 0.78, // Good uniqueness - browser-specific features
    weight: 0.75,
    collisionProbability: 0.02,
  },
  {
    name: "platformStability",
    features: [
      "webglVendor",
      "userAgent",
      "sensorCapabilities",
      "storageCapabilities",
    ],
    entropy: 0.72, // Medium-high uniqueness - platform characteristics
    weight: 0.7,
    collisionProbability: 0.03,
  },
  {
    name: "deviceCharacteristics",
    features: [
      "batteryCharacteristics",
      "sensorCapabilities",
      "mediaDeviceSignature",
      "timingProfile",
    ],
    entropy: 0.81, // High uniqueness - physical device characteristics
    weight: 0.82,
    collisionProbability: 0.012,
  },
  {
    name: "networkHardware",
    features: [
      "webrtcCapabilities",
      "webrtcNATType",
      "hardwareProfile",
      "cssCapabilities",
    ],
    entropy: 0.84, // High uniqueness - network + hardware combination
    weight: 0.88,
    collisionProbability: 0.008,
  },
  {
    name: "comprehensiveDevice",
    features: [
      "canvas",
      "webrtcLocalIPs",
      "hardwareProfile",
      "pluginSignature",
      "networkTiming",
    ],
    entropy: 0.93, // Very high uniqueness - comprehensive device signature
    weight: 0.95,
    collisionProbability: 0.003,
  },
];

/**
 * Generate a locality-sensitive hash (LSH) from fingerprint data
 * This creates multiple hash "buckets" that similar fingerprints will likely share
 */
export function generateLocalitySensitiveHashes(
  coreFingerprint: any,
  advancedFingerprint: any,
  userId?: string,
  behavioralData?: any
): string[] {
  const hashes: string[] = [];

  // Extract stable features for LSH
  const stableFeatures = extractStableFeatures(
    coreFingerprint,
    advancedFingerprint,
    userId,
    behavioralData
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
  userId?: string,
  behavioralData?: any
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

    // WebRTC features (network-level fingerprinting)
    webrtcLocalIPs: extractWebRTCLocalIPs(advancedFingerprint?.webrtc),
    webrtcNATType: extractWebRTCNATType(advancedFingerprint?.webrtc),
    webrtcCapabilities: extractWebRTCCapabilities(advancedFingerprint?.webrtc),

    // Hardware characteristics
    batteryCharacteristics: extractBatteryCharacteristics(
      advancedFingerprint?.battery
    ),
    mediaDeviceSignature: extractMediaDeviceSignature(
      advancedFingerprint?.mediaDevices
    ),
    sensorCapabilities: extractSensorCapabilities(advancedFingerprint?.sensors),

    // Network and performance characteristics
    networkTiming: extractNetworkTiming(advancedFingerprint?.network),
    storageCapabilities: extractStorageCapabilities(
      advancedFingerprint?.storage
    ),
    pluginSignature: extractPluginSignature(advancedFingerprint?.plugins),

    // Advanced browser capabilities
    cssCapabilities: extractCSSCapabilities(coreFingerprint?.css),
    timingProfile: extractTimingProfile(coreFingerprint?.timing),

    // Combined hardware profile
    hardwareProfile: extractHardwareProfile(
      coreFingerprint,
      advancedFingerprint
    ),

    // Behavioral patterns (when available)
    behavioralSignature: extractBehavioralSignature(behavioralData),
  };
}

/**
 * Generate a single LSH bucket using the specified feature configuration
 */
function generateLSHBucket(
  features: StableFeatures,
  config: LSHBucketConfig
): string {
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
 * Extract WebRTC local IP addresses for network fingerprinting
 */
function extractWebRTCLocalIPs(webrtc: any): string {
  try {
    if (!webrtc?.localIPs || !Array.isArray(webrtc.localIPs)) return "";

    // Hash the local IPs for privacy while maintaining uniqueness
    const localIPs = webrtc.localIPs
      .filter((ip: string) => ip && typeof ip === "string")
      .sort() // Ensure consistent ordering
      .join(",");

    if (!localIPs) return "";

    return crypto
      .createHash("md5")
      .update(localIPs)
      .digest("hex")
      .substring(0, 12);
  } catch {
    return "";
  }
}

/**
 * Extract WebRTC NAT type for network topology fingerprinting
 */
function extractWebRTCNATType(webrtc: any): string {
  try {
    const natType = webrtc?.natType || "";
    const candidateTypes = Array.isArray(webrtc?.candidateTypes)
      ? webrtc.candidateTypes.sort().join(",")
      : "";

    const natFingerprint = { natType, candidateTypes };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(natFingerprint))
      .digest("hex")
      .substring(0, 8);
  } catch {
    return "";
  }
}

/**
 * Extract WebRTC capabilities (codecs, extensions) for browser fingerprinting
 */
function extractWebRTCCapabilities(webrtc: any): string {
  try {
    const capabilities = {
      codecs: Array.isArray(webrtc?.rtcCapabilities?.codecs)
        ? webrtc.rtcCapabilities.codecs.slice(0, 10).sort()
        : [],
      headerExtensions: Array.isArray(webrtc?.rtcCapabilities?.headerExtensions)
        ? webrtc.rtcCapabilities.headerExtensions.slice(0, 5).sort()
        : [],
    };

    if (
      capabilities.codecs.length === 0 &&
      capabilities.headerExtensions.length === 0
    ) {
      return "";
    }

    return crypto
      .createHash("md5")
      .update(JSON.stringify(capabilities))
      .digest("hex")
      .substring(0, 10);
  } catch {
    return "";
  }
}

/**
 * Extract battery characteristics for device fingerprinting
 */
function extractBatteryCharacteristics(battery: any): string {
  try {
    if (!battery) return "";

    const characteristics = {
      level: battery.level ? Math.floor(battery.level * 10) / 10 : null, // Round to 0.1 precision
      charging: battery.charging || false,
      chargingTime: battery.chargingTime
        ? Math.floor(battery.chargingTime / 3600)
        : null, // Hours
      dischargingTime: battery.dischargingTime
        ? Math.floor(battery.dischargingTime / 3600)
        : null, // Hours
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(characteristics))
      .digest("hex")
      .substring(0, 8);
  } catch {
    return "";
  }
}

/**
 * Extract media device signature for hardware fingerprinting
 */
function extractMediaDeviceSignature(mediaDevices: any): string {
  try {
    if (!mediaDevices) return "";

    const signature = {
      videoInputs: mediaDevices.videoInputs || 0,
      audioInputs: mediaDevices.audioInputs || 0,
      audioOutputs: mediaDevices.audioOutputs || 0,
      // Don't include device labels for privacy
      hasLabels:
        Array.isArray(mediaDevices.deviceLabels) &&
        mediaDevices.deviceLabels.length > 0,
      permissionStatus: mediaDevices.permissionStatus || "unknown",
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(signature))
      .digest("hex")
      .substring(0, 8);
  } catch {
    return "";
  }
}

/**
 * Extract sensor capabilities for device fingerprinting
 */
function extractSensorCapabilities(sensors: any): string {
  try {
    if (!sensors) return "";

    const capabilities = {
      accelerometer: sensors.accelerometer?.available || false,
      gyroscope: sensors.gyroscope?.available || false,
      magnetometer: sensors.magnetometer?.available || false,
      deviceOrientation: sensors.deviceOrientation || false,
      deviceMotion: sensors.deviceMotion || false,
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(capabilities))
      .digest("hex")
      .substring(0, 6);
  } catch {
    return "";
  }
}

/**
 * Extract network timing characteristics for connection fingerprinting
 */
function extractNetworkTiming(network: any): string {
  try {
    if (!network) return "";

    const timing = {
      available: network.available || false,
      avgRTT: network.analysis?.avgRTT
        ? Math.floor(network.analysis.avgRTT / 10) * 10
        : 0, // Round to 10ms
      jitter: network.analysis?.jitter
        ? Math.floor(network.analysis.jitter * 10) / 10
        : 0,
      bandwidth: network.bandwidth?.estimated
        ? Math.floor(network.bandwidth.estimated / 1000) * 1000 // Round to nearest Kbps
        : 0,
      characteristics: {
        proxy: network.characteristics?.proxy || false,
        vpn: network.characteristics?.vpn || false,
        tor: network.characteristics?.tor || false,
      },
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(timing))
      .digest("hex")
      .substring(0, 10);
  } catch {
    return "";
  }
}

/**
 * Extract storage capabilities for browser fingerprinting
 */
function extractStorageCapabilities(storage: any): string {
  try {
    if (!storage) return "";

    const capabilities = {
      localStorage: storage.localStorage || false,
      sessionStorage: storage.sessionStorage || false,
      indexedDB: storage.indexedDB || false,
      webSQL: storage.webSQL || false,
      serviceWorker: storage.serviceWorker || false,
      cacheAPI: storage.cacheAPI || false,
      persistentStorage: storage.persistentStorage || false,
      // Rough storage quota categories for fingerprinting
      quotaCategory: storage.storageQuota
        ? Math.floor(storage.storageQuota / (100 * 1024 * 1024)) // 100MB buckets
        : 0,
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(capabilities))
      .digest("hex")
      .substring(0, 8);
  } catch {
    return "";
  }
}

/**
 * Extract plugin signature for browser fingerprinting
 */
function extractPluginSignature(plugins: any): string {
  try {
    if (!plugins) return "";

    const signature = {
      extensionCount: Array.isArray(plugins.extensions)
        ? plugins.extensions.length
        : 0,
      pluginCount: Array.isArray(plugins.plugins) ? plugins.plugins.length : 0,
      mimeTypeCount: Array.isArray(plugins.mimeTypes)
        ? plugins.mimeTypes.length
        : 0,
      adBlocker: plugins.adBlocker || false,
      devTools: plugins.devTools || false,
      automation: plugins.automation || false,
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(signature))
      .digest("hex")
      .substring(0, 8);
  } catch {
    return "";
  }
}

/**
 * Extract CSS capabilities for browser fingerprinting
 */
function extractCSSCapabilities(css: any): string {
  try {
    if (!css) return "";

    // Count supported features by category
    const capabilities = {
      mediaQuerySupport: Object.values(css.mediaQueries || {}).filter(Boolean)
        .length,
      featureSupport: Array.isArray(css.supportedFeatures)
        ? css.supportedFeatures.length
        : 0,
      // Hash of a few key computed styles for browser identification
      computedStyleHash: css.computedStyles
        ? crypto
            .createHash("md5")
            .update(JSON.stringify(css.computedStyles))
            .digest("hex")
            .substring(0, 6)
        : "",
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(capabilities))
      .digest("hex")
      .substring(0, 8);
  } catch {
    return "";
  }
}

/**
 * Extract timing profile for performance fingerprinting
 */
function extractTimingProfile(timing: any): string {
  try {
    if (!timing) return "";

    // Normalize timing values to reduce volatility
    const profile = {
      cryptoTiming: timing.cryptoTiming
        ? Math.floor(timing.cryptoTiming / 10) * 10
        : 0,
      regexTiming: timing.regexTiming
        ? Math.floor(timing.regexTiming / 10) * 10
        : 0,
      sortTiming: timing.sortTiming
        ? Math.floor(timing.sortTiming / 10) * 10
        : 0,
      wasmTiming: timing.wasmTiming
        ? Math.floor(timing.wasmTiming / 10) * 10
        : 0,
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(profile))
      .digest("hex")
      .substring(0, 8);
  } catch {
    return "";
  }
}

/**
 * Extract combined hardware profile for device fingerprinting
 */
function extractHardwareProfile(
  coreFingerprint: any,
  advancedFingerprint: any
): string {
  try {
    const profile = {
      // Core hardware indicators
      webglVendor: coreFingerprint?.webgl?.vendor || "",
      webglRenderer: coreFingerprint?.webgl?.renderer || "",
      audioCompressionRatio: coreFingerprint?.audio?.compressionRatio || 0,

      // Advanced hardware indicators
      mediaDevices: {
        video: advancedFingerprint?.mediaDevices?.videoInputs || 0,
        audio: advancedFingerprint?.mediaDevices?.audioInputs || 0,
      },
      sensors: {
        accelerometer:
          advancedFingerprint?.sensors?.accelerometer?.available || false,
        gyroscope: advancedFingerprint?.sensors?.gyroscope?.available || false,
      },
      battery: {
        available: !!advancedFingerprint?.battery,
        charging: advancedFingerprint?.battery?.charging || false,
      },
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(profile))
      .digest("hex")
      .substring(0, 12);
  } catch {
    return "";
  }
}

/**
 * Extract behavioral signature for user interaction patterns
 */
function extractBehavioralSignature(behavioralData: any): string {
  try {
    if (!behavioralData) return "";

    const signature = {
      // Mouse behavior patterns (normalized to reduce volatility)
      mouseEntropy: behavioralData.mouseMovements?.entropy
        ? Math.floor(behavioralData.mouseMovements.entropy * 10) / 10
        : 0,
      avgMouseVelocity:
        behavioralData.mouseMovements?.velocity?.length > 0
          ? Math.floor(
              behavioralData.mouseMovements.velocity.reduce(
                (a: number, b: number) => a + b,
                0
              ) /
                behavioralData.mouseMovements.velocity.length /
                10
            ) * 10
          : 0,
      clickPatternCount: Array.isArray(
        behavioralData.mouseMovements?.clickPatterns
      )
        ? behavioralData.mouseMovements.clickPatterns.length
        : 0,

      // Keyboard behavior patterns
      typingSpeed: behavioralData.keyboardPatterns?.typingSpeed
        ? Math.floor(behavioralData.keyboardPatterns.typingSpeed / 10) * 10
        : 0,
      avgDwellTime:
        behavioralData.keyboardPatterns?.dwellTimes?.length > 0
          ? Math.floor(
              behavioralData.keyboardPatterns.dwellTimes.reduce(
                (a: number, b: number) => a + b,
                0
              ) /
                behavioralData.keyboardPatterns.dwellTimes.length /
                5
            ) * 5
          : 0,
      rhythmPattern: behavioralData.keyboardPatterns?.rhythm || "",

      // Scroll behavior patterns
      scrollPatternCount: Array.isArray(behavioralData.scrollBehavior?.patterns)
        ? behavioralData.scrollBehavior.patterns.length
        : 0,
      avgScrollVelocity:
        behavioralData.scrollBehavior?.velocity?.length > 0
          ? Math.floor(
              behavioralData.scrollBehavior.velocity.reduce(
                (a: number, b: number) => a + b,
                0
              ) /
                behavioralData.scrollBehavior.velocity.length /
                50
            ) * 50
          : 0,

      // Touch behavior (if available)
      touchPoints: behavioralData.touchBehavior?.touchPoints || 0,
      gestureCount: Array.isArray(behavioralData.touchBehavior?.gestures)
        ? behavioralData.touchBehavior.gestures.length
        : 0,
    };

    // Only create hash if we have meaningful behavioral data
    const hasData =
      signature.mouseEntropy > 0 ||
      signature.typingSpeed > 0 ||
      signature.scrollPatternCount > 0;
    if (!hasData) return "";

    return crypto
      .createHash("md5")
      .update(JSON.stringify(signature))
      .digest("hex")
      .substring(0, 10);
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
