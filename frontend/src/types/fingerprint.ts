// Frontend fingerprint types (mirror of backend types)

// Individual fingerprinting module interfaces
export interface CanvasFingerprint {
  isSupported: boolean;
  basic: string;
  advanced: string;
  fonts: Record<string, string>;
  textSamples: Record<string, string>;
  textMetrics: Record<string, any>;
  blendModes: Record<string, string>;
  imageData: string;
  entropy: number;
}

export interface WebGLFingerprint {
  isSupported: boolean;
  vendor: string;
  renderer: string;
  unmaskedVendor?: string;
  unmaskedRenderer?: string;
  version: string;
  shadingLanguageVersion: string;
  extensions: string[];
  parameters: Record<string, any>;
  capabilities: Record<string, any>;
  renderHashes: {
    basic: string;
    triangle: string;
    gradient: string;
    floating: string;
  };
  supportedFormats: {
    textures: string[];
    renderbuffers: string[];
  };
  maxValues: Record<string, number>;
  entropy: number;
}

export interface AudioFingerprint {
  isSupported: boolean;
  contextHashes: {
    oscillator: string;
    triangle: string;
    sawtooth: string;
    square: string;
    compressor: string;
    dynamics: string;
    hybrid: string;
  };
  sampleRate: number;
  bufferSize: number;
  channelCount: number;
  compressionRatio: number;
  processingTimes: {
    oscillator: number;
    compressor: number;
    hybrid: number;
  };
  audioCapabilities: {
    maxChannels: number;
    sampleRates: number[];
    audioFormats: string[];
  };
  nodeSupport: Record<string, boolean>;
  entropy: number;
}
export interface StorageFingerprint {
  available: boolean;
  serviceWorker: {
    supported: boolean;
    scope: string;
    scriptURL: string;
    state: string;
    registration: boolean;
    updateViaCache: string;
    permissions: string;
  };
  cacheAPI: {
    supported: boolean;
    storageEstimate: {
      quota: number;
      usage: number;
      usageDetails: Record<string, number>;
    };
    cacheNames: string[];
    cacheOperations: {
      add: boolean;
      addAll: boolean;
      delete: boolean;
      keys: boolean;
      match: boolean;
      matchAll: boolean;
      put: boolean;
    };
    cacheBehavior: {
      requestMode: string;
      cacheMode: string;
      credentials: string;
      redirect: string;
    };
  };
  persistentStorage: {
    supported: boolean;
    persisted: boolean;
    requestPersistent: boolean;
    storageManager: boolean;
  };
  indexedDB: {
    supported: boolean;
    databases: string[];
    version: number;
    objectStores: string[];
    storageQuota: number;
    usageBytes: number;
  };
  webSQL: {
    supported: boolean;
    version: string;
    databases: string[];
    storageSize: number;
  };
  localStorage: {
    supported: boolean;
    quota: number;
    usage: number;
    testWrite: boolean;
    testRead: boolean;
    itemCount: number;
  };
  sessionStorage: {
    supported: boolean;
    quota: number;
    usage: number;
    testWrite: boolean;
    testRead: boolean;
    itemCount: number;
  };
  storageEvents: {
    supported: boolean;
    crossTab: boolean;
    persistence: boolean;
  };
  backgroundSync: {
    supported: boolean;
    registration: boolean;
    permissions: string;
  };
  pushAPI: {
    supported: boolean;
    permissions: string;
    subscription: boolean;
    applicationServerKey: boolean;
  };
  notifications: {
    supported: boolean;
    permissions: string;
    showNotification: boolean;
    actions: boolean;
    badge: boolean;
    icon: boolean;
    image: boolean;
    silent: boolean;
    tag: boolean;
    timestamp: boolean;
    vibrate: boolean;
  };
  broadcastChannel: {
    supported: boolean;
    postMessage: boolean;
    onMessage: boolean;
  };
  storageAnalysis: {
    totalQuota: number;
    totalUsage: number;
    storageBreakdown: Record<string, number>;
    compressionRatio: number;
    accessPatterns: string[];
  };
  fingerprints: {
    serviceWorkerHash: string;
    cacheHash: string;
    storageHash: string;
    behaviorHash: string;
  };
  confidenceLevel: number;
  collectionTime: number;
  errorCount: number;
}

export interface PluginFingerprint {
  available: boolean;
  plugins: {
    navigator: Array<{
      name: string;
      description: string;
      filename: string;
      version: string;
      mimeTypes: Array<{
        type: string;
        description: string;
        suffixes: string;
      }>;
    }>;
    count: number;
    enabledPlugins: string[];
    disabledPlugins: string[];
  };
  mimeTypes: {
    supported: Array<{
      type: string;
      description: string;
      suffixes: string;
      enabledPlugin: string;
    }>;
    count: number;
    categories: Record<string, number>;
  };
  extensions: {
    detected: string[];
    adBlocker: boolean;
    passwordManager: boolean;
    vpnExtension: boolean;
    developerExtensions: boolean;
    customExtensions: string[];
  };
  automation: {
    selenium: boolean;
    puppeteer: boolean;
    playwright: boolean;
    webDriver: boolean;
    headless: boolean;
    automationIndicators: string[];
  };
  developerTools: {
    open: boolean;
    orientation: string;
    detected: boolean;
    debuggerPresent: boolean;
    consoleModified: boolean;
  };
  modifications: {
    windowProperties: string[];
    prototypeChanges: string[];
    globalVariables: string[];
    functionOverrides: string[];
    nativeCodeModified: boolean;
  };
  security: {
    cspBlocked: boolean;
    mixedContent: boolean;
    secureContext: boolean;
    permissions: Record<string, string>;
  };
  browserFeatures: {
    webgl: boolean;
    webrtc: boolean;
    geolocation: boolean;
    notifications: boolean;
    camera: boolean;
    microphone: boolean;
    clipboard: boolean;
    fullscreen: boolean;
  };
  fingerprintResistance: {
    canvasBlocked: boolean;
    audioBlocked: boolean;
    webglBlocked: boolean;
    fontsBlocked: boolean;
    spoofingDetected: boolean;
    privacyMode: boolean;
  };
  fingerprints: {
    pluginHash: string;
    mimeTypeHash: string;
    extensionHash: string;
    modificationHash: string;
  };
  confidenceLevel: number;
  collectionTime: number;
  errorCount: number;
}
export interface FontFingerprint {
  isSupported: boolean;
  availableFonts: string[];
  systemFonts: string[];
  webFonts: string[];
  fontMeasurements: Record<
    string,
    {
      width: number;
      height: number;
      baseline: number;
    }
  >;
  unicodeSupport: Record<string, boolean>;
  fallbackDetection: Record<string, string>;
  fontStacks: Record<string, string[]>;
  renderingTests: Record<string, string>;
  totalFontsDetected: number;
  detectionTechniques: Record<string, number>;
  entropy: number;
}

export interface CSSFingerprint {
  isSupported: boolean;
  mediaQueries: Record<string, boolean>;
  cssFeatures: Record<string, boolean>;
  computedStyles: Record<string, string>;
  cssProperties: Record<string, boolean>;
  browserExtensions: Record<string, boolean>;
  cssUnits: Record<string, boolean>;
  colorSpaces: Record<string, boolean>;
  animations: Record<string, boolean>;
  layoutMethods: Record<string, boolean>;
  selectors: Record<string, boolean>;
  pseudoElements: Record<string, boolean>;
  pseudoClasses: Record<string, boolean>;
  atRules: Record<string, boolean>;
  cssValues: Record<string, string>;
  vendorPrefixes: string[];
  entropy: number;
}

export interface TimingFingerprint {
  isSupported: boolean;
  performanceTimings: {
    cryptoOperations: Record<string, number>;
    mathOperations: Record<string, number>;
    arrayOperations: Record<string, number>;
    stringOperations: Record<string, number>;
    regexOperations: Record<string, number>;
    sortingAlgorithms: Record<string, number>;
  };
  wasmTimings: {
    isSupported: boolean;
    compilationTime: number;
    instantiationTime: number;
    executionTimings: Record<string, number>;
    memoryOperations: Record<string, number>;
  };
  cpuBenchmarks: {
    singleThread: Record<string, number>;
    workerThread: Record<string, number>;
    concurrency: Record<string, number>;
  };
  memoryTimings: {
    allocation: Record<string, number>;
    access: Record<string, number>;
    garbage: Record<string, number>;
  };
  clockResolution: number;
  performanceApiPrecision: number;
  entropy: number;
}

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

export interface WebRTCFingerprint {
  isSupported: boolean;
  localIPs: string[];
  publicIP?: string;
  stunResponses: Record<string, any>;
  rtcCapabilities: {
    codecs: RTCCodecCapability[];
    headerExtensions: RTCHeaderExtensionCapability[];
    transports: string[];
  };
  iceGatheringTime: number;
  candidateTypes: string[];
  candidates: RTCIceCandidate[];
  natType?: string;
  networkInterfaces: NetworkInterface[];
  connectionTypes: string[];
  protocols: string[];
  stunServers: string[];
  turnServers: string[];
  iceCandidatePoolSize: number;
  bundlePolicy: string;
  rtcpMuxPolicy: string;
  iceTransportPolicy: string;
  sdpSemantics: string;
  fingerprint: string;
  entropy: number;
}

export interface NetworkInterface {
  type: string; // 'wifi', 'ethernet', 'cellular', 'vpn', 'unknown'
  ip: string;
  family: "IPv4" | "IPv6";
  internal: boolean;
  mac?: string;
}

export interface RTCCodecCapability {
  mimeType: string;
  clockRate: number;
  channels?: number;
  sdpFmtpLine?: string;
}

export interface RTCHeaderExtensionCapability {
  uri: string;
  direction?: string;
}

export interface BatteryFingerprint {
  available: boolean;
  level?: number;
  charging?: boolean;
  chargingTime?: number;
  dischargingTime?: number;

  // Power characteristics
  powerProfile: {
    dischargeRate?: number;
    chargeRate?: number;
    voltageStability?: number;
    temperaturePattern?: string;
  };

  // Hardware characteristics
  hardwareSignature: {
    capacityEstimate?: number;
    ageIndicator?: number;
    cycleCount?: number;
    healthStatus?: string;
  };

  // Timing patterns
  timingPatterns: {
    updateFrequency: number;
    precisionLevel: number;
    eventIntervals: number[];
    jitterPattern: string;
  };

  // Privacy and security
  privacyMasking: {
    levelMasked: boolean;
    timingMasked: boolean;
    artificialValues: boolean;
  };

  // Unique identifiers
  batteryHash: string;
  stabilityScore: number;
  confidenceLevel: number;

  // Collection metadata
  collectionTime: number;
  samplingDuration: number;
  errorCount: number;
}

export interface MediaDeviceInfo {
  deviceId: string;
  kind: string;
  label: string;
  groupId: string;
}

export interface MediaCapabilities {
  resolutions: {
    width: number;
    height: number;
    frameRate?: number;
  }[];
  audioFormats: string[];
  videoCodecs: string[];
  constraints: {
    width?: { min?: number; max?: number; ideal?: number };
    height?: { min?: number; max?: number; ideal?: number };
    frameRate?: { min?: number; max?: number; ideal?: number };
    sampleRate?: { min?: number; max?: number; ideal?: number };
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  };
}

export interface MediaDeviceFingerprint {
  available: boolean;

  // Device enumeration
  devices: {
    videoInputs: MediaDeviceInfo[];
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    totalCount: number;
    uniqueDevices: number;
  };

  // Capabilities and constraints
  capabilities: {
    video: MediaCapabilities;
    audio: MediaCapabilities;
    supportedConstraints: string[];
  };

  // Permission states
  permissions: {
    camera: string;
    microphone: string;
    speaker: string;
    permissionAPI: boolean;
  };

  // Hardware signatures
  hardwareSignature: {
    deviceFingerprint: string;
    vendorPatterns: string[];
    modelSignatures: string[];
    driverVersions: string[];
  };

  // Stream characteristics
  streamAnalysis: {
    defaultResolution: { width: number; height: number };
    supportedFrameRates: number[];
    audioChannels: number[];
    bitRateProfiles: string[];
  };

  // Privacy and security
  privacyIndicators: {
    labelsBlocked: boolean;
    deviceIdsRandomized: boolean;
    permissionDenied: boolean;
    virtualDevicesDetected: boolean;
  };

  // Unique identifiers
  mediaDeviceHash: string;
  stabilityScore: number;
  confidenceLevel: number;

  // Collection metadata
  collectionTime: number;
  enumerationDuration: number;
  errorCount: number;
}

export interface SensorReading {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface SensorCalibration {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

export interface SensorCharacteristics {
  available: boolean;
  frequency?: number;
  precision?: number;
  range?: number;
  resolution?: number;
  noiseLevel?: number;
  driftRate?: number;
  calibration?: SensorCalibration;
  readings: SensorReading[];
  patterns: {
    staticNoise: string;
    dynamicResponse: string;
    temperatureDrift: string;
  };
}

export interface DeviceSensorFingerprint {
  available: boolean;

  // Individual sensor characteristics
  accelerometer: SensorCharacteristics;
  gyroscope: SensorCharacteristics;
  magnetometer: SensorCharacteristics;
  ambientLight: SensorCharacteristics;
  proximity: SensorCharacteristics;
  orientation: SensorCharacteristics;
  motion: SensorCharacteristics;

  // Device motion and orientation
  deviceMotion: {
    supported: boolean;
    interval: number;
    accelerationIncludingGravity: boolean;
    rotationRate: boolean;
  };

  deviceOrientation: {
    supported: boolean;
    absolute: boolean;
    compassHeading: boolean;
  };

  // Hardware signatures
  hardwareSignature: {
    vendorFingerprint: string;
    modelSignature: string;
    calibrationSignature: string;
    noiseProfile: string;
  };

  // Permission and privacy
  permissions: {
    accelerometer: string;
    gyroscope: string;
    magnetometer: string;
    permissionAPI: boolean;
  };

  // Cross-sensor correlation
  correlation: {
    accelerometerGyroscope: number;
    orientationMotion: number;
    stabilityScore: number;
  };

  // Privacy indicators
  privacyIndicators: {
    sensorsBlocked: boolean;
    reducedPrecision: boolean;
    artificialReadings: boolean;
    spoofingDetected: boolean;
  };

  // Sensor capabilities
  capabilities: {
    maxFrequency: number;
    bufferSize: number;
    sensorTypes: string[];
    permissions: string[];
  };

  // Sensor patterns and analysis
  patterns: {
    motionSignatures: string[];
    orientationPatterns: string[];
    usageCharacteristics: string[];
  };

  analysis: {
    stabilityScores: Record<string, number>;
    entropyMeasures: Record<string, number>;
    correlationMatrix: Record<string, Record<string, number>>;
  };

  // Multiple fingerprint hashes
  fingerprints: {
    sensorHash: string;
    patternHash: string;
    capabilityHash: string;
  };

  // Unique identifiers
  sensorHash: string;
  hardwareHash: string;
  confidenceLevel: number;

  // Collection metadata
  collectionTime: number;
  samplingDuration: number;
  errorCount: number;
}

export interface NetworkEndpoint {
  url: string;
  location: string;
  provider: string;
  rtt: number;
  status: number;
  timestamp: number;
}

export interface NetworkAnalysis {
  avgRTT: number;
  minRTT: number;
  maxRTT: number;
  jitter: number;
  packetLoss: number;
  stability: number;
  latencyVariation: number;
  throughputEstimate: number;
  jitterMeasurement: number;
}

export interface ConnectionInfo {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  downlinkMax?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface NetworkFingerprint {
  available: boolean;

  // RTT measurements to various endpoints
  endpoints: NetworkEndpoint[];

  // Network analysis
  analysis: NetworkAnalysis;

  // Connection information
  connection: ConnectionInfo;

  // Timing patterns
  timingPatterns: {
    dnsLookup: number[];
    tcpConnect: number[];
    tlsHandshake: number[];
    requestResponse: number[];
    totalTime: number[];
  };

  // Bandwidth estimation
  bandwidth: {
    estimated: number;
    downloadSpeed: number;
    uploadSpeed: number;
    testDuration: number;
  };

  // Geographic inference
  geographic: {
    estimatedLocation: string;
    timezone: string;
    proximityToServers: Record<string, number>;
  };

  // Network characteristics
  characteristics: {
    mtu: number;
    ipVersion: string;
    dnsProvider: string;
    proxy: boolean;
    vpn: boolean;
    tor: boolean;
  };

  // Privacy indicators
  privacyIndicators: {
    maskedIP: boolean;
    reducedTiming: boolean;
    artificialDelays: boolean;
    tunneled: boolean;
  };

  // Unique identifiers
  networkHash: string;
  timingHash: string;
  confidenceLevel: number;

  // Collection metadata
  collectionTime: number;
  testDuration: number;
  errorCount: number;
}

export interface AdvancedFingerprintData {
  webrtc: WebRTCFingerprint;
  battery: BatteryFingerprint;
  mediaDevices: MediaDeviceFingerprint;
  sensors: DeviceSensorFingerprint;
  network: NetworkFingerprint;
  webassembly: WebAssemblyFingerprint;
  storage: StorageFingerprint;
  plugins: PluginFingerprint;
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

export interface FingerprintCollectionRequest {
  coreFingerprint: CoreFingerprintData;
  advancedFingerprint: AdvancedFingerprintData;
  behavioralData?: BehavioralData;
  sessionId?: string;
  userId?: string; // Add userId to request type
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

// Fingerprint collection configuration
export interface FingerprintConfig {
  // API configuration
  apiEndpoint?: string;
  timeout?: number;
  retries?: number;

  // Collection preferences
  collectAdvanced?: boolean;
  collectBehavioral?: boolean;
  stealthMode?: boolean;

  // Feature toggles
  features: {
    canvas?: boolean;
    webgl?: boolean;
    audio?: boolean;
    fonts?: boolean;
    css?: boolean;
    timing?: boolean;
    webrtc?: boolean;
    battery?: boolean;
    mediaDevices?: boolean;
    sensors?: boolean;
    network?: boolean;
    webassembly?: boolean;
    storage?: boolean;
    plugins?: boolean;
    behavioral?: boolean;
  };

  // Privacy settings
  privacy: {
    consentRequired: boolean;
    dataProcessingPurpose: string[];
    respectDoNotTrack: boolean;
    anonymizeIP: boolean;
  };

  // Performance settings
  performance: {
    maxCollectionTime: number;
    enableCaching: boolean;
    backgroundCollection: boolean;
  };
}

// Events
export interface FingerprintEvent {
  type: "start" | "progress" | "complete" | "error";
  data?: any;
  timestamp: number;
}

export type FingerprintEventHandler = (event: FingerprintEvent) => void;

// Error types
export class FingerprintError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = "FingerprintError";
    this.code = code;
    this.details = details;
  }
}

export interface WebAssemblyFingerprint {
  available: boolean;
  capabilities: {
    basicWasm: boolean;
    simdSupported: boolean;
    threadsSupported: boolean;
    bulkMemorySupported: boolean;
    multiValueSupported: boolean;
    referenceTypesSupported: boolean;
    tailCallSupported: boolean;
    exceptionHandlingSupported: boolean;
    atomicsSupported: boolean;
    bigIntSupported: boolean;
  };
  instructionSets: {
    basic: boolean;
    simd128: boolean;
    atomic: boolean;
    bulk: boolean;
    reference: boolean;
    multiValue: boolean;
    tailCall: boolean;
    exceptions: boolean;
  };
  performance: {
    compilationTime: number;
    instantiationTime: number;
    executionTime: number;
    memoryOperations: number;
    mathOperations: number;
    cryptoOperations: number;
  };
  limits: {
    maxMemoryPages: number;
    maxTableSize: number;
    maxFunctionParams: number;
    maxFunctionLocals: number;
    maxModuleSize: number;
  };
  hardware: {
    cpuArchitecture: string;
    instructionSupport: Record<string, boolean>;
    performanceProfile: string;
    parallelizationSupport: boolean;
  };
  modules: {
    testModules: Array<{
      name: string;
      compiled: boolean;
      size: number;
      compileTime: number;
      features: string[];
    }>;
    supportedFormats: string[];
    optimizationLevel: string;
  };
  security: {
    sandboxingEffective: boolean;
    memoryProtection: boolean;
    stackProtection: boolean;
    codeIntegrity: boolean;
  };
  environment: {
    engineVersion: string;
    optimizationFlags: string[];
    debugSupport: boolean;
    profilingSupport: boolean;
  };
  fingerprints: {
    instructionHash: string;
    performanceHash: string;
    capabilityHash: string;
    moduleHash: string;
  };
  confidenceLevel: number;
  collectionTime: number;
  errorCount: number;
}

export interface MouseEvent {
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
}

export interface KeyboardEvent {
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
}

export interface TouchEvent {
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
}

export interface ScrollPattern {
  direction: "up" | "down" | "left" | "right";
  velocity: number;
  acceleration: number;
  duration: number;
  distance: number;
  smoothness: number;
  pauseCount: number;
  averagePauseTime: number;
}

export interface ClickPattern {
  clickRate: number;
  doubleClickTime: number;
  accuracy: number;
  pressure: number;
  dwellTime: number;
  targetSize: number;
  distanceFromCenter: number;
}

export interface MouseMovementPattern {
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
}

export interface TypingPattern {
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
}

export interface BehavioralFingerprint {
  available: boolean;

  // Mouse tracking
  mouseEvents: MouseEvent[];
  mousePatterns: {
    movementPattern: MouseMovementPattern;
    clickPattern: ClickPattern;
    scrollPattern: ScrollPattern;
    habitualPaths: Array<{
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      frequency: number;
      avgTime: number;
    }>;
  };

  // Keyboard tracking
  keyboardEvents: KeyboardEvent[];
  typingPatterns: {
    overall: TypingPattern;
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

  // Touch patterns (mobile)
  touchEvents: TouchEvent[];
  touchPatterns: {
    swipeVelocity: number;
    tapPressure: number;
    tapDuration: number;
    pinchGestures: number;
    rotationGestures: number;
    multiTouchFrequency: number;
    fingerSpacing: number;
  };

  // Interaction patterns
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

  // Behavioral signatures
  signatures: {
    mouseSignature: string;
    keyboardSignature: string;
    touchSignature: string;
    navigationSignature: string;
    timingSignature: string;
  };

  // Human verification metrics
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

  // Collection metadata
  collectionMetadata: {
    startTime: number;
    endTime: number;
    totalEvents: number;
    samplingRate: number;
    eventTypes: string[];
    dataQuality: number;
    privacyLevel: "minimal" | "standard" | "comprehensive";
  };

  // Statistical analysis
  statistics: {
    entropy: number;
    variance: number;
    standardDeviation: number;
    correlationCoefficients: Record<string, number>;
    anomalyScore: number;
    consistencyScore: number;
    uniquenessScore: number;
  };

  // Privacy protection
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
