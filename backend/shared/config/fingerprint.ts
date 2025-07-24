// Fingerprint system configuration
export interface FingerprintConfig {
  matching: {
    matchThreshold: number;
    highConfidenceThreshold: number;
    maxCandidates: number;
  };
  weights: {
    [key: string]: number;
  };
  entropy: {
    [key: string]: number;
  };
}

export const FINGERPRINT_CONFIG: FingerprintConfig = {
  matching: {
    matchThreshold: 0.85, // 85% similarity threshold for match
    highConfidenceThreshold: 0.95, // 95% for high confidence
    maxCandidates: 100, // Limit database scans
  },
  weights: {
    // High-entropy, stable features (most discriminative)
    canvasFingerprint: 0.15,
    webglVendor: 0.12,
    webglRenderer: 0.12,
    audioFingerprint: 0.1,
    installedFonts: 0.08,
    webrtcIps: 0.07,
    mediaDevices: 0.05,
    timingCrypto: 0.04,
    cssFeatures: 0.03,
    batteryLevel: 0.03,
    // Additional weights for comprehensive scoring
    screenResolution: 0.08,
    timezone: 0.04,
    language: 0.03,
    platform: 0.03,
    userAgent: 0.05,
    plugins: 0.02,
    storage: 0.02,
    sensors: 0.03,
    network: 0.04,
    webassembly: 0.03,
  },
  entropy: {
    // Entropy scores representing uniqueness of each feature
    canvasFingerprint: 0.95,
    webglVendor: 0.88,
    webglRenderer: 0.88,
    audioFingerprint: 0.85,
    installedFonts: 0.8,
    webrtcIps: 0.75,
    mediaDevices: 0.7,
    timingCrypto: 0.6,
    cssFeatures: 0.5,
    batteryLevel: 0.85,
    screenResolution: 0.75,
    timezone: 0.55,
    language: 0.45,
    platform: 0.4,
    userAgent: 0.65,
    plugins: 0.7,
    storage: 0.3,
    sensors: 0.8,
    network: 0.6,
    webassembly: 0.65,
  },
};

// Default entropy weights for DynamoDB service
export const DEFAULT_ENTROPY_WEIGHTS = {
  canvas: 0.15,
  webgl: 0.12,
  audio: 0.1,
  fonts: 0.08,
  css: 0.06,
  timing: 0.05,
  webrtc: 0.12,
  battery: 0.08,
  mediaDevices: 0.06,
  sensors: 0.05,
  network: 0.04,
  webassembly: 0.03,
  storage: 0.02,
  plugins: 0.02,
  behavioral: 0.02,
  server: 0.0, // Server data doesn't contribute to uniqueness
};
