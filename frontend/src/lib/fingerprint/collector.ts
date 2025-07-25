import {
  CoreFingerprintData,
  AdvancedFingerprintData,
  FingerprintCollectionRequest,
  FingerprintCollectionResponse,
  FingerprintConfig,
  FingerprintEvent,
  FingerprintEventHandler,
  FingerprintError,
  BehavioralFingerprint,
} from "@/types/fingerprint";
import { collectBehavioralFingerprint } from "./modules/behavioral";
import { collectCanvasFingerprint } from "./modules/canvas";
import { collectWebGLFingerprint } from "./modules/webgl";
import { collectAudioFingerprint } from "./modules/audio";
import { collectFontFingerprint } from "./modules/fonts";
import { collectCSSFingerprint } from "./modules/css";
import { collectTimingFingerprint } from "./modules/timing";
import { collectWebRTCFingerprint } from "./modules/webrtc";
import { collectBatteryFingerprint } from "./modules/battery";
import { collectMediaDeviceFingerprint } from "./modules/media-devices";
import { collectSensorFingerprint } from "./modules/sensors";
import { collectNetworkFingerprint } from "./modules/network";
import { collectWebAssemblyFingerprint } from "./modules/webassembly";
import { collectStorageFingerprint } from "./modules/storage";
import { collectPluginFingerprint } from "./modules/plugins";
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
    behavioral: true,
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
      let behavioralData: BehavioralFingerprint | undefined;
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
      results.canvas = await collectCanvasFingerprint();
    }

    // WebGL fingerprinting
    if (this.config.features.webgl) {
      // await this.randomDelay();
      results.webgl = await collectWebGLFingerprint();
    }

    // Audio fingerprinting
    if (this.config.features.audio) {
      // await this.randomDelay();
      results.audio = await collectAudioFingerprint();
    }

    // Font fingerprinting
    if (this.config.features.fonts) {
      // await this.randomDelay();
      results.fonts = await collectFontFingerprint();
    }

    // CSS fingerprinting
    if (this.config.features.css) {
      // await this.randomDelay();
      results.css = await collectCSSFingerprint();
    }

    // Timing fingerprinting
    if (this.config.features.timing) {
      // await this.randomDelay();
      results.timing = await collectTimingFingerprint();
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
          results.plugins = await collectPluginFingerprint();
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
  private async collectBehavioralData(): Promise<
    BehavioralFingerprint | undefined
  > {
    if (!this.config.features.behavioral) return undefined;

    try {
      return await collectBehavioralFingerprint();
    } catch (error) {
      console.warn("Behavioral fingerprinting failed:", error);
      return undefined;
    }
  }

  // /**
  //  * Convert BehavioralFingerprint to BehavioralData
  //  */
  // private convertBehavioralFingerprint(fingerprint: any): BehavioralData {
  //   return {
  //     mouseMovements: {
  //       entropy: fingerprint.statistics?.entropy || 0,
  //       patterns: [fingerprint.signatures?.mouseSignature || ""],
  //       velocity:
  //         fingerprint.mouseEvents
  //           ?.slice(0, 10)
  //           .map((e: any) => e.velocity || 0) || [],
  //       acceleration: [
  //         fingerprint.mousePatterns?.movementPattern?.acceleration || 0,
  //       ],
  //       clickPatterns: [fingerprint.signatures?.mouseSignature || ""],
  //     },
  //     keyboardPatterns: {
  //       typingSpeed: fingerprint.typingPatterns?.overall?.wpm || 0,
  //       dwellTimes:
  //         fingerprint.typingPatterns?.overall?.pausePattern?.slice(0, 10) || [],
  //       flightTimes: [fingerprint.typingPatterns?.overall?.flightTime || 0],
  //       rhythm: fingerprint.signatures?.keyboardSignature || "",
  //     },
  //     scrollBehavior: {
  //       patterns: [fingerprint.signatures?.navigationSignature || ""],
  //       velocity: [fingerprint.mousePatterns?.scrollPattern?.velocity || 0],
  //       acceleration: [
  //         fingerprint.mousePatterns?.scrollPattern?.acceleration || 0,
  //       ],
  //     },
  //     touchBehavior:
  //       fingerprint.touchEvents?.length > 0
  //         ? {
  //             touchPoints: fingerprint.touchPatterns?.multiTouchFrequency || 0,
  //             pressure: [fingerprint.touchPatterns?.tapPressure || 0],
  //             gestures: [fingerprint.signatures?.touchSignature || ""],
  //           }
  //         : undefined,
  //   };
  // }

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
