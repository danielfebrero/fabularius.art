import {
  CoreFingerprintData,
  AdvancedFingerprintData,
  BehavioralData,
  FingerprintCollectionRequest,
  FingerprintCollectionResponse,
  FingerprintConfig,
  FingerprintEvent,
  FingerprintEventHandler,
  FingerprintError,
  CanvasFingerprint,
  WebGLFingerprint,
  AudioFingerprint,
  FontFingerprint,
  CSSFingerprint,
  TimingFingerprint,
  WebRTCFingerprint,
  BatteryFingerprint,
  MediaDeviceFingerprint,
  DeviceSensorFingerprint,
  NetworkFingerprint,
  WebAssemblyFingerprint,
  StorageFingerprint,
  PluginFingerprint,
} from "@/types/fingerprint";
import { collectBehavioralFingerprint } from "./modules/behavioral";
import { API_URL } from "@/utils/config";
// Default configuration
const DEFAULT_CONFIG: FingerprintConfig = {
  apiEndpoint: API_URL + "/fingerprint/collect",
  timeout: 30000,
  retries: 3,
  collectAdvanced: true,
  collectBehavioral: false,
  stealthMode: true,
  features: {
    canvas: true,
    webgl: true,
    audio: true,
    fonts: true,
    css: true,
    timing: true,
    webrtc: true,
    battery: true,
    mediaDevices: true,
    sensors: true,
    network: true,
    webassembly: true,
    storage: true,
    plugins: true,
    behavioral: false,
  },
  privacy: {
    consentRequired: false,
    dataProcessingPurpose: ["analytics", "security"],
    respectDoNotTrack: false,
    anonymizeIP: false,
  },
  performance: {
    maxCollectionTime: 5000,
    enableCaching: true,
    backgroundCollection: true,
  },
};

/**
 * Advanced fingerprint collector with stealth techniques and anti-detection measures
 */
export class FingerprintCollector {
  private config: FingerprintConfig;
  private eventHandlers: Map<string, FingerprintEventHandler[]> = new Map();
  private cache: Map<string, any> = new Map();
  private isCollecting = false;
  private abortController: AbortController | null = null;

  constructor(config: Partial<FingerprintConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupStealthMeasures();
  }

  /**
   * Setup stealth measures to avoid detection
   */
  private setupStealthMeasures(): void {
    if (!this.config.stealthMode) return;

    // Randomize execution timing to avoid patterns
    this.randomDelay = this.randomDelay.bind(this);

    // Override native functions with stealth versions
    this.setupStealthCanvas();
    this.setupStealthWebGL();
    this.setupStealthTiming();
  }

  /**
   * Setup stealth canvas fingerprinting to avoid detection
   */
  private setupStealthCanvas(): void {
    // Store original methods to avoid detection by anti-fingerprinting scripts
    if (typeof window !== "undefined" && window.HTMLCanvasElement) {
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      const originalGetContext = HTMLCanvasElement.prototype.getContext;

      // We'll use these stored methods later for actual fingerprinting
      (window as any).__fpOriginalToDataURL = originalToDataURL;
      (window as any).__fpOriginalGetContext = originalGetContext;
    }
  }

  /**
   * Setup stealth WebGL fingerprinting
   */
  private setupStealthWebGL(): void {
    if (typeof window !== "undefined" && window.WebGLRenderingContext) {
      const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
      (window as any).__fpOriginalGetParameter = originalGetParameter;
    }
  }

  /**
   * Setup stealth timing to avoid detection by timing analysis
   */
  private setupStealthTiming(): void {
    // Randomize timing patterns to avoid detection
    this.originalPerformanceNow = performance.now.bind(performance);
  }

  private originalPerformanceNow: () => number =
    performance.now.bind(performance);

  /**
   * Random delay to avoid timing pattern detection
   */
  private async randomDelay(min: number = 1, max: number = 10): Promise<void> {
    if (!this.config.stealthMode) return;
    const delay = Math.random() * (max - min) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Check if we should respect Do Not Track
   */
  private shouldRespectDoNotTrack(): boolean {
    if (!this.config.privacy.respectDoNotTrack) return false;

    return (
      navigator.doNotTrack === "1" ||
      (window as any).doNotTrack === "1" ||
      (navigator as any).msDoNotTrack === "1"
    );
  }

  /**
   * Check if consent is given for fingerprinting
   */
  private hasValidConsent(): boolean {
    if (!this.config.privacy.consentRequired) return true;

    // Check for consent cookie/localStorage
    try {
      const consent = localStorage.getItem("fingerprint-consent");
      return consent === "true";
    } catch {
      return false;
    }
  }

  /**
   * Add event listener
   */
  public on(event: string, handler: FingerprintEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event listener
   */
  public off(event: string, handler: FingerprintEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: FingerprintEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.warn("Fingerprint event handler error:", error);
        }
      });
    }
  }

  /**
   * Main collection method
   */
  public async collect(): Promise<FingerprintCollectionResponse> {
    if (this.isCollecting) {
      throw new FingerprintError(
        "Collection already in progress",
        "COLLECTION_IN_PROGRESS"
      );
    }

    // Check privacy constraints
    if (this.shouldRespectDoNotTrack()) {
      throw new FingerprintError("Do Not Track is enabled", "DNT_ENABLED");
    }

    if (!this.hasValidConsent()) {
      throw new FingerprintError("User consent required", "CONSENT_REQUIRED");
    }

    this.isCollecting = true;
    this.abortController = new AbortController();

    try {
      this.emit({
        type: "start",
        timestamp: Date.now(),
      });

      const startTime = this.originalPerformanceNow();

      // Collect core fingerprint data
      const coreFingerprint = await this.collectCoreFingerprint();

      this.emit({
        type: "progress",
        data: { step: "core", progress: 0.4 },
        timestamp: Date.now(),
      });

      // Collect advanced fingerprint data if enabled
      let advancedFingerprint: AdvancedFingerprintData | undefined;
      if (this.config.collectAdvanced) {
        advancedFingerprint = await this.collectAdvancedFingerprint();
      }

      this.emit({
        type: "progress",
        data: { step: "advanced", progress: 0.7 },
        timestamp: Date.now(),
      });

      // Collect behavioral data if enabled
      let behavioralData: BehavioralData | undefined;
      if (this.config.collectBehavioral) {
        behavioralData = await this.collectBehavioralData();
      }

      this.emit({
        type: "progress",
        data: { step: "behavioral", progress: 0.9 },
        timestamp: Date.now(),
      });

      // Prepare request payload
      const request: FingerprintCollectionRequest = {
        coreFingerprint,
        advancedFingerprint: advancedFingerprint!,
        behavioralData,
        sessionId: this.generateSessionId(),
        pageUrl: window.location.href,
        referrer: document.referrer,
        consentGiven: true,
        dataProcessingPurpose: this.config.privacy.dataProcessingPurpose,
      };

      // Send to backend
      const response = await this.sendToBackend(request);

      const endTime = this.originalPerformanceNow();

      this.emit({
        type: "complete",
        data: {
          response,
          collectionTime: endTime - startTime,
        },
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      this.emit({
        type: "error",
        data: error,
        timestamp: Date.now(),
      });
      throw error;
    } finally {
      this.isCollecting = false;
      this.abortController = null;
    }
  }

  /**
   * Collect core fingerprint data
   */
  private async collectCoreFingerprint(): Promise<CoreFingerprintData> {
    const results: Partial<CoreFingerprintData> = {};

    // Canvas fingerprinting
    if (this.config.features.canvas) {
      // await this.randomDelay();
      const canvasData = await this.collectCanvasFingerprint();
      results.canvas =
        canvasData.basic || canvasData.advanced || "canvas_fallback";
    }

    // WebGL fingerprinting
    if (this.config.features.webgl) {
      // await this.randomDelay();
      const webglData = await this.collectWebGLFingerprint();
      results.webgl = {
        vendor: webglData.vendor || "unknown",
        renderer: webglData.renderer || "unknown",
        unmaskedVendor: webglData.unmaskedVendor,
        unmaskedRenderer: webglData.unmaskedRenderer,
        extensions: webglData.extensions || [],
        parameters: webglData.parameters || {},
        renderHash: webglData.renderHashes?.basic || "webgl_fallback",
      };
    }

    // Audio fingerprinting
    if (this.config.features.audio) {
      // await this.randomDelay();
      const audioData = await this.collectAudioFingerprint();
      results.audio = {
        contextHash: audioData.contextHashes?.hybrid || "audio_fallback",
        compressionRatio: audioData.compressionRatio || 0,
        oscillatorHash:
          audioData.contextHashes?.oscillator || "oscillator_fallback",
        dynamicsHash: audioData.contextHashes?.dynamics || "dynamics_fallback",
      };
    }

    // Font fingerprinting
    if (this.config.features.fonts) {
      // await this.randomDelay();
      const fontData = await this.collectFontFingerprint();
      results.fonts = {
        available: Object.fromEntries(
          Object.entries(fontData.fontMeasurements).map(
            ([font, measurement]) => [
              font,
              typeof measurement === "object" && measurement !== null
                ? `${measurement.width || 0}x${measurement.height || 0}`
                : String(measurement),
            ]
          )
        ),
        systemFonts: fontData.systemFonts,
        webFonts: fontData.webFonts,
      };
    }

    // CSS fingerprinting
    if (this.config.features.css) {
      // await this.randomDelay();
      const cssData = await this.collectCSSFingerprint();
      results.css = {
        mediaQueries: cssData.mediaQueries,
        computedStyles: cssData.computedStyles,
        supportedFeatures: Object.keys(cssData.cssFeatures).filter(
          (key) => cssData.cssFeatures[key]
        ),
      };
    }

    // Timing fingerprinting
    if (this.config.features.timing) {
      // await this.randomDelay();
      const timingData = await this.collectTimingFingerprint();
      results.timing = {
        cryptoTiming:
          timingData.performanceTimings?.cryptoOperations?.sha256 || 0,
        regexTiming:
          timingData.performanceTimings?.regexOperations?.complexPattern || 0,
        sortTiming:
          timingData.performanceTimings?.sortingAlgorithms?.quickSort || 0,
        wasmTiming:
          timingData.wasmTimings?.executionTimings?.fibonacci || undefined,
      };
    }

    return results as CoreFingerprintData;
  }

  /**
   * Collect advanced fingerprint data
   */
  private async collectAdvancedFingerprint(): Promise<AdvancedFingerprintData> {
    // Create fallback data that matches AdvancedFingerprintData interface
    const fallbackData: AdvancedFingerprintData = {
      webrtc: {
        isSupported: false,
        localIPs: [],
        stunResponses: {},
        rtcCapabilities: { codecs: [], headerExtensions: [], transports: [] },
        iceGatheringTime: 0,
        candidateTypes: [],
        candidates: [],
        networkInterfaces: [],
        connectionTypes: [],
        protocols: [],
        stunServers: [],
        turnServers: [],
        iceCandidatePoolSize: 0,
        bundlePolicy: "balanced",
        rtcpMuxPolicy: "require",
        iceTransportPolicy: "all",
        sdpSemantics: "unified-plan",
        fingerprint: "webrtc_fallback",
        entropy: 0,
      },
      battery: {
        available: false,
        powerProfile: {},
        hardwareSignature: {},
        timingPatterns: {
          updateFrequency: 0,
          precisionLevel: 0,
          eventIntervals: [],
          jitterPattern: "",
        },
        privacyMasking: {
          levelMasked: false,
          timingMasked: false,
          artificialValues: false,
        },
        batteryHash: "battery_fallback",
        stabilityScore: 0,
        confidenceLevel: 0,
        collectionTime: 0,
        samplingDuration: 0,
        errorCount: 0,
      },
      mediaDevices: {
        available: false,
        devices: {
          audioInputs: [],
          audioOutputs: [],
          videoInputs: [],
          totalCount: 0,
          uniqueDevices: 0,
        },
        capabilities: {
          video: {
            resolutions: [],
            audioFormats: [],
            videoCodecs: [],
            constraints: {},
          },
          audio: {
            resolutions: [],
            audioFormats: [],
            videoCodecs: [],
            constraints: {},
          },
          supportedConstraints: [],
        },
        permissions: {
          camera: "denied",
          microphone: "denied",
          speaker: "denied",
          permissionAPI: false,
        },
        hardwareSignature: {
          deviceFingerprint: "media_fallback",
          vendorPatterns: [],
          modelSignatures: [],
          driverVersions: [],
        },
        streamAnalysis: {
          defaultResolution: { width: 0, height: 0 },
          supportedFrameRates: [],
          audioChannels: [],
          bitRateProfiles: [],
        },
        privacyIndicators: {
          labelsBlocked: false,
          deviceIdsRandomized: false,
          permissionDenied: true,
          virtualDevicesDetected: false,
        },
        mediaDeviceHash: "media_fallback",
        stabilityScore: 0,
        confidenceLevel: 0,
        collectionTime: 0,
        enumerationDuration: 0,
        errorCount: 0,
      },
      sensors: {
        available: false,
        accelerometer: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        gyroscope: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        magnetometer: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        ambientLight: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        proximity: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        orientation: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        motion: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        deviceMotion: {
          supported: false,
          interval: 0,
          accelerationIncludingGravity: false,
          rotationRate: false,
        },
        deviceOrientation: {
          supported: false,
          absolute: false,
          compassHeading: false,
        },
        hardwareSignature: {
          vendorFingerprint: "",
          modelSignature: "",
          calibrationSignature: "",
          noiseProfile: "",
        },
        permissions: {
          accelerometer: "denied",
          gyroscope: "denied",
          magnetometer: "denied",
          permissionAPI: false,
        },
        correlation: {
          accelerometerGyroscope: 0,
          orientationMotion: 0,
          stabilityScore: 0,
        },
        privacyIndicators: {
          sensorsBlocked: false,
          reducedPrecision: false,
          artificialReadings: false,
          spoofingDetected: false,
        },
        capabilities: {
          maxFrequency: 0,
          bufferSize: 0,
          sensorTypes: [],
          permissions: [],
        },
        patterns: {
          motionSignatures: [],
          orientationPatterns: [],
          usageCharacteristics: [],
        },
        analysis: {
          stabilityScores: {},
          entropyMeasures: {},
          correlationMatrix: {},
        },
        fingerprints: {
          sensorHash: "sensor_fallback",
          patternHash: "sensor_fallback",
          capabilityHash: "sensor_fallback",
        },
        sensorHash: "sensor_fallback",
        hardwareHash: "sensor_fallback",
        samplingDuration: 0,
        confidenceLevel: 0,
        collectionTime: 0,
        errorCount: 0,
      },
      network: {
        available: false,
        endpoints: [],
        analysis: {
          avgRTT: 0,
          minRTT: 0,
          maxRTT: 0,
          jitter: 0,
          packetLoss: 0,
          stability: 0,
          latencyVariation: 0,
          throughputEstimate: 0,
          jitterMeasurement: 0,
        },
        connection: {},
        timingPatterns: {
          dnsLookup: [],
          tcpConnect: [],
          tlsHandshake: [],
          requestResponse: [],
          totalTime: [],
        },
        bandwidth: {
          estimated: 0,
          downloadSpeed: 0,
          uploadSpeed: 0,
          testDuration: 0,
        },
        geographic: {
          estimatedLocation: "unknown",
          timezone: "unknown",
          proximityToServers: {},
        },
        characteristics: {
          mtu: 0,
          ipVersion: "unknown",
          dnsProvider: "unknown",
          proxy: false,
          vpn: false,
          tor: false,
        },
        privacyIndicators: {
          maskedIP: false,
          reducedTiming: false,
          artificialDelays: false,
          tunneled: false,
        },
        networkHash: "network_fallback",
        timingHash: "timing_fallback",
        confidenceLevel: 0,
        collectionTime: 0,
        testDuration: 0,
        errorCount: 0,
      },
      webassembly: {
        available: false,
        capabilities: {
          basicWasm: false,
          simdSupported: false,
          threadsSupported: false,
          bulkMemorySupported: false,
          multiValueSupported: false,
          referenceTypesSupported: false,
          tailCallSupported: false,
          exceptionHandlingSupported: false,
          atomicsSupported: false,
          bigIntSupported: false,
        },
        instructionSets: {
          basic: false,
          simd128: false,
          atomic: false,
          bulk: false,
          reference: false,
          multiValue: false,
          tailCall: false,
          exceptions: false,
        },
        performance: {
          compilationTime: 0,
          instantiationTime: 0,
          executionTime: 0,
          memoryOperations: 0,
          mathOperations: 0,
          cryptoOperations: 0,
        },
        limits: {
          maxMemoryPages: 0,
          maxTableSize: 0,
          maxFunctionParams: 0,
          maxFunctionLocals: 0,
          maxModuleSize: 0,
        },
        hardware: {
          cpuArchitecture: "unknown",
          instructionSupport: {},
          performanceProfile: "unknown",
          parallelizationSupport: false,
        },
        modules: {
          testModules: [],
          supportedFormats: [],
          optimizationLevel: "unknown",
        },
        security: {
          sandboxingEffective: false,
          memoryProtection: false,
          stackProtection: false,
          codeIntegrity: false,
        },
        environment: {
          engineVersion: "unknown",
          optimizationFlags: [],
          debugSupport: false,
          profilingSupport: false,
        },
        fingerprints: {
          instructionHash: "wasm_fallback",
          performanceHash: "wasm_fallback",
          capabilityHash: "wasm_fallback",
          moduleHash: "wasm_fallback",
        },
        confidenceLevel: 0,
        collectionTime: 0,
        errorCount: 0,
      },
      storage: {
        available: false,
        serviceWorker: {
          supported: false,
          scope: "",
          scriptURL: "",
          state: "redundant",
          registration: false,
          updateViaCache: "none",
          permissions: "denied",
        },
        cacheAPI: {
          supported: false,
          storageEstimate: {
            quota: 0,
            usage: 0,
            usageDetails: {},
          },
          cacheNames: [],
          cacheOperations: {
            add: false,
            addAll: false,
            delete: false,
            keys: false,
            match: false,
            matchAll: false,
            put: false,
          },
          cacheBehavior: {
            requestMode: "same-origin",
            cacheMode: "default",
            credentials: "same-origin",
            redirect: "follow",
          },
        },
        persistentStorage: {
          supported: false,
          persisted: false,
          requestPersistent: false,
          storageManager: false,
        },
        indexedDB: {
          supported: false,
          databases: [],
          version: 0,
          objectStores: [],
          storageQuota: 0,
          usageBytes: 0,
        },
        webSQL: {
          supported: false,
          version: "",
          databases: [],
          storageSize: 0,
        },
        localStorage: {
          supported: false,
          quota: 0,
          usage: 0,
          testWrite: false,
          testRead: false,
          itemCount: 0,
        },
        sessionStorage: {
          supported: false,
          quota: 0,
          usage: 0,
          testWrite: false,
          testRead: false,
          itemCount: 0,
        },
        storageEvents: {
          supported: false,
          crossTab: false,
          persistence: false,
        },
        backgroundSync: {
          supported: false,
          registration: false,
          permissions: "denied",
        },
        pushAPI: {
          supported: false,
          permissions: "denied",
          subscription: false,
          applicationServerKey: false,
        },
        notifications: {
          supported: false,
          permissions: "denied",
          showNotification: false,
          actions: false,
          badge: false,
          icon: false,
          image: false,
          silent: false,
          tag: false,
          timestamp: false,
          vibrate: false,
        },
        broadcastChannel: {
          supported: false,
          postMessage: false,
          onMessage: false,
        },
        storageAnalysis: {
          totalQuota: 0,
          totalUsage: 0,
          storageBreakdown: {},
          compressionRatio: 0,
          accessPatterns: [],
        },
        fingerprints: {
          serviceWorkerHash: "storage_fallback",
          cacheHash: "storage_fallback",
          storageHash: "storage_fallback",
          behaviorHash: "storage_fallback",
        },
        confidenceLevel: 0,
        collectionTime: 0,
        errorCount: 0,
      },
      plugins: {
        available: false,
        plugins: {
          navigator: [],
          count: 0,
          enabledPlugins: [],
          disabledPlugins: [],
        },
        mimeTypes: {
          supported: [],
          count: 0,
          categories: {},
        },
        extensions: {
          detected: [],
          adBlocker: false,
          passwordManager: false,
          vpnExtension: false,
          developerExtensions: false,
          customExtensions: [],
        },
        automation: {
          selenium: false,
          puppeteer: false,
          playwright: false,
          webDriver: false,
          headless: false,
          automationIndicators: [],
        },
        developerTools: {
          open: false,
          orientation: "unknown",
          detected: false,
          debuggerPresent: false,
          consoleModified: false,
        },
        modifications: {
          windowProperties: [],
          prototypeChanges: [],
          globalVariables: [],
          functionOverrides: [],
          nativeCodeModified: false,
        },
        security: {
          cspBlocked: false,
          mixedContent: false,
          secureContext: false,
          permissions: {},
        },
        browserFeatures: {
          webgl: false,
          webrtc: false,
          geolocation: false,
          notifications: false,
          camera: false,
          microphone: false,
          clipboard: false,
          fullscreen: false,
        },
        fingerprintResistance: {
          canvasBlocked: false,
          audioBlocked: false,
          webglBlocked: false,
          fontsBlocked: false,
          spoofingDetected: false,
          privacyMode: false,
        },
        fingerprints: {
          pluginHash: "plugin_fallback",
          mimeTypeHash: "plugin_fallback",
          extensionHash: "plugin_fallback",
          modificationHash: "plugin_fallback",
        },
        confidenceLevel: 0,
        collectionTime: 0,
        errorCount: 0,
      },
    };

    const results: AdvancedFingerprintData = { ...fallbackData };

    try {
      // WebRTC fingerprinting
      if (this.config.features.webrtc) {
        await this.randomDelay();
        try {
          const { collectWebRTCFingerprint } = await import("./modules/webrtc");
          results.webrtc = await collectWebRTCFingerprint();
        } catch (error) {
          console.warn("WebRTC fingerprint collection failed:", error);
          // results.webrtc already has fallback value
        }
      }

      // Battery fingerprinting
      if (this.config.features.battery) {
        await this.randomDelay();
        try {
          const { collectBatteryFingerprint } = await import(
            "./modules/battery"
          );
          results.battery = await collectBatteryFingerprint();
        } catch (error) {
          console.warn("Battery fingerprint collection failed:", error);
          // results.battery already has fallback value
        }
      }

      // Media devices fingerprinting
      if (this.config.features.mediaDevices) {
        await this.randomDelay();
        try {
          const { collectMediaDeviceFingerprint } = await import(
            "./modules/media-devices"
          );
          results.mediaDevices = await collectMediaDeviceFingerprint();
        } catch (error) {
          console.warn("Media devices fingerprint collection failed:", error);
          // results.mediaDevices already has fallback value
        }
      }

      // Sensor fingerprinting
      if (this.config.features.sensors) {
        await this.randomDelay();
        try {
          const { collectSensorFingerprint } = await import(
            "./modules/sensors"
          );
          results.sensors = await collectSensorFingerprint();
        } catch (error) {
          console.warn("Sensor fingerprint collection failed:", error);
          // results.sensors already has fallback value
        }
      }

      // Network fingerprinting
      if (this.config.features.network) {
        await this.randomDelay();
        try {
          const { collectNetworkFingerprint } = await import(
            "./modules/network"
          );
          results.network = await collectNetworkFingerprint();
        } catch (error) {
          console.warn("Network fingerprint collection failed:", error);
          // results.network already has fallback value
        }
      }

      // WebAssembly fingerprinting
      if (this.config.features.webassembly) {
        await this.randomDelay();
        try {
          const { collectWebAssemblyFingerprint } = await import(
            "./modules/webassembly"
          );
          results.webassembly = await collectWebAssemblyFingerprint();
        } catch (error) {
          console.warn("WebAssembly fingerprint collection failed:", error);
          // results.webassembly already has fallback value
        }
      }

      // Storage fingerprinting
      if (this.config.features.storage) {
        await this.randomDelay();
        try {
          const { collectStorageFingerprint } = await import(
            "./modules/storage"
          );
          const storageData = await collectStorageFingerprint();
          results.storage = storageData;
        } catch (error) {
          console.warn("Storage fingerprint collection failed:", error);
          // results.storage already has fallback value
        }
      }

      // Plugin fingerprinting
      if (this.config.features.plugins) {
        await this.randomDelay();
        try {
          const { collectPluginFingerprint } = await import(
            "./modules/plugins"
          );
          const pluginData = await collectPluginFingerprint();
          results.plugins = pluginData;
        } catch (error) {
          console.warn("Plugin fingerprint collection failed:", error);
          // results.plugins already has fallback value
        }
      }
    } catch (error) {
      console.warn(
        "Advanced fingerprint collection encountered errors:",
        error
      );
    }

    return results;
  }

  /**
   * Collect behavioral data
   */
  private async collectBehavioralData(): Promise<BehavioralData | undefined> {
    if (!this.config.features.behavioral) return undefined;

    try {
      const behavioralFingerprint = await collectBehavioralFingerprint();
      return this.convertBehavioralFingerprint(behavioralFingerprint);
    } catch (error) {
      console.warn("Behavioral fingerprinting failed:", error);
      return undefined;
    }
  }

  /**
   * Convert BehavioralFingerprint to BehavioralData
   */
  private convertBehavioralFingerprint(fingerprint: any): BehavioralData {
    return {
      mouseMovements: {
        entropy: fingerprint.statistics?.entropy || 0,
        patterns: [fingerprint.signatures?.mouseSignature || ""],
        velocity:
          fingerprint.mouseEvents
            ?.slice(0, 10)
            .map((e: any) => e.velocity || 0) || [],
        acceleration: [
          fingerprint.mousePatterns?.movementPattern?.acceleration || 0,
        ],
        clickPatterns: [fingerprint.signatures?.mouseSignature || ""],
      },
      keyboardPatterns: {
        typingSpeed: fingerprint.typingPatterns?.overall?.wpm || 0,
        dwellTimes:
          fingerprint.typingPatterns?.overall?.pausePattern?.slice(0, 10) || [],
        flightTimes: [fingerprint.typingPatterns?.overall?.flightTime || 0],
        rhythm: fingerprint.signatures?.keyboardSignature || "",
      },
      scrollBehavior: {
        patterns: [fingerprint.signatures?.navigationSignature || ""],
        velocity: [fingerprint.mousePatterns?.scrollPattern?.velocity || 0],
        acceleration: [
          fingerprint.mousePatterns?.scrollPattern?.acceleration || 0,
        ],
      },
      touchBehavior:
        fingerprint.touchEvents?.length > 0
          ? {
              touchPoints: fingerprint.touchPatterns?.multiTouchFrequency || 0,
              pressure: [fingerprint.touchPatterns?.tapPressure || 0],
              gestures: [fingerprint.signatures?.touchSignature || ""],
            }
          : undefined,
    };
  }

  // Placeholder methods for specific fingerprinting techniques
  // These will be implemented in separate modules

  private async collectCanvasFingerprint(): Promise<CanvasFingerprint> {
    try {
      const { collectCanvasFingerprint } = await import("./modules/canvas");
      return await collectCanvasFingerprint();
    } catch (error) {
      console.warn("Canvas fingerprint collection failed:", error);
      return {
        isSupported: false,
        basic: "canvas_error",
        advanced: "canvas_error",
        fonts: {},
        textSamples: {},
        textMetrics: {},
        blendModes: {},
        imageData: "canvas_error",
        entropy: 0,
      };
    }
  }

  private async collectWebGLFingerprint(): Promise<WebGLFingerprint> {
    try {
      const { collectWebGLFingerprint } = await import("./modules/webgl");
      return await collectWebGLFingerprint();
    } catch (error) {
      console.warn("WebGL fingerprint collection failed:", error);
      return {
        isSupported: false,
        vendor: "webgl_error",
        renderer: "webgl_error",
        version: "webgl_error",
        shadingLanguageVersion: "webgl_error",
        extensions: [],
        parameters: {},
        capabilities: {},
        renderHashes: {
          basic: "webgl_error",
          triangle: "webgl_error",
          gradient: "webgl_error",
          floating: "webgl_error",
        },
        supportedFormats: {
          textures: [],
          renderbuffers: [],
        },
        maxValues: {},
        entropy: 0,
      };
    }
  }

  private async collectAudioFingerprint(): Promise<AudioFingerprint> {
    try {
      const { collectAudioFingerprint } = await import("./modules/audio");
      return await collectAudioFingerprint();
    } catch (error) {
      console.warn("Audio fingerprint collection failed:", error);
      return {
        isSupported: false,
        contextHashes: {
          oscillator: "audio_error",
          triangle: "audio_error",
          sawtooth: "audio_error",
          square: "audio_error",
          compressor: "audio_error",
          dynamics: "audio_error",
          hybrid: "audio_error",
        },
        sampleRate: 0,
        bufferSize: 0,
        channelCount: 0,
        compressionRatio: 0,
        processingTimes: {
          oscillator: 0,
          compressor: 0,
          hybrid: 0,
        },
        audioCapabilities: {
          maxChannels: 0,
          sampleRates: [],
          audioFormats: [],
        },
        nodeSupport: {},
        entropy: 0,
      };
    }
  }

  private async collectFontFingerprint(): Promise<FontFingerprint> {
    try {
      const { collectFontFingerprint } = await import("./modules/fonts");
      return await collectFontFingerprint();
    } catch (error) {
      console.warn("Font fingerprint collection failed:", error);
      return {
        isSupported: false,
        availableFonts: [],
        systemFonts: [],
        webFonts: [],
        fontMeasurements: {},
        unicodeSupport: {},
        fallbackDetection: {},
        fontStacks: {},
        renderingTests: {},
        totalFontsDetected: 0,
        detectionTechniques: {},
        entropy: 0,
      };
    }
  }

  private async collectCSSFingerprint(): Promise<CSSFingerprint> {
    try {
      const { collectCSSFingerprint } = await import("./modules/css");
      const cssData = await collectCSSFingerprint();
      return {
        isSupported: cssData.isSupported || true,
        mediaQueries: cssData.mediaQueries || {},
        cssFeatures: cssData.cssFeatures || {},
        computedStyles: cssData.computedStyles || {},
        cssProperties: cssData.cssProperties || {},
        browserExtensions: cssData.browserExtensions || {},
        cssUnits: cssData.cssUnits || {},
        colorSpaces: cssData.colorSpaces || {},
        animations: cssData.animations || {},
        layoutMethods: cssData.layoutMethods || {},
        selectors: cssData.selectors || {},
        pseudoElements: cssData.pseudoElements || {},
        pseudoClasses: cssData.pseudoClasses || {},
        atRules: cssData.atRules || {},
        cssValues: cssData.cssValues || {},
        vendorPrefixes: cssData.vendorPrefixes || [],
        entropy: cssData.entropy || 0,
      };
    } catch (error) {
      console.warn("CSS fingerprint collection failed:", error);
      return {
        isSupported: false,
        mediaQueries: {},
        cssFeatures: {},
        computedStyles: {},
        cssProperties: {},
        browserExtensions: {},
        cssUnits: {},
        colorSpaces: {},
        animations: {},
        layoutMethods: {},
        selectors: {},
        pseudoElements: {},
        pseudoClasses: {},
        atRules: {},
        cssValues: {},
        vendorPrefixes: [],
        entropy: 0,
      };
    }
  }

  private async collectTimingFingerprint(): Promise<TimingFingerprint> {
    try {
      const { collectTimingFingerprint } = await import("./modules/timing");
      return await collectTimingFingerprint();
    } catch (error) {
      console.warn("Timing fingerprint collection failed:", error);
      return {
        isSupported: false,
        performanceTimings: {
          cryptoOperations: {},
          mathOperations: {},
          arrayOperations: {},
          stringOperations: {},
          regexOperations: {},
          sortingAlgorithms: {},
        },
        wasmTimings: {
          isSupported: false,
          compilationTime: 0,
          instantiationTime: 0,
          executionTimings: {},
          memoryOperations: {},
        },
        cpuBenchmarks: {
          singleThread: {},
          workerThread: {},
          concurrency: {},
        },
        memoryTimings: {
          allocation: {},
          access: {},
          garbage: {},
        },
        clockResolution: 0,
        performanceApiPrecision: 0,
        entropy: 0,
      };
    }
  }

  private async collectWebRTCFingerprint(): Promise<WebRTCFingerprint> {
    try {
      const { collectWebRTCFingerprint } = await import("./modules/webrtc");
      return await collectWebRTCFingerprint();
    } catch (error) {
      console.warn("WebRTC fingerprint collection failed:", error);
      return {
        isSupported: false,
        localIPs: [],
        stunResponses: {},
        rtcCapabilities: { codecs: [], headerExtensions: [], transports: [] },
        iceGatheringTime: 0,
        candidateTypes: [],
        candidates: [],
        networkInterfaces: [],
        connectionTypes: [],
        protocols: [],
        stunServers: [],
        turnServers: [],
        iceCandidatePoolSize: 0,
        bundlePolicy: "balanced",
        rtcpMuxPolicy: "require",
        iceTransportPolicy: "all",
        sdpSemantics: "unified-plan",
        fingerprint: "webrtc_error",
        entropy: 0,
      };
    }
  }

  private async collectBatteryFingerprint(): Promise<BatteryFingerprint> {
    try {
      const { collectBatteryFingerprint } = await import("./modules/battery");
      return await collectBatteryFingerprint();
    } catch (error) {
      console.warn("Battery fingerprint collection failed:", error);
      return {
        available: false,
        powerProfile: {},
        hardwareSignature: {},
        timingPatterns: {
          updateFrequency: 0,
          precisionLevel: 0,
          eventIntervals: [],
          jitterPattern: "",
        },
        privacyMasking: {
          levelMasked: false,
          timingMasked: false,
          artificialValues: false,
        },
        batteryHash: "battery_error",
        stabilityScore: 0,
        confidenceLevel: 0,
        collectionTime: 0,
        samplingDuration: 0,
        errorCount: 0,
      };
    }
  }

  private async collectMediaDevicesFingerprint(): Promise<MediaDeviceFingerprint> {
    try {
      const { collectMediaDeviceFingerprint } = await import(
        "./modules/media-devices"
      );
      return await collectMediaDeviceFingerprint();
    } catch (error) {
      console.warn("Media devices fingerprint collection failed:", error);
      return {
        available: false,
        devices: {
          audioInputs: [],
          audioOutputs: [],
          videoInputs: [],
          totalCount: 0,
          uniqueDevices: 0,
        },
        capabilities: {
          video: {
            resolutions: [],
            audioFormats: [],
            videoCodecs: [],
            constraints: {},
          },
          audio: {
            resolutions: [],
            audioFormats: [],
            videoCodecs: [],
            constraints: {},
          },
          supportedConstraints: [],
        },
        permissions: {
          camera: "denied",
          microphone: "denied",
          speaker: "denied",
          permissionAPI: false,
        },
        hardwareSignature: {
          deviceFingerprint: "media_error",
          vendorPatterns: [],
          modelSignatures: [],
          driverVersions: [],
        },
        streamAnalysis: {
          defaultResolution: { width: 0, height: 0 },
          supportedFrameRates: [],
          audioChannels: [],
          bitRateProfiles: [],
        },
        privacyIndicators: {
          labelsBlocked: false,
          deviceIdsRandomized: false,
          permissionDenied: true,
          virtualDevicesDetected: false,
        },
        mediaDeviceHash: "media_error",
        stabilityScore: 0,
        confidenceLevel: 0,
        collectionTime: 0,
        enumerationDuration: 0,
        errorCount: 1,
      };
    }
  }

  private async collectSensorFingerprint(): Promise<DeviceSensorFingerprint> {
    try {
      const { collectSensorFingerprint } = await import("./modules/sensors");
      return await collectSensorFingerprint();
    } catch (error) {
      console.warn("Sensor fingerprint collection failed:", error);
      return {
        available: false,
        accelerometer: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        gyroscope: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        magnetometer: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        ambientLight: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        proximity: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        orientation: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        motion: {
          available: false,
          frequency: 0,
          precision: 0,
          range: 0,
          resolution: 0,
          noiseLevel: 0,
          driftRate: 0,
          calibration: {
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            scaleX: 1,
            scaleY: 1,
            scaleZ: 1,
          },
          readings: [],
          patterns: {
            staticNoise: "",
            dynamicResponse: "",
            temperatureDrift: "",
          },
        },
        deviceMotion: {
          supported: false,
          interval: 0,
          accelerationIncludingGravity: false,
          rotationRate: false,
        },
        deviceOrientation: {
          supported: false,
          absolute: false,
          compassHeading: false,
        },
        hardwareSignature: {
          vendorFingerprint: "",
          modelSignature: "",
          calibrationSignature: "",
          noiseProfile: "",
        },
        permissions: {
          accelerometer: "denied",
          gyroscope: "denied",
          magnetometer: "denied",
          permissionAPI: false,
        },
        correlation: {
          accelerometerGyroscope: 0,
          orientationMotion: 0,
          stabilityScore: 0,
        },
        privacyIndicators: {
          sensorsBlocked: false,
          reducedPrecision: false,
          artificialReadings: false,
          spoofingDetected: false,
        },
        sensorHash: "sensor_error",
        hardwareHash: "sensor_error",
        confidenceLevel: 0,
        collectionTime: 0,
        samplingDuration: 0,
        errorCount: 1,
        capabilities: {
          maxFrequency: 0,
          bufferSize: 0,
          sensorTypes: [],
          permissions: [],
        },
        patterns: {
          motionSignatures: [],
          orientationPatterns: [],
          usageCharacteristics: [],
        },
        analysis: {
          stabilityScores: {},
          entropyMeasures: {},
          correlationMatrix: {},
        },
        fingerprints: {
          sensorHash: "sensor_error",
          patternHash: "sensor_error",
          capabilityHash: "sensor_error",
        },
      };
    }
  }

  private async collectNetworkFingerprint(): Promise<NetworkFingerprint> {
    try {
      const { collectNetworkFingerprint } = await import("./modules/network");
      return await collectNetworkFingerprint();
    } catch (error) {
      console.warn("Network fingerprint collection failed:", error);
      return {
        available: false,
        endpoints: [],
        analysis: {
          avgRTT: 0,
          minRTT: 0,
          maxRTT: 0,
          jitter: 0,
          packetLoss: 0,
          stability: 0,
          latencyVariation: 0,
          throughputEstimate: 0,
          jitterMeasurement: 0,
        },
        connection: {},
        timingPatterns: {
          dnsLookup: [],
          tcpConnect: [],
          tlsHandshake: [],
          requestResponse: [],
          totalTime: [],
        },
        bandwidth: {
          estimated: 0,
          downloadSpeed: 0,
          uploadSpeed: 0,
          testDuration: 0,
        },
        geographic: {
          estimatedLocation: "unknown",
          timezone: "unknown",
          proximityToServers: {},
        },
        characteristics: {
          mtu: 0,
          ipVersion: "unknown",
          dnsProvider: "unknown",
          proxy: false,
          vpn: false,
          tor: false,
        },
        privacyIndicators: {
          maskedIP: false,
          reducedTiming: false,
          artificialDelays: false,
          tunneled: false,
        },
        networkHash: "network_error",
        timingHash: "timing_error",
        confidenceLevel: 0,
        collectionTime: 0,
        testDuration: 0,
        errorCount: 1,
      };
    }
  }

  private async collectWebAssemblyFingerprint(): Promise<WebAssemblyFingerprint> {
    try {
      const { collectWebAssemblyFingerprint } = await import(
        "./modules/webassembly"
      );
      return await collectWebAssemblyFingerprint();
    } catch (error) {
      console.warn("WebAssembly fingerprint collection failed:", error);
      return {
        available: false,
        capabilities: {
          basicWasm: false,
          simdSupported: false,
          threadsSupported: false,
          bulkMemorySupported: false,
          multiValueSupported: false,
          referenceTypesSupported: false,
          tailCallSupported: false,
          exceptionHandlingSupported: false,
          atomicsSupported: false,
          bigIntSupported: false,
        },
        instructionSets: {
          basic: false,
          simd128: false,
          atomic: false,
          bulk: false,
          reference: false,
          multiValue: false,
          tailCall: false,
          exceptions: false,
        },
        performance: {
          compilationTime: 0,
          instantiationTime: 0,
          executionTime: 0,
          memoryOperations: 0,
          mathOperations: 0,
          cryptoOperations: 0,
        },
        limits: {
          maxMemoryPages: 0,
          maxTableSize: 0,
          maxFunctionParams: 0,
          maxFunctionLocals: 0,
          maxModuleSize: 0,
        },
        hardware: {
          cpuArchitecture: "unknown",
          instructionSupport: {},
          performanceProfile: "unknown",
          parallelizationSupport: false,
        },
        modules: {
          testModules: [],
          supportedFormats: [],
          optimizationLevel: "unknown",
        },
        security: {
          sandboxingEffective: false,
          memoryProtection: false,
          stackProtection: false,
          codeIntegrity: false,
        },
        environment: {
          engineVersion: "unknown",
          optimizationFlags: [],
          debugSupport: false,
          profilingSupport: false,
        },
        fingerprints: {
          instructionHash: "wasm_error",
          performanceHash: "wasm_error",
          capabilityHash: "wasm_error",
          moduleHash: "wasm_error",
        },
        confidenceLevel: 0,
        collectionTime: 0,
        errorCount: 1,
      };
    }
  }

  private async collectStorageFingerprint(): Promise<StorageFingerprint> {
    try {
      const { collectStorageFingerprint } = await import("./modules/storage");
      return await collectStorageFingerprint();
    } catch (error) {
      console.warn("Storage fingerprint collection failed:", error);
      return {
        available: false,
        serviceWorker: {
          supported: false,
          scope: "",
          scriptURL: "",
          state: "error",
          registration: false,
          updateViaCache: "none",
          permissions: "denied",
        },
        cacheAPI: {
          supported: false,
          storageEstimate: {
            quota: 0,
            usage: 0,
            usageDetails: {},
          },
          cacheNames: [],
          cacheOperations: {
            add: false,
            addAll: false,
            delete: false,
            keys: false,
            match: false,
            matchAll: false,
            put: false,
          },
          cacheBehavior: {
            requestMode: "same-origin",
            cacheMode: "default",
            credentials: "same-origin",
            redirect: "follow",
          },
        },
        persistentStorage: {
          supported: false,
          persisted: false,
          requestPersistent: false,
          storageManager: false,
        },
        indexedDB: {
          supported: false,
          databases: [],
          version: 0,
          objectStores: [],
          storageQuota: 0,
          usageBytes: 0,
        },
        webSQL: {
          supported: false,
          version: "",
          databases: [],
          storageSize: 0,
        },
        localStorage: {
          supported: false,
          quota: 0,
          usage: 0,
          testWrite: false,
          testRead: false,
          itemCount: 0,
        },
        sessionStorage: {
          supported: false,
          quota: 0,
          usage: 0,
          testWrite: false,
          testRead: false,
          itemCount: 0,
        },
        storageEvents: {
          supported: false,
          crossTab: false,
          persistence: false,
        },
        backgroundSync: {
          supported: false,
          registration: false,
          permissions: "denied",
        },
        pushAPI: {
          supported: false,
          permissions: "denied",
          subscription: false,
          applicationServerKey: false,
        },
        notifications: {
          supported: false,
          permissions: "denied",
          showNotification: false,
          actions: false,
          badge: false,
          icon: false,
          image: false,
          silent: false,
          tag: false,
          timestamp: false,
          vibrate: false,
        },
        broadcastChannel: {
          supported: false,
          postMessage: false,
          onMessage: false,
        },
        storageAnalysis: {
          totalQuota: 0,
          totalUsage: 0,
          storageBreakdown: {},
          compressionRatio: 0,
          accessPatterns: [],
        },
        fingerprints: {
          serviceWorkerHash: "storage_error",
          cacheHash: "storage_error",
          storageHash: "storage_error",
          behaviorHash: "storage_error",
        },
        confidenceLevel: 0,
        collectionTime: 0,
        errorCount: 1,
      };
    }
  }

  private async collectPluginFingerprint(): Promise<PluginFingerprint> {
    try {
      const { collectPluginFingerprint } = await import("./modules/plugins");
      return await collectPluginFingerprint();
    } catch (error) {
      console.warn("Plugin fingerprint collection failed:", error);
      return {
        available: false,
        plugins: {
          navigator: [],
          count: 0,
          enabledPlugins: [],
          disabledPlugins: [],
        },
        mimeTypes: {
          supported: [],
          count: 0,
          categories: {},
        },
        extensions: {
          detected: [],
          adBlocker: false,
          passwordManager: false,
          vpnExtension: false,
          developerExtensions: false,
          customExtensions: [],
        },
        automation: {
          selenium: false,
          puppeteer: false,
          playwright: false,
          webDriver: false,
          headless: false,
          automationIndicators: [],
        },
        developerTools: {
          open: false,
          orientation: "unknown",
          detected: false,
          debuggerPresent: false,
          consoleModified: false,
        },
        modifications: {
          windowProperties: [],
          prototypeChanges: [],
          globalVariables: [],
          functionOverrides: [],
          nativeCodeModified: false,
        },
        security: {
          cspBlocked: false,
          mixedContent: false,
          secureContext: false,
          permissions: {},
        },
        browserFeatures: {
          webgl: false,
          webrtc: false,
          geolocation: false,
          notifications: false,
          camera: false,
          microphone: false,
          clipboard: false,
          fullscreen: false,
        },
        fingerprintResistance: {
          canvasBlocked: false,
          audioBlocked: false,
          webglBlocked: false,
          fontsBlocked: false,
          spoofingDetected: false,
          privacyMode: false,
        },
        fingerprints: {
          pluginHash: "plugin_error",
          mimeTypeHash: "plugin_error",
          extensionHash: "plugin_error",
          modificationHash: "plugin_error",
        },
        confidenceLevel: 0,
        collectionTime: 0,
        errorCount: 1,
      };
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send fingerprint data to backend
   */
  private async sendToBackend(
    request: FingerprintCollectionRequest
  ): Promise<FingerprintCollectionResponse> {
    const response = await fetch(`${this.config.apiEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      throw new FingerprintError(
        `HTTP ${response.status}: ${response.statusText}`,
        "HTTP_ERROR",
        { status: response.status, statusText: response.statusText }
      );
    }

    return response.json();
  }

  /**
   * Abort current collection
   */
  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isCollecting = false;
  }

  /**
   * Check if collection is in progress
   */
  public get collecting(): boolean {
    return this.isCollecting;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<FingerprintConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance for convenience
export const fingerprintCollector = new FingerprintCollector();
