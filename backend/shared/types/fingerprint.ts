// Enhanced Fingerprint System Types
export interface CoreFingerprintData {
  canvas: string;
  webgl: {
    vendor: string;
    renderer: string;
    unmaskedVendor?: string;
    unmaskedRenderer?: string;
    extensions: string[];
    parameters: Record<string, any>;
    renderHash: string;
  };
  audio: {
    contextHash: string;
    compressionRatio: number;
    oscillatorHash: string;
    dynamicsHash: string;
  };
  fonts: {
    available: Record<string, string>; // font -> measurement hash
    systemFonts: string[];
    webFonts: string[];
  };
  css: {
    mediaQueries: Record<string, boolean>;
    computedStyles: Record<string, string>;
    supportedFeatures: string[];
  };
  timing: {
    cryptoTiming: number;
    regexTiming: number;
    sortTiming: number;
    wasmTiming?: number;
  };
}

export interface AdvancedFingerprintData {
  webrtc: {
    localIPs: string[];
    stunResponses: Record<string, any>;
    rtcCapabilities: {
      codecs: string[];
      headerExtensions: string[];
    };
    iceGatheringTime: number;
    candidateTypes: string[];
  };
  battery: {
    level?: number;
    charging?: boolean;
    chargingTime?: number;
    dischargingTime?: number;
    batteryHash: string;
  };
  mediaDevices: {
    videoInputs: number;
    audioInputs: number;
    audioOutputs: number;
    deviceLabels: string[];
    permissionStatus: string;
  };
  sensors: {
    accelerometer: {
      available: boolean;
      precision?: number;
      noisePattern?: string;
    };
    gyroscope: {
      available: boolean;
      precision?: number;
      noisePattern?: string;
    };
    magnetometer: {
      available: boolean;
      precision?: number;
    };
    deviceOrientation: boolean;
    deviceMotion: boolean;
  };
  network: {
    available: boolean;
    endpoints: Array<{
      url: string;
      location: string;
      provider: string;
      rtt: number;
      status: number;
      timestamp: number;
    }>;
    analysis: {
      avgRTT: number;
      minRTT: number;
      maxRTT: number;
      jitter: number;
      packetLoss: number;
      stability: number;
    };
    connection: {
      type?: string;
      effectiveType?: string;
      downlink?: number;
      downlinkMax?: number;
      rtt?: number;
      saveData?: boolean;
    };
    timingPatterns: {
      dnsLookup: number[];
      tcpConnect: number[];
      tlsHandshake: number[];
      requestResponse: number[];
      totalTime: number[];
    };
    bandwidth: {
      estimated: number;
      downloadSpeed: number;
      uploadSpeed: number;
      testDuration: number;
    };
    geographic: {
      estimatedLocation: string;
      timezone: string;
      proximityToServers: Record<string, number>;
    };
    characteristics: {
      mtu: number;
      ipVersion: string;
      dnsProvider: string;
      proxy: boolean;
      vpn: boolean;
      tor: boolean;
    };
    privacyIndicators: {
      maskedIP: boolean;
      reducedTiming: boolean;
      artificialDelays: boolean;
      tunneled: boolean;
    };
    networkHash: string;
    timingHash: string;
    confidenceLevel: number;
    collectionTime: number;
    testDuration: number;
    errorCount: number;
  };
  webassembly: {
    supported: boolean;
    simdSupported: boolean;
    threadsSupported: boolean;
    bulkMemorySupported: boolean;
    wasmModules: string[];
    instructionTiming: Record<string, number>;
  };
  storage: {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    webSQL: boolean;
    serviceWorker: boolean;
    cacheAPI: boolean;
    persistentStorage: boolean;
    storageQuota?: number;
  };
  plugins: {
    extensions: string[];
    plugins: string[];
    mimeTypes: string[];
    adBlocker: boolean;
    devTools: boolean;
    automation: boolean;
  };
}

export interface ServerEnhancementData {
  tlsFingerprint: {
    cipherSuite?: string;
    tlsVersion?: string;
    certChain?: string[];
    extensions?: string[];
    alpnProtocol?: string;
  };
  httpHeaders: {
    userAgent: string;
    acceptLanguage: string;
    acceptEncoding: string;
    acceptCharset?: string;
    connection?: string;
    cacheControl?: string;
    upgradeInsecureRequests?: string;
    dnt?: string;
    secFetchDest?: string;
    secFetchMode?: string;
    secFetchSite?: string;
    secFetchUser?: string;
  };
  ipGeolocation: {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
    timezone: string;
    isp: string;
    org: string;
    asn: string;
    proxy: boolean;
    vpn: boolean;
    tor: boolean;
  };
  serverTiming: {
    processingTime: number;
    databaseTime: number;
    networkLatency: number;
    requestSize: number;
    responseSize: number;
  };
}

export interface BehavioralData {
  mouseMovements: {
    entropy: number;
    patterns: string[];
    velocity: number[];
    acceleration: number[];
    clickPatterns: string[];
  };
  keyboardPatterns: {
    typingSpeed: number;
    dwellTimes: number[];
    flightTimes: number[];
    rhythm: string;
  };
  scrollBehavior: {
    patterns: string[];
    velocity: number[];
    acceleration: number[];
  };
  touchBehavior?: {
    touchPoints: number;
    pressure: number[];
    gestures: string[];
  };
}

// Main Fingerprint Entity for DynamoDB
export interface FingerprintEntity {
  // Primary Keys
  PK: string; // FINGERPRINT#{fingerprintId}
  SK: string; // METADATA

  // Global Secondary Indexes
  GSI1PK: string; // USER#{userId} | ANONYMOUS
  GSI1SK: string; // {timestamp}#{fingerprintId}
  GSI2PK: string; // FP_HASH#{hash}
  GSI2SK: string; // {confidence}#{timestamp}
  GSI3PK: string; // ANALYTICS#{date}
  GSI3SK: string; // {hour}#{fingerprintId}
  GSI4PK: string; // DEVICE_TYPE#{category}
  GSI4SK: string; // {os}#{browser}#{timestamp}

  // Entity metadata
  EntityType: "Fingerprint";

  // Core identification
  fingerprintId: string;
  userId?: string;
  sessionId?: string;
  fingerprintHash: string;
  fuzzyHashes: string[]; // Multiple hashes for fuzzy matching
  confidence: number; // 0-100 accuracy score
  deviceCategory: "desktop" | "mobile" | "tablet" | "unknown";

  // Fingerprint data
  coreFingerprint: CoreFingerprintData;
  advancedFingerprint: AdvancedFingerprintData;
  serverEnhancement: ServerEnhancementData;
  behavioralData?: BehavioralData;

  // Analytics metadata
  entropy: number; // Overall entropy score 0-1
  uniqueness: number; // Uniqueness factor 0-1
  riskScore: number; // Risk assessment 0-100

  // Browser/Device info
  userAgent: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceModel?: string;

  // Location and network
  ipAddress: string; // Hashed for privacy
  country: string;
  timezone: string;

  // Timestamps and TTL
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
  expiresAt: string; // TTL for DynamoDB
  ttl: number; // Unix timestamp for TTL

  // Privacy and compliance
  consentGiven: boolean;
  dataProcessingPurpose: string[];
  retentionCategory: "analytics" | "security" | "personalization";

  rawFingerprint?: any; // Raw fingerprint data for advanced analytics or similarity checks
}

// Fingerprint session correlation entity
export interface FingerprintSessionEntity {
  PK: string; // FINGERPRINT#{fingerprintId}
  SK: string; // SESSION#{sessionId}
  GSI1PK: string; // SESSION#{sessionId}
  GSI1SK: string; // {timestamp}#{fingerprintId}
  EntityType: "FingerprintSession";

  fingerprintId: string;
  sessionId: string;
  userId?: string;
  correlationScore: number; // 0-100
  sessionStartTime: string;
  sessionEndTime?: string;
  pageViews: number;
  actionsCount: number;
  createdAt: string;
  ttl: number;
}

// Fingerprint analytics entity for time-series data
export interface FingerprintAnalyticsEntity {
  PK: string; // ANALYTICS#{date}
  SK: string; // {hour}#{minute}#{fingerprintId}
  GSI1PK: string; // ANALYTICS_TYPE#{type}
  GSI1SK: string; // {timestamp}#{fingerprintId}
  EntityType: "FingerprintAnalytics";

  fingerprintId: string;
  analyticsType: "pageview" | "interaction" | "conversion" | "error";
  eventData: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ttl: number;
}

// Request/Response types
export interface FingerprintCollectionRequest {
  coreFingerprint: CoreFingerprintData;
  advancedFingerprint: AdvancedFingerprintData;
  behavioralData?: BehavioralData;
  sessionId?: string;
  pageUrl: string;
  referrer?: string;
  consentGiven: boolean;
  dataProcessingPurpose: string[];
}

export interface FingerprintCollectionResponse {
  success: boolean;
  data?: {
    fingerprintId: string;
    confidence: number;
    deviceCategory: string;
    existingUser: boolean;
    similarFingerprints: string[];
  };
  error?: string;
}

export interface FingerprintMatchRequest {
  fingerprintHash: string;
  confidenceThreshold: number;
  maxResults: number;
}

export interface FingerprintMatchResponse {
  success: boolean;
  data?: {
    matches: Array<{
      fingerprintId: string;
      similarity: number;
      confidence: number;
      lastSeen: string;
      userId?: string;
    }>;
    totalMatches: number;
  };
  error?: string;
}

// Utility types for entropy calculation
export interface EntropyWeights {
  canvas: number;
  webgl: number;
  audio: number;
  fonts: number;
  css: number;
  timing: number;
  webrtc: number;
  battery: number;
  mediaDevices: number;
  sensors: number;
  network: number;
  webassembly: number;
  storage: number;
  plugins: number;
  behavioral: number;
  server: number;
}

export interface FingerprintSimilarityResult {
  fingerprintId: string;
  similarity: number;
  confidence: number;
  matchedComponents: string[];
  weightedScore: number;
}

export interface BehavioralFingerprint {
  available: boolean;
  mouseEvents: Array<{
    type: "move" | "click" | "scroll" | "drag" | "hover";
    x: number;
    y: number;
    timestamp: number;
    button?: number;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    target?: string;
    deltaX?: number;
    deltaY?: number;
    velocity?: number;
    pressure?: number;
  }>;
  keyboardEvents: Array<{
    type: "keydown" | "keyup" | "keypress";
    key: string;
    code: string;
    timestamp: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    repeat: boolean;
    dwellTime?: number;
    flightTime?: number;
  }>;
  touchEvents: Array<{
    type: "touchstart" | "touchmove" | "touchend" | "touchcancel";
    touches: Array<{
      identifier: number;
      x: number;
      y: number;
      force?: number;
      radiusX?: number;
      radiusY?: number;
      rotationAngle?: number;
    }>;
    timestamp: number;
    target?: string;
  }>;
  mousePatterns: {
    movementPattern: {
      velocity: number;
      acceleration: number;
      jerk: number;
      straightness: number;
      curvature: number;
      tremor: number;
      pauses: number;
      direction: number;
      smoothness: number;
      trajectoryLength: number;
    };
    clickPattern: {
      clickRate: number;
      doubleClickTime: number;
      accuracy: number;
      pressure: number;
      dwellTime: number;
      targetSize: number;
      distanceFromCenter: number;
    };
    scrollPattern: {
      direction: "up" | "down" | "left" | "right";
      velocity: number;
      acceleration: number;
      duration: number;
      distance: number;
      smoothness: number;
      pauseCount: number;
      averagePauseTime: number;
    };
    habitualPaths: Array<{
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      frequency: number;
      avgTime: number;
    }>;
  };
  typingPatterns: {
    overall: {
      wpm: number;
      cpm: number;
      accuracy: number;
      rhythm: number;
      dwellTime: number;
      flightTime: number;
      pausePattern: number[];
      keyPressure: number;
      backspaceFrequency: number;
      capitalizationPattern: string;
    };
    byKey: Record<
      string,
      {
        frequency: number;
        avgDwellTime: number;
        avgFlightTime: number;
        pressure: number;
      }
    >;
    bigramTimings: Record<string, number>;
    trigramTimings: Record<string, number>;
    commonSequences: Array<{
      sequence: string;
      frequency: number;
      avgTiming: number;
    }>;
  };
  touchPatterns: {
    swipeVelocity: number;
    tapPressure: number;
    tapDuration: number;
    pinchGestures: number;
    rotationGestures: number;
    multiTouchFrequency: number;
    fingerSpacing: number;
  };
  interactionPatterns: {
    sessionDuration: number;
    pageViewDuration: number;
    scrollDepth: number;
    clickDepth: number;
    timeToFirstInteraction: number;
    interactionFrequency: number;
    pausePatterns: number[];
    focusLossFrequency: number;
    tabSwitchFrequency: number;
  };
  signatures: {
    mouseSignature: string;
    keyboardSignature: string;
    touchSignature: string;
    navigationSignature: string;
    timingSignature: string;
  };
  humanVerification: {
    mouseHumanness: number;
    keyboardHumanness: number;
    touchHumanness: number;
    overallHumanness: number;
    botProbability: number;
    automationDetection: {
      perfectTiming: boolean;
      impossibleSpeed: boolean;
      linearMovement: boolean;
      repetitivePatterns: boolean;
      lackOfVariation: boolean;
    };
  };
  collectionMetadata: {
    startTime: number;
    endTime: number;
    totalEvents: number;
    samplingRate: number;
    eventTypes: string[];
    dataQuality: number;
    privacyLevel: "minimal" | "standard" | "comprehensive";
  };
  statistics: {
    entropy: number;
    variance: number;
    standardDeviation: number;
    correlationCoefficients: Record<string, number>;
    anomalyScore: number;
    consistencyScore: number;
    uniquenessScore: number;
  };
  privacy: {
    dataMinimized: boolean;
    sensitiveDataFiltered: boolean;
    anonymized: boolean;
    retentionPeriod: number;
    consentLevel: string;
  };
  behavioralHash: string;
  confidenceLevel: number;
  collectionTime: number;
  errorCount: number;
}
