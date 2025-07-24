/**
 * Battery API Fingerprinting Module
 *
 * Collects detailed battery characteristics for device identification:
 * - Power consumption patterns and charging behavior
 * - Hardware-specific battery signatures and aging indicators
 * - Timing precision and update frequency patterns
 * - Privacy tool detection and masking analysis
 * - Battery health estimation and cycle count inference
 */

import type { BatteryFingerprint } from "@/types/fingerprint";
import { calculateSHA256 } from "@/lib/fingerprint/utils";

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface BatteryEvent extends Event {
  target: BatteryManager;
}

interface BatterySample {
  timestamp: number;
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

interface PowerProfile {
  dischargeRate: number;
  chargeRate: number;
  voltageStability: number;
  temperaturePattern: string;
}

interface TimingAnalysis {
  updateFrequency: number;
  precisionLevel: number;
  eventIntervals: number[];
  jitterPattern: string;
}

/**
 * Advanced battery fingerprinting with power consumption analysis
 */
export class BatteryFingerprinting {
  private samples: BatterySample[] = [];
  private eventTimings: number[] = [];
  private lastUpdateTime: number = 0;
  private batteryManager: BatteryManager | null = null;
  private samplingActive: boolean = false;
  private readonly SAMPLING_DURATION = 3000; // 3 seconds
  private readonly MAX_SAMPLES = 100;

  /**
   * Collect comprehensive battery fingerprint
   */
  async collectFingerprint(): Promise<BatteryFingerprint> {
    const startTime = performance.now();
    let errorCount = 0;

    try {
      // Check if Battery API is available
      if (!this.isBatteryAPIAvailable()) {
        return this.createUnavailableFingerprint(startTime, errorCount);
      }

      // Get battery manager
      this.batteryManager = await this.getBatteryManager();
      if (!this.batteryManager) {
        errorCount++;
        return this.createUnavailableFingerprint(startTime, errorCount);
      }

      // Collect battery samples over time
      const samplingResults = await this.collectBatterySamples();
      errorCount += samplingResults.errorCount;

      // Analyze power characteristics
      const powerProfile = this.analyzePowerProfile();

      // Extract hardware signatures
      const hardwareSignature = this.extractHardwareSignature();

      // Analyze timing patterns
      const timingPatterns = this.analyzeTimingPatterns();

      // Detect privacy masking
      const privacyMasking = this.detectPrivacyMasking();

      // Calculate unique hash and confidence
      const batteryHash = await this.calculateBatteryHash(
        powerProfile,
        hardwareSignature,
        timingPatterns
      );

      const stabilityScore = this.calculateStabilityScore();
      const confidenceLevel = this.calculateConfidenceLevel();

      const collectionTime = performance.now() - startTime;

      return {
        available: true,
        level: this.batteryManager.level,
        charging: this.batteryManager.charging,
        chargingTime: this.batteryManager.chargingTime,
        dischargingTime: this.batteryManager.dischargingTime,
        powerProfile,
        hardwareSignature,
        timingPatterns,
        privacyMasking,
        batteryHash,
        stabilityScore,
        confidenceLevel,
        collectionTime,
        samplingDuration: this.SAMPLING_DURATION,
        errorCount,
      };
    } catch (error) {
      errorCount++;
      return this.createUnavailableFingerprint(startTime, errorCount);
    }
  }

  /**
   * Check if Battery API is available
   */
  private isBatteryAPIAvailable(): boolean {
    return (
      typeof navigator !== "undefined" &&
      ("getBattery" in navigator || "battery" in navigator)
    );
  }

  /**
   * Get battery manager with fallback methods
   */
  private async getBatteryManager(): Promise<BatteryManager | null> {
    try {
      // Modern approach
      if ("getBattery" in navigator) {
        return await (navigator as any).getBattery();
      }

      // Legacy approach
      if ("battery" in navigator) {
        return (navigator as any).battery;
      }

      // Webkit approach
      if ("webkitBattery" in navigator) {
        return (navigator as any).webkitBattery;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Collect battery samples over time for analysis
   */
  private async collectBatterySamples(): Promise<{ errorCount: number }> {
    let errorCount = 0;
    this.samples = [];
    this.eventTimings = [];
    this.samplingActive = true;

    if (!this.batteryManager) {
      return { errorCount: 1 };
    }

    try {
      // Set up event listeners for battery changes
      const eventHandler = (event: Event) => {
        if (!this.samplingActive) return;

        const now = performance.now();
        this.eventTimings.push(now);

        if (this.batteryManager) {
          this.addBatterySample();
        }
      };

      // Add event listeners
      this.batteryManager.addEventListener("chargingchange", eventHandler);
      this.batteryManager.addEventListener("levelchange", eventHandler);
      this.batteryManager.addEventListener("chargingtimechange", eventHandler);
      this.batteryManager.addEventListener(
        "dischargingtimechange",
        eventHandler
      );

      // Initial sample
      this.addBatterySample();

      // Collect samples at regular intervals
      const sampleInterval = setInterval(() => {
        if (!this.samplingActive) {
          clearInterval(sampleInterval);
          return;
        }
        this.addBatterySample();
      }, 100); // Sample every 100ms

      // Wait for sampling duration
      await new Promise((resolve) =>
        setTimeout(resolve, this.SAMPLING_DURATION)
      );

      // Stop sampling
      this.samplingActive = false;
      clearInterval(sampleInterval);

      // Remove event listeners
      this.batteryManager.removeEventListener("chargingchange", eventHandler);
      this.batteryManager.removeEventListener("levelchange", eventHandler);
      this.batteryManager.removeEventListener(
        "chargingtimechange",
        eventHandler
      );
      this.batteryManager.removeEventListener(
        "dischargingtimechange",
        eventHandler
      );
    } catch (error) {
      errorCount++;
      this.samplingActive = false;
    }

    return { errorCount };
  }

  /**
   * Add a battery sample
   */
  private addBatterySample(): void {
    if (!this.batteryManager || this.samples.length >= this.MAX_SAMPLES) {
      return;
    }

    try {
      const sample: BatterySample = {
        timestamp: performance.now(),
        level: this.batteryManager.level,
        charging: this.batteryManager.charging,
        chargingTime: this.batteryManager.chargingTime,
        dischargingTime: this.batteryManager.dischargingTime,
      };

      this.samples.push(sample);
    } catch (error) {
      // Ignore sampling errors
    }
  }

  /**
   * Analyze power consumption and charging patterns
   */
  private analyzePowerProfile(): PowerProfile {
    if (this.samples.length < 2) {
      return {
        dischargeRate: 0,
        chargeRate: 0,
        voltageStability: 0,
        temperaturePattern: "insufficient_data",
      };
    }

    try {
      let dischargeRate = 0;
      let chargeRate = 0;
      let dischargeSamples = 0;
      let chargeSamples = 0;

      // Calculate discharge and charge rates
      for (let i = 1; i < this.samples.length; i++) {
        const current = this.samples[i];
        const previous = this.samples[i - 1];
        const timeDiff = (current.timestamp - previous.timestamp) / 1000; // seconds

        if (timeDiff > 0 && Math.abs(current.level - previous.level) > 0) {
          const levelChange = current.level - previous.level;
          const rate = Math.abs(levelChange) / timeDiff;

          if (current.charging && levelChange > 0) {
            chargeRate += rate;
            chargeSamples++;
          } else if (!current.charging && levelChange < 0) {
            dischargeRate += rate;
            dischargeSamples++;
          }
        }
      }

      // Average rates
      dischargeRate =
        dischargeSamples > 0 ? dischargeRate / dischargeSamples : 0;
      chargeRate = chargeSamples > 0 ? chargeRate / chargeSamples : 0;

      // Calculate voltage stability (based on timing consistency)
      const voltageStability = this.calculateVoltageStability();

      // Generate temperature pattern signature
      const temperaturePattern = this.generateTemperaturePattern();

      return {
        dischargeRate: Math.round(dischargeRate * 10000) / 10000,
        chargeRate: Math.round(chargeRate * 10000) / 10000,
        voltageStability: Math.round(voltageStability * 100) / 100,
        temperaturePattern,
      };
    } catch (error) {
      return {
        dischargeRate: 0,
        chargeRate: 0,
        voltageStability: 0,
        temperaturePattern: "error",
      };
    }
  }

  /**
   * Calculate voltage stability based on timing patterns
   */
  private calculateVoltageStability(): number {
    if (this.samples.length < 10) return 0;

    try {
      const intervals: number[] = [];
      for (let i = 1; i < this.samples.length; i++) {
        const interval =
          this.samples[i].timestamp - this.samples[i - 1].timestamp;
        intervals.push(interval);
      }

      // Calculate coefficient of variation
      const mean =
        intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const variance =
        intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        intervals.length;
      const stdDev = Math.sqrt(variance);

      return mean > 0 ? 1 - stdDev / mean : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Generate temperature pattern signature
   */
  private generateTemperaturePattern(): string {
    if (this.samples.length < 5) return "insufficient";

    try {
      // Analyze charging/discharging patterns as temperature indicators
      let pattern = "";
      let chargingChanges = 0;
      let levelVariations = 0;

      for (let i = 1; i < this.samples.length; i++) {
        const current = this.samples[i];
        const previous = this.samples[i - 1];

        if (current.charging !== previous.charging) {
          chargingChanges++;
        }

        if (Math.abs(current.level - previous.level) > 0.001) {
          levelVariations++;
        }
      }

      // Create pattern signature
      pattern += chargingChanges > 2 ? "variable_" : "stable_";
      pattern +=
        levelVariations > this.samples.length * 0.1 ? "dynamic" : "static";

      return pattern;
    } catch (error) {
      return "error";
    }
  }

  /**
   * Extract hardware-specific battery signatures
   */
  private extractHardwareSignature(): BatteryFingerprint["hardwareSignature"] {
    if (!this.batteryManager || this.samples.length < 2) {
      return {
        capacityEstimate: undefined,
        ageIndicator: undefined,
        cycleCount: undefined,
        healthStatus: "unknown",
      };
    }

    try {
      // Estimate capacity based on charge/discharge behavior
      const capacityEstimate = this.estimateBatteryCapacity();

      // Calculate age indicator based on performance characteristics
      const ageIndicator = this.calculateAgeIndicator();

      // Estimate cycle count based on usage patterns
      const cycleCount = this.estimateCycleCount();

      // Determine health status
      const healthStatus = this.determineHealthStatus(
        capacityEstimate,
        ageIndicator
      );

      return {
        capacityEstimate: Math.round(capacityEstimate),
        ageIndicator: Math.round(ageIndicator * 100) / 100,
        cycleCount: Math.round(cycleCount),
        healthStatus,
      };
    } catch (error) {
      return {
        capacityEstimate: undefined,
        ageIndicator: undefined,
        cycleCount: undefined,
        healthStatus: "error",
      };
    }
  }

  /**
   * Estimate battery capacity
   */
  private estimateBatteryCapacity(): number {
    // Analyze charging time vs level changes
    const chargingSamples = this.samples.filter((s) => s.charging);

    if (chargingSamples.length < 2) return 3000; // Default estimate

    // Calculate average charging efficiency
    let totalLevelChange = 0;
    let totalTime = 0;

    for (let i = 1; i < chargingSamples.length; i++) {
      const levelChange =
        chargingSamples[i].level - chargingSamples[i - 1].level;
      const timeChange =
        chargingSamples[i].timestamp - chargingSamples[i - 1].timestamp;

      if (levelChange > 0 && timeChange > 0) {
        totalLevelChange += levelChange;
        totalTime += timeChange / 1000; // Convert to seconds
      }
    }

    if (totalLevelChange > 0 && totalTime > 0) {
      const chargeRate = totalLevelChange / totalTime;
      // Estimate capacity based on charge rate (rough approximation)
      return Math.max(1000, Math.min(10000, 3600 / chargeRate));
    }

    return 3000; // Default capacity estimate in mAh
  }

  /**
   * Calculate battery age indicator
   */
  private calculateAgeIndicator(): number {
    // Analyze voltage stability and charge efficiency
    const voltageStability = this.calculateVoltageStability();
    const chargeEfficiency = this.calculateChargeEfficiency();

    // Age is inversely related to stability and efficiency
    return Math.max(
      0,
      Math.min(1, 1 - (voltageStability + chargeEfficiency) / 2)
    );
  }

  /**
   * Calculate charge efficiency
   */
  private calculateChargeEfficiency(): number {
    const chargingSamples = this.samples.filter((s) => s.charging);

    if (chargingSamples.length < 2) return 0.8; // Default efficiency

    let totalEfficiency = 0;
    let measurements = 0;

    for (let i = 1; i < chargingSamples.length; i++) {
      const levelChange =
        chargingSamples[i].level - chargingSamples[i - 1].level;
      const timeChange =
        chargingSamples[i].timestamp - chargingSamples[i - 1].timestamp;

      if (levelChange > 0 && timeChange > 0) {
        // Efficiency based on level change rate
        const efficiency = Math.min(1, levelChange / (timeChange / 10000));
        totalEfficiency += efficiency;
        measurements++;
      }
    }

    return measurements > 0 ? totalEfficiency / measurements : 0.8;
  }

  /**
   * Estimate cycle count
   */
  private estimateCycleCount(): number {
    // Estimate based on age indicator and usage patterns
    const ageIndicator = this.calculateAgeIndicator();
    const usageIntensity = this.calculateUsageIntensity();

    // Rough estimation: newer batteries have fewer cycles
    return Math.round(ageIndicator * 1000 + usageIntensity * 500);
  }

  /**
   * Calculate usage intensity
   */
  private calculateUsageIntensity(): number {
    const levelChanges = this.samples.filter(
      (s, i) => i > 0 && Math.abs(s.level - this.samples[i - 1].level) > 0.001
    ).length;

    return Math.min(1, levelChanges / this.samples.length);
  }

  /**
   * Determine health status
   */
  private determineHealthStatus(
    capacityEstimate?: number,
    ageIndicator?: number
  ): string {
    if (!capacityEstimate || !ageIndicator) return "unknown";

    if (ageIndicator < 0.2 && capacityEstimate > 2500) return "excellent";
    if (ageIndicator < 0.4 && capacityEstimate > 2000) return "good";
    if (ageIndicator < 0.6 && capacityEstimate > 1500) return "fair";
    if (ageIndicator < 0.8) return "poor";
    return "degraded";
  }

  /**
   * Analyze timing patterns for precision and frequency
   */
  private analyzeTimingPatterns(): TimingAnalysis {
    if (this.eventTimings.length < 2) {
      return {
        updateFrequency: 0,
        precisionLevel: 0,
        eventIntervals: [],
        jitterPattern: "no_events",
      };
    }

    try {
      // Calculate update frequency
      const totalTime =
        this.eventTimings[this.eventTimings.length - 1] - this.eventTimings[0];
      const updateFrequency = this.eventTimings.length / (totalTime / 1000);

      // Calculate intervals between events
      const intervals: number[] = [];
      for (let i = 1; i < this.eventTimings.length; i++) {
        intervals.push(this.eventTimings[i] - this.eventTimings[i - 1]);
      }

      // Calculate precision level (consistency of intervals)
      const precisionLevel = this.calculatePrecisionLevel(intervals);

      // Generate jitter pattern
      const jitterPattern = this.generateJitterPattern(intervals);

      return {
        updateFrequency: Math.round(updateFrequency * 100) / 100,
        precisionLevel: Math.round(precisionLevel * 1000) / 1000,
        eventIntervals: intervals.slice(0, 10), // Limit to first 10 intervals
        jitterPattern,
      };
    } catch (error) {
      return {
        updateFrequency: 0,
        precisionLevel: 0,
        eventIntervals: [],
        jitterPattern: "error",
      };
    }
  }

  /**
   * Calculate precision level of timing intervals
   */
  private calculatePrecisionLevel(intervals: number[]): number {
    if (intervals.length < 2) return 0;

    const mean =
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? Math.max(0, 1 - stdDev / mean) : 0;
  }

  /**
   * Generate jitter pattern signature
   */
  private generateJitterPattern(intervals: number[]): string {
    if (intervals.length < 3) return "insufficient";

    try {
      const mean =
        intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const jitters = intervals.map((interval) => Math.abs(interval - mean));
      const maxJitter = Math.max(...jitters);
      const avgJitter =
        jitters.reduce((sum, val) => sum + val, 0) / jitters.length;

      let pattern = "";
      pattern += maxJitter < 10 ? "low_" : maxJitter < 50 ? "medium_" : "high_";
      pattern +=
        avgJitter < 5 ? "stable" : avgJitter < 20 ? "variable" : "chaotic";

      return pattern;
    } catch (error) {
      return "error";
    }
  }

  /**
   * Detect privacy masking and artificial values
   */
  private detectPrivacyMasking(): BatteryFingerprint["privacyMasking"] {
    if (!this.batteryManager) {
      return {
        levelMasked: false,
        timingMasked: false,
        artificialValues: false,
      };
    }

    try {
      // Check for level masking (rounded values, static values)
      const levelMasked = this.detectLevelMasking();

      // Check for timing masking (artificial intervals)
      const timingMasked = this.detectTimingMasking();

      // Check for artificial values (suspicious patterns)
      const artificialValues = this.detectArtificialValues();

      return {
        levelMasked,
        timingMasked,
        artificialValues,
      };
    } catch (error) {
      return {
        levelMasked: false,
        timingMasked: false,
        artificialValues: false,
      };
    }
  }

  /**
   * Detect if battery level is being masked
   */
  private detectLevelMasking(): boolean {
    if (this.samples.length < 5) return false;

    // Check for suspiciously round values
    const roundValues = this.samples.filter(
      (s) => s.level === Math.round(s.level * 10) / 10
    ).length;

    // Check for static values (no change over time)
    const uniqueLevels = new Set(this.samples.map((s) => s.level)).size;

    return (
      roundValues / this.samples.length > 0.9 ||
      (uniqueLevels === 1 && this.samples.length > 10)
    );
  }

  /**
   * Detect if timing is being masked
   */
  private detectTimingMasking(): boolean {
    if (this.eventTimings.length < 3) return false;

    const intervals: number[] = [];
    for (let i = 1; i < this.eventTimings.length; i++) {
      intervals.push(this.eventTimings[i] - this.eventTimings[i - 1]);
    }

    // Check for artificially regular intervals
    const uniqueIntervals = new Set(
      intervals.map((i) => Math.round(i / 100) * 100)
    ).size;

    return uniqueIntervals === 1 && intervals.length > 2;
  }

  /**
   * Detect artificial values
   */
  private detectArtificialValues(): boolean {
    if (!this.batteryManager) return false;

    // Check for suspicious charging/discharging times
    const suspiciousChargingTime =
      this.batteryManager.chargingTime === Infinity ||
      this.batteryManager.chargingTime < 0;
    const suspiciousDischargingTime =
      this.batteryManager.dischargingTime === Infinity ||
      this.batteryManager.dischargingTime < 0;

    // Check for impossible level values
    const impossibleLevel =
      this.batteryManager.level < 0 || this.batteryManager.level > 1;

    return (
      suspiciousChargingTime && suspiciousDischargingTime && !impossibleLevel
    );
  }

  /**
   * Calculate unique battery hash
   */
  private async calculateBatteryHash(
    powerProfile: PowerProfile,
    hardwareSignature: BatteryFingerprint["hardwareSignature"],
    timingPatterns: TimingAnalysis
  ): Promise<string> {
    try {
      const hashData = {
        powerProfile,
        hardwareSignature,
        timingPatterns: {
          updateFrequency: Math.round(timingPatterns.updateFrequency * 100),
          precisionLevel: Math.round(timingPatterns.precisionLevel * 1000),
          jitterPattern: timingPatterns.jitterPattern,
        },
      };

      return await calculateSHA256(JSON.stringify(hashData));
    } catch (error) {
      return "hash_error";
    }
  }

  /**
   * Calculate stability score
   */
  private calculateStabilityScore(): number {
    if (this.samples.length < 2) return 0;

    try {
      let stabilityFactors = 0;
      let totalFactors = 0;

      // Level stability
      const levelChanges = this.samples.filter(
        (s, i) => i > 0 && Math.abs(s.level - this.samples[i - 1].level) > 0.001
      ).length;
      stabilityFactors += 1 - levelChanges / this.samples.length;
      totalFactors++;

      // Timing stability
      if (this.eventTimings.length > 1) {
        const timingStability = this.calculatePrecisionLevel(
          this.eventTimings.slice(1).map((t, i) => t - this.eventTimings[i])
        );
        stabilityFactors += timingStability;
        totalFactors++;
      }

      // Voltage stability (calculated earlier)
      const voltageStability = this.calculateVoltageStability();
      stabilityFactors += voltageStability;
      totalFactors++;

      return totalFactors > 0
        ? Math.round((stabilityFactors / totalFactors) * 100) / 100
        : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidenceLevel(): number {
    let confidence = 0;
    let factors = 0;

    // Sample count factor
    confidence += Math.min(1, this.samples.length / 20);
    factors++;

    // Event timing factor
    confidence += Math.min(1, this.eventTimings.length / 10);
    factors++;

    // API availability factor
    confidence += this.batteryManager ? 1 : 0;
    factors++;

    // Data quality factor
    const hasValidData = this.samples.some(
      (s) => s.level >= 0 && s.level <= 1 && typeof s.charging === "boolean"
    );
    confidence += hasValidData ? 1 : 0;
    factors++;

    return factors > 0 ? Math.round((confidence / factors) * 100) / 100 : 0;
  }

  /**
   * Create unavailable fingerprint
   */
  private createUnavailableFingerprint(
    startTime: number,
    errorCount: number
  ): BatteryFingerprint {
    return {
      available: false,
      powerProfile: {
        dischargeRate: 0,
        chargeRate: 0,
        voltageStability: 0,
        temperaturePattern: "unavailable",
      },
      hardwareSignature: {
        healthStatus: "unavailable",
      },
      timingPatterns: {
        updateFrequency: 0,
        precisionLevel: 0,
        eventIntervals: [],
        jitterPattern: "unavailable",
      },
      privacyMasking: {
        levelMasked: false,
        timingMasked: false,
        artificialValues: false,
      },
      batteryHash: "unavailable",
      stabilityScore: 0,
      confidenceLevel: 0,
      collectionTime: performance.now() - startTime,
      samplingDuration: 0,
      errorCount,
    };
  }
}

/**
 * Collect battery fingerprint
 */
export async function collectBatteryFingerprint(): Promise<BatteryFingerprint> {
  const fingerprinter = new BatteryFingerprinting();
  return await fingerprinter.collectFingerprint();
}
