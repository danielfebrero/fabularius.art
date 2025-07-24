import type {
  CoreFingerprintData,
  AdvancedFingerprintData,
  BehavioralData,
} from "@/types/fingerprint";

/**
 * Frontend Fingerprint Optimization Service
 * Optimizes fingerprint data before transmission for real-time processing
 */

export interface OptimizationConfig {
  strategy: "minimal" | "balanced" | "full";
  compressionLevel: "none" | "light" | "aggressive";
  priorityComponents: string[];
  maxPayloadSize: number; // bytes
  enableClientSideHashing: boolean;
  batchingEnabled: boolean;
  batchSize: number;
  batchTimeout: number; // milliseconds
}

export interface OptimizedFingerprint {
  fingerprintId: string;
  userId?: string;
  optimizedCore: CoreFingerprintData | OptimizedCoreData;
  optimizedAdvanced: AdvancedFingerprintData | OptimizedAdvancedData;
  optimizedBehavioral?: BehavioralData | OptimizedBehavioralData;
  metadata: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    strategy: string;
    timestamp: number;
  };
}

interface OptimizedCoreData {
  hashes: Record<string, string>;
  essentials: Record<string, any>;
  compressed: Record<string, any>;
}

interface OptimizedAdvancedData {
  hashes: Record<string, string>;
  summaries: Record<string, any>;
  selected: Record<string, any>;
}

interface OptimizedBehavioralData {
  statistics: Record<string, number>;
  patterns: string[];
  confidence: number;
}

interface BatchProcessingQueue {
  fingerprints: OptimizedFingerprint[];
  size: number;
  lastUpdate: number;
  timeoutId?: number;
}

/**
 * Default optimization configuration for different use cases
 */
export const OPTIMIZATION_CONFIGS: Record<string, OptimizationConfig> = {
  realtime: {
    strategy: "minimal",
    compressionLevel: "aggressive",
    priorityComponents: ["canvas", "webgl", "audio"],
    maxPayloadSize: 5120, // 5KB
    enableClientSideHashing: true,
    batchingEnabled: true,
    batchSize: 10,
    batchTimeout: 1000,
  },
  balanced: {
    strategy: "balanced",
    compressionLevel: "light",
    priorityComponents: ["canvas", "webgl", "audio", "fonts", "css"],
    maxPayloadSize: 15360, // 15KB
    enableClientSideHashing: true,
    batchingEnabled: true,
    batchSize: 5,
    batchTimeout: 2000,
  },
  comprehensive: {
    strategy: "full",
    compressionLevel: "light",
    priorityComponents: [
      "canvas",
      "webgl",
      "audio",
      "fonts",
      "css",
      "timing",
      "webrtc",
    ],
    maxPayloadSize: 51200, // 50KB
    enableClientSideHashing: false,
    batchingEnabled: false,
    batchSize: 1,
    batchTimeout: 0,
  },
};

/**
 * Component importance weights for optimization decisions
 */
const COMPONENT_WEIGHTS = {
  canvas: 0.25,
  webgl: 0.2,
  audio: 0.15,
  fonts: 0.12,
  css: 0.08,
  timing: 0.06,
  webrtc: 0.05,
  sensors: 0.04,
  battery: 0.02,
  mediaDevices: 0.02,
  network: 0.01,
};

export class FingerprintOptimizationService {
  private config: OptimizationConfig;
  private batchQueue: BatchProcessingQueue;
  private processingCallbacks: Array<
    (batch: OptimizedFingerprint[]) => Promise<void>
  >;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...OPTIMIZATION_CONFIGS.balanced, ...config };
    this.batchQueue = {
      fingerprints: [],
      size: 0,
      lastUpdate: Date.now(),
    };
    this.processingCallbacks = [];
  }

  /**
   * Optimize a fingerprint for transmission
   */
  async optimizeFingerprint(
    core: CoreFingerprintData,
    advanced: AdvancedFingerprintData,
    behavioral?: BehavioralData,
    userId?: string
  ): Promise<OptimizedFingerprint> {
    const fingerprintId = this.generateFingerprintId(core);
    const startTime = performance.now();

    try {
      // Step 1: Calculate original size
      const originalData = { core, advanced, behavioral };
      const originalSize = this.calculateDataSize(originalData);

      // Step 2: Apply optimization strategy
      const optimizedCore = await this.optimizeCoreFingerprint(core);
      const optimizedAdvanced = await this.optimizeAdvancedFingerprint(
        advanced
      );
      const optimizedBehavioral = behavioral
        ? await this.optimizeBehavioralData(behavioral)
        : undefined;

      // Step 3: Calculate optimized size and compression ratio
      const optimizedData = {
        core: optimizedCore,
        advanced: optimizedAdvanced,
        behavioral: optimizedBehavioral,
      };
      const optimizedSize = this.calculateDataSize(optimizedData);
      const compressionRatio = (originalSize - optimizedSize) / originalSize;

      const optimizedFingerprint: OptimizedFingerprint = {
        fingerprintId,
        userId,
        optimizedCore,
        optimizedAdvanced,
        optimizedBehavioral,
        metadata: {
          originalSize,
          optimizedSize,
          compressionRatio,
          strategy: this.config.strategy,
          timestamp: Date.now(),
        },
      };

      // Step 4: Handle batching if enabled
      if (this.config.batchingEnabled) {
        await this.addToBatch(optimizedFingerprint);
      }

      console.log("Fingerprint optimization completed", {
        fingerprintId,
        strategy: this.config.strategy,
        originalSize,
        optimizedSize,
        compressionRatio: Math.round(compressionRatio * 100) + "%",
        processingTime: performance.now() - startTime,
      });

      return optimizedFingerprint;
    } catch (error) {
      console.error("Error optimizing fingerprint:", error);
      throw error;
    }
  }

  /**
   * Optimize core fingerprint data
   */
  private async optimizeCoreFingerprint(
    core: CoreFingerprintData
  ): Promise<CoreFingerprintData | OptimizedCoreData> {
    switch (this.config.strategy) {
      case "minimal":
        return this.createMinimalCoreData(core);
      case "balanced":
        return this.createBalancedCoreData(core);
      case "full":
      default:
        return this.applyLightCompression(core);
    }
  }

  /**
   * Create minimal core data for real-time processing
   */
  private createMinimalCoreData(core: CoreFingerprintData): OptimizedCoreData {
    const hashes: Record<string, string> = {};
    const essentials: Record<string, any> = {};

    // Hash non-essential components
    if (core.canvas) {
      hashes.canvas = this.hashData(core.canvas);
    }

    if (core.webgl) {
      essentials.webgl = {
        vendor: core.webgl.vendor,
        renderer: core.webgl.renderer,
      };
      hashes.webglFull = this.hashData(core.webgl);
    }

    if (core.audio) {
      hashes.audio = this.hashData(core.audio);
    }

    if (core.fonts) {
      // Keep only top fonts for minimal
      essentials.fonts = {
        systemFonts: core.fonts.systemFonts?.slice(0, 10) || [],
        webFonts: core.fonts.webFonts?.slice(0, 5) || [],
      };
      hashes.fontsFull = this.hashData(core.fonts);
    }

    if (core.css) {
      hashes.css = this.hashData(core.css);
    }

    if (core.timing) {
      hashes.timing = this.hashData(core.timing);
    }

    return {
      hashes,
      essentials,
      compressed: {},
    };
  }

  /**
   * Create balanced core data for normal processing
   */
  private createBalancedCoreData(
    core: CoreFingerprintData
  ): CoreFingerprintData {
    const balanced = { ...core };

    // Apply selective compression to large components
    if (balanced.fonts && this.config.compressionLevel !== "none") {
      balanced.fonts = {
        ...balanced.fonts,
        systemFonts: balanced.fonts.systemFonts?.slice(0, 50) || [],
        webFonts: balanced.fonts.webFonts?.slice(0, 20) || [],
      };
    }

    // Compress CSS data
    if (balanced.css && this.config.compressionLevel === "aggressive") {
      balanced.css = {
        ...balanced.css,
        mediaQueries: this.compressObject(balanced.css.mediaQueries, 20),
        supportedFeatures: balanced.css.supportedFeatures?.slice(0, 30) || [],
      };
    }

    return balanced;
  }

  /**
   * Apply light compression to preserve most data
   */
  private applyLightCompression(
    core: CoreFingerprintData
  ): CoreFingerprintData {
    const compressed = { ...core };

    // Only apply minimal compression to very large arrays
    if (
      compressed.fonts?.systemFonts &&
      compressed.fonts.systemFonts.length > 200
    ) {
      compressed.fonts.systemFonts = compressed.fonts.systemFonts.slice(0, 200);
    }

    return compressed;
  }

  /**
   * Optimize advanced fingerprint data
   */
  private async optimizeAdvancedFingerprint(
    advanced: AdvancedFingerprintData
  ): Promise<AdvancedFingerprintData | OptimizedAdvancedData> {
    switch (this.config.strategy) {
      case "minimal":
        return this.createMinimalAdvancedData(advanced);
      case "balanced":
        return this.createBalancedAdvancedData(advanced);
      case "full":
      default:
        return advanced;
    }
  }

  /**
   * Create minimal advanced data
   */
  private createMinimalAdvancedData(
    advanced: AdvancedFingerprintData
  ): OptimizedAdvancedData {
    const hashes: Record<string, string> = {};
    const summaries: Record<string, any> = {};
    const selected: Record<string, any> = {};

    // Keep only essential advanced components
    if (advanced.webrtc) {
      selected.webrtc = {
        localIPs: advanced.webrtc.localIPs?.slice(0, 3) || [],
        stunResponses: {}, // Remove large STUN data
      };
      hashes.webrtcFull = this.hashData(advanced.webrtc);
    }

    if (advanced.sensors) {
      summaries.sensors = {
        accelerometer: advanced.sensors.accelerometer?.available || false,
        gyroscope: advanced.sensors.gyroscope?.available || false,
        magnetometer: advanced.sensors.magnetometer?.available || false,
      };
      hashes.sensorsFull = this.hashData(advanced.sensors);
    }

    // Hash all other components
    Object.keys(advanced).forEach((key) => {
      if (
        !selected[key] &&
        !summaries[key] &&
        advanced[key as keyof AdvancedFingerprintData]
      ) {
        hashes[key] = this.hashData(
          advanced[key as keyof AdvancedFingerprintData]
        );
      }
    });

    return { hashes, summaries, selected };
  }

  /**
   * Create balanced advanced data
   */
  private createBalancedAdvancedData(
    advanced: AdvancedFingerprintData
  ): AdvancedFingerprintData {
    const balanced = { ...advanced };

    // Apply selective optimization to large components
    if (balanced.network && this.config.compressionLevel !== "none") {
      balanced.network = {
        ...balanced.network,
        endpoints: balanced.network.endpoints?.slice(0, 5) || [],
      };
    }

    if (balanced.plugins && this.config.compressionLevel === "aggressive") {
      balanced.plugins = {
        ...balanced.plugins,
        extensions: balanced.plugins.extensions?.slice(0, 20) || [],
        plugins: balanced.plugins.plugins?.slice(0, 10) || [],
      };
    }

    return balanced;
  }

  /**
   * Optimize behavioral data
   */
  private async optimizeBehavioralData(
    behavioral: BehavioralData
  ): Promise<BehavioralData | OptimizedBehavioralData> {
    if (this.config.strategy === "minimal") {
      return {
        statistics: {
          mouseEntropy: behavioral.mouseMovements?.entropy || 0,
          typingSpeed: behavioral.keyboardPatterns?.typingSpeed || 0,
          touchPoints: behavioral.touchBehavior?.touchPoints || 0,
        },
        patterns: ["summarized"],
        confidence: 0.8,
      };
    }

    if (this.config.strategy === "balanced") {
      return {
        ...behavioral,
        mouseMovements: {
          ...behavioral.mouseMovements,
          velocity: behavioral.mouseMovements?.velocity?.slice(0, 50) || [],
          acceleration:
            behavioral.mouseMovements?.acceleration?.slice(0, 50) || [],
        },
        keyboardPatterns: {
          ...behavioral.keyboardPatterns,
          dwellTimes:
            behavioral.keyboardPatterns?.dwellTimes?.slice(0, 20) || [],
          flightTimes:
            behavioral.keyboardPatterns?.flightTimes?.slice(0, 20) || [],
        },
      };
    }

    return behavioral;
  }

  /**
   * Add fingerprint to batch processing queue
   */
  private async addToBatch(fingerprint: OptimizedFingerprint): Promise<void> {
    this.batchQueue.fingerprints.push(fingerprint);
    this.batchQueue.size += fingerprint.metadata.optimizedSize;
    this.batchQueue.lastUpdate = Date.now();

    // Clear existing timeout
    if (this.batchQueue.timeoutId) {
      clearTimeout(this.batchQueue.timeoutId);
    }

    // Check if batch is ready for processing
    if (this.shouldProcessBatch()) {
      await this.processBatch();
    } else {
      // Set timeout for batch processing
      this.batchQueue.timeoutId = setTimeout(() => {
        this.processBatch();
      }, this.config.batchTimeout) as any;
    }
  }

  /**
   * Check if batch should be processed
   */
  private shouldProcessBatch(): boolean {
    return (
      this.batchQueue.fingerprints.length >= this.config.batchSize ||
      this.batchQueue.size >= this.config.maxPayloadSize ||
      Date.now() - this.batchQueue.lastUpdate >= this.config.batchTimeout
    );
  }

  /**
   * Process current batch
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.fingerprints.length === 0) return;

    const batch = [...this.batchQueue.fingerprints];

    // Clear batch queue
    this.batchQueue.fingerprints = [];
    this.batchQueue.size = 0;
    this.batchQueue.lastUpdate = Date.now();

    if (this.batchQueue.timeoutId) {
      clearTimeout(this.batchQueue.timeoutId);
      this.batchQueue.timeoutId = undefined;
    }

    console.log(`Processing fingerprint batch of ${batch.length} items`);

    // Call all registered processing callbacks
    const processPromises = this.processingCallbacks.map((callback) =>
      callback(batch).catch((error) => {
        console.error("Error in batch processing callback:", error);
      })
    );

    await Promise.allSettled(processPromises);
  }

  /**
   * Register a callback for batch processing
   */
  onBatchReady(
    callback: (batch: OptimizedFingerprint[]) => Promise<void>
  ): void {
    this.processingCallbacks.push(callback);
  }

  /**
   * Force process current batch
   */
  async flushBatch(): Promise<void> {
    if (this.batchQueue.fingerprints.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current batch status
   */
  getBatchStatus(): {
    queueLength: number;
    queueSize: number;
    lastUpdate: number;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.batchQueue.fingerprints.length,
      queueSize: this.batchQueue.size,
      lastUpdate: this.batchQueue.lastUpdate,
      isProcessing: !!this.batchQueue.timeoutId,
    };
  }

  /**
   * Helper methods
   */
  private generateFingerprintId(core: CoreFingerprintData): string {
    const hashInput = [
      core.canvas,
      core.webgl?.vendor,
      core.webgl?.renderer,
      core.audio?.contextHash,
    ].join("|");

    return btoa(hashInput).substring(0, 16) + "-" + Date.now().toString(36);
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private hashData(data: any): string {
    const str = JSON.stringify(data);
    return btoa(str).substring(0, 16);
  }

  private compressObject(
    obj: Record<string, any>,
    maxKeys: number
  ): Record<string, any> {
    const keys = Object.keys(obj);
    if (keys.length <= maxKeys) return obj;

    const compressed: Record<string, any> = {};
    const selectedKeys = keys.slice(0, maxKeys);

    selectedKeys.forEach((key) => {
      compressed[key] = obj[key];
    });

    compressed._compressed = true;
    compressed._originalSize = keys.length;

    return compressed;
  }
}

// Export default optimization service instance
export const fingerprintOptimizationService =
  new FingerprintOptimizationService();

// Export optimization presets
export const OptimizationPresets = {
  realtime: () =>
    new FingerprintOptimizationService(OPTIMIZATION_CONFIGS.realtime),
  balanced: () =>
    new FingerprintOptimizationService(OPTIMIZATION_CONFIGS.balanced),
  comprehensive: () =>
    new FingerprintOptimizationService(OPTIMIZATION_CONFIGS.comprehensive),
};
