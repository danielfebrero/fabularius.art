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
      await this.randomDelay();
      results.canvas = await this.collectCanvasFingerprint();
    }

    // WebGL fingerprinting
    if (this.config.features.webgl) {
      await this.randomDelay();
      results.webgl = await this.collectWebGLFingerprint();
    }

    // Audio fingerprinting
    if (this.config.features.audio) {
      await this.randomDelay();
      results.audio = await this.collectAudioFingerprint();
    }

    // Font fingerprinting
    if (this.config.features.fonts) {
      await this.randomDelay();
      results.fonts = await this.collectFontFingerprint();
    }

    // CSS fingerprinting
    if (this.config.features.css) {
      await this.randomDelay();
      results.css = await this.collectCSSFingerprint();
    }

    // Timing fingerprinting
    if (this.config.features.timing) {
      await this.randomDelay();
      results.timing = await this.collectTimingFingerprint();
    }

    return results as CoreFingerprintData;
  }

  /**
   * Collect advanced fingerprint data
   */
  private async collectAdvancedFingerprint(): Promise<AdvancedFingerprintData> {
    const results: Partial<AdvancedFingerprintData> = {};

    // WebRTC fingerprinting
    if (this.config.features.webrtc) {
      await this.randomDelay();
      results.webrtc = await this.collectWebRTCFingerprint();
    }

    // Battery fingerprinting
    if (this.config.features.battery) {
      await this.randomDelay();
      results.battery = await this.collectBatteryFingerprint();
    }

    // Media devices fingerprinting
    if (this.config.features.mediaDevices) {
      await this.randomDelay();
      results.mediaDevices = await this.collectMediaDevicesFingerprint();
    }

    // Sensor fingerprinting
    if (this.config.features.sensors) {
      await this.randomDelay();
      results.sensors = await this.collectSensorFingerprint();
    }

    // Network fingerprinting
    if (this.config.features.network) {
      await this.randomDelay();
      results.network = await this.collectNetworkFingerprint();
    }

    // WebAssembly fingerprinting
    if (this.config.features.webassembly) {
      await this.randomDelay();
      results.webassembly = await this.collectWebAssemblyFingerprint();
    }

    // Storage fingerprinting
    if (this.config.features.storage) {
      await this.randomDelay();
      results.storage = await this.collectStorageFingerprint();
    }

    // Plugin fingerprinting
    if (this.config.features.plugins) {
      await this.randomDelay();
      results.plugins = await this.collectPluginFingerprint();
    }

    return results as AdvancedFingerprintData;
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

  private async collectCanvasFingerprint(): Promise<string> {
    try {
      const { collectCanvasFingerprint } = await import("./modules/canvas");
      const canvasData = await collectCanvasFingerprint();
      return canvasData.basic || canvasData.advanced || "canvas_fallback";
    } catch (error) {
      console.warn("Canvas fingerprint collection failed:", error);
      return "canvas_error";
    }
  }

  private async collectWebGLFingerprint(): Promise<any> {
    try {
      const { collectWebGLFingerprint } = await import("./modules/webgl");
      const webglData = await collectWebGLFingerprint();
      return {
        vendor: webglData.vendor || "unknown",
        renderer: webglData.renderer || "unknown",
        unmaskedVendor: webglData.unmaskedVendor,
        unmaskedRenderer: webglData.unmaskedRenderer,
        extensions: webglData.extensions || [],
        parameters: webglData.parameters || {},
        renderHash: webglData.renderHashes?.basic || "webgl_fallback",
      };
    } catch (error) {
      console.warn("WebGL fingerprint collection failed:", error);
      return {
        vendor: "webgl_error",
        renderer: "webgl_error",
        extensions: [],
        parameters: {},
        renderHash: "webgl_error",
      };
    }
  }

  private async collectAudioFingerprint(): Promise<any> {
    try {
      const { collectAudioFingerprint } = await import("./modules/audio");
      const audioData = await collectAudioFingerprint();
      return {
        contextHash: audioData.contextHashes?.hybrid || "audio_fallback",
        compressionRatio: audioData.compressionRatio || 0,
        oscillatorHash:
          audioData.contextHashes?.oscillator || "oscillator_fallback",
        dynamicsHash: audioData.contextHashes?.dynamics || "dynamics_fallback",
      };
    } catch (error) {
      console.warn("Audio fingerprint collection failed:", error);
      return {
        contextHash: "audio_error",
        compressionRatio: 0,
        oscillatorHash: "audio_error",
        dynamicsHash: "audio_error",
      };
    }
  }

  private async collectFontFingerprint(): Promise<any> {
    try {
      const { collectFontFingerprint } = await import("./modules/fonts");
      const fontData = await collectFontFingerprint();
      return {
        available: fontData.fontMeasurements || {},
        systemFonts: fontData.systemFonts || [],
        webFonts: fontData.webFonts || [],
      };
    } catch (error) {
      console.warn("Font fingerprint collection failed:", error);
      return {
        available: {},
        systemFonts: [],
        webFonts: [],
      };
    }
  }

  private async collectCSSFingerprint(): Promise<any> {
    try {
      const { collectCSSFingerprint } = await import("./modules/css");
      const cssData = await collectCSSFingerprint();
      return {
        mediaQueries: cssData.mediaQueries || {},
        computedStyles: cssData.computedStyles || {},
        supportedFeatures: Object.keys(cssData.cssFeatures || {}).filter(
          (key) => cssData.cssFeatures?.[key]
        ),
      };
    } catch (error) {
      console.warn("CSS fingerprint collection failed:", error);
      return {
        mediaQueries: {},
        computedStyles: {},
        supportedFeatures: [],
      };
    }
  }

  private async collectTimingFingerprint(): Promise<any> {
    try {
      const { collectTimingFingerprint } = await import("./modules/timing");
      const timingData = await collectTimingFingerprint();
      return {
        cryptoTiming:
          timingData.performanceTimings?.cryptoOperations?.sha256 || 0,
        regexTiming:
          timingData.performanceTimings?.regexOperations?.complexPattern || 0,
        sortTiming:
          timingData.performanceTimings?.sortingAlgorithms?.quickSort || 0,
        wasmTiming:
          timingData.wasmTimings?.executionTimings?.fibonacci || undefined,
      };
    } catch (error) {
      console.warn("Timing fingerprint collection failed:", error);
      return {
        cryptoTiming: 0,
        regexTiming: 0,
        sortTiming: 0,
      };
    }
  }

  private async collectWebRTCFingerprint(): Promise<any> {
    try {
      const { collectWebRTCFingerprint } = await import("./modules/webrtc");
      const webrtcData = await collectWebRTCFingerprint();
      return {
        localIPs: webrtcData.localIPs || [],
        stunResponses: webrtcData.stunResponses || {},
        rtcCapabilities: {
          codecs:
            webrtcData.rtcCapabilities?.codecs?.map((c) => c.mimeType) || [],
          headerExtensions:
            webrtcData.rtcCapabilities?.headerExtensions?.map((h) => h.uri) ||
            [],
        },
        iceGatheringTime: webrtcData.iceGatheringTime || 0,
        candidateTypes: webrtcData.candidateTypes || [],
      };
    } catch (error) {
      console.warn("WebRTC fingerprint collection failed:", error);
      return {
        localIPs: [],
        stunResponses: {},
        rtcCapabilities: { codecs: [], headerExtensions: [] },
        iceGatheringTime: 0,
        candidateTypes: [],
      };
    }
  }

  private async collectBatteryFingerprint(): Promise<any> {
    try {
      const { collectBatteryFingerprint } = await import("./modules/battery");
      const batteryData = await collectBatteryFingerprint();
      return {
        level: batteryData.level,
        charging: batteryData.charging,
        chargingTime: batteryData.chargingTime,
        dischargingTime: batteryData.dischargingTime,
        batteryHash: batteryData.batteryHash || "battery_fallback",
      };
    } catch (error) {
      console.warn("Battery fingerprint collection failed:", error);
      return {
        batteryHash: "battery_error",
      };
    }
  }

  private async collectMediaDevicesFingerprint(): Promise<any> {
    try {
      const { collectMediaDeviceFingerprint } = await import(
        "./modules/media-devices"
      );
      const mediaData = await collectMediaDeviceFingerprint();
      return {
        videoInputs: mediaData.devices.videoInputs?.length || 0,
        audioInputs: mediaData.devices.audioInputs?.length || 0,
        audioOutputs: mediaData.devices.audioOutputs?.length || 0,
        deviceLabels: [
          ...(mediaData.devices.videoInputs
            ?.map((d) => d.label)
            .filter(Boolean) || []),
          ...(mediaData.devices.audioInputs
            ?.map((d) => d.label)
            .filter(Boolean) || []),
          ...(mediaData.devices.audioOutputs
            ?.map((d) => d.label)
            .filter(Boolean) || []),
        ],
        permissionStatus: mediaData.permissions.camera || "unknown",
      };
    } catch (error) {
      console.warn("Media devices fingerprint collection failed:", error);
      return {
        videoInputs: 0,
        audioInputs: 0,
        audioOutputs: 0,
        deviceLabels: [],
        permissionStatus: "error",
      };
    }
  }

  private async collectSensorFingerprint(): Promise<any> {
    try {
      const { collectSensorFingerprint } = await import("./modules/sensors");
      const sensorData = await collectSensorFingerprint();
      return {
        accelerometer: {
          available: sensorData.accelerometer?.available || false,
          precision: sensorData.accelerometer?.precision,
          noisePattern: "unknown",
        },
        gyroscope: {
          available: sensorData.gyroscope?.available || false,
          precision: sensorData.gyroscope?.precision,
          noisePattern: "unknown",
        },
        magnetometer: {
          available: sensorData.magnetometer?.available || false,
          precision: sensorData.magnetometer?.precision,
        },
        deviceOrientation: sensorData.deviceOrientation?.supported || false,
        deviceMotion: sensorData.deviceMotion?.supported || false,
      };
    } catch (error) {
      console.warn("Sensor fingerprint collection failed:", error);
      return {
        accelerometer: { available: false },
        gyroscope: { available: false },
        magnetometer: { available: false },
        deviceOrientation: false,
        deviceMotion: false,
      };
    }
  }

  private async collectNetworkFingerprint(): Promise<any> {
    try {
      const { collectNetworkFingerprint } = await import("./modules/network");
      const networkData = await collectNetworkFingerprint();
      return {
        available: networkData.available || false,
        endpoints: networkData.endpoints || [],
        analysis: networkData.analysis || {
          avgRTT: 0,
          minRTT: 0,
          maxRTT: 0,
          jitter: 0,
          packetLoss: 0,
          stability: 0,
        },
        connection: networkData.connection || {},
        timingPatterns: networkData.timingPatterns || {
          dnsLookup: [],
          tcpConnect: [],
          tlsHandshake: [],
          requestResponse: [],
          totalTime: [],
        },
        bandwidth: networkData.bandwidth || {
          estimated: 0,
          downloadSpeed: 0,
          uploadSpeed: 0,
          testDuration: 0,
        },
        geographic: networkData.geographic || {
          estimatedLocation: "unknown",
          timezone: "unknown",
          proximityToServers: {},
        },
        characteristics: networkData.characteristics || {
          mtu: 0,
          ipVersion: "unknown",
          dnsProvider: "unknown",
          proxy: false,
          vpn: false,
          tor: false,
        },
        privacyIndicators: networkData.privacyIndicators || {
          maskedIP: false,
          reducedTiming: false,
          artificialDelays: false,
          tunneled: false,
        },
        networkHash: networkData.networkHash || "network_fallback",
        timingHash: networkData.timingHash || "timing_fallback",
        confidenceLevel: networkData.confidenceLevel || 0,
        collectionTime: networkData.collectionTime || 0,
        testDuration: networkData.testDuration || 0,
        errorCount: networkData.errorCount || 0,
      };
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

  private async collectWebAssemblyFingerprint(): Promise<any> {
    try {
      const { collectWebAssemblyFingerprint } = await import(
        "./modules/webassembly"
      );
      const wasmData = await collectWebAssemblyFingerprint();
      return {
        supported: wasmData.available || false,
        simdSupported: false,
        threadsSupported: false,
        bulkMemorySupported: false,
        wasmModules: wasmData.modules || [],
        instructionTiming: wasmData.performance || {},
      };
    } catch (error) {
      console.warn("WebAssembly fingerprint collection failed:", error);
      return {
        supported: false,
        simdSupported: false,
        threadsSupported: false,
        bulkMemorySupported: false,
        wasmModules: [],
        instructionTiming: {},
      };
    }
  }

  private async collectStorageFingerprint(): Promise<any> {
    try {
      const { collectStorageFingerprint } = await import("./modules/storage");
      const storageData = await collectStorageFingerprint();
      return {
        localStorage: storageData.localStorage?.supported || false,
        sessionStorage: storageData.sessionStorage?.supported || false,
        indexedDB: storageData.indexedDB?.supported || false,
        webSQL: storageData.webSQL?.supported || false,
        serviceWorker: storageData.serviceWorker?.supported || false,
        cacheAPI: storageData.cacheAPI?.supported || false,
        persistentStorage: storageData.persistentStorage?.supported || false,
        storageQuota: storageData.cacheAPI?.storageEstimate?.quota,
      };
    } catch (error) {
      console.warn("Storage fingerprint collection failed:", error);
      return {
        localStorage: false,
        sessionStorage: false,
        indexedDB: false,
        webSQL: false,
        serviceWorker: false,
        cacheAPI: false,
        persistentStorage: false,
      };
    }
  }

  private async collectPluginFingerprint(): Promise<any> {
    try {
      const { collectPluginFingerprint } = await import("./modules/plugins");
      const pluginData = await collectPluginFingerprint();
      return {
        extensions: pluginData.extensions?.detected || [],
        plugins: pluginData.plugins?.navigator?.map((p) => p.name) || [],
        mimeTypes: pluginData.mimeTypes?.supported?.map((m) => m.type) || [],
        adBlocker: pluginData.extensions?.adBlocker || false,
        devTools: pluginData.developerTools?.open || false,
        automation: pluginData.automation?.webDriver || false,
      };
    } catch (error) {
      console.warn("Plugin fingerprint collection failed:", error);
      return {
        extensions: [],
        plugins: [],
        mimeTypes: [],
        adBlocker: false,
        devTools: false,
        automation: false,
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
    const response = await fetch(
      `${this.config.apiEndpoint}/fingerprint/collect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: this.abortController?.signal,
      }
    );

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
