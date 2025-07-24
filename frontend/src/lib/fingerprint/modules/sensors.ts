/**
 * Device Sensor Fingerprinting Module
 *
 * Collects detailed sensor information for device identification:
 * - Accelerometer, gyroscope, and magnetometer readings and characteristics
 * - Device motion and orientation event analysis
 * - Sensor noise patterns, precision, and calibration signatures
 * - Hardware vendor detection from sensor behavior
 * - Cross-sensor correlation and stability analysis
 * - Privacy tool and spoofing detection
 */

import type {
  DeviceSensorFingerprint,
  SensorReading,
  SensorCharacteristics,
  SensorCalibration,
} from "@/types/fingerprint";
import { calculateSHA256 } from "@/lib/fingerprint/utils";

interface SensorEventData {
  acceleration?: { x: number; y: number; z: number };
  accelerationIncludingGravity?: { x: number; y: number; z: number };
  rotationRate?: { alpha: number; beta: number; gamma: number };
  interval: number;
  timestamp: number;
}

interface OrientationEventData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
  timestamp: number;
}

/**
 * Advanced device sensor fingerprinting with comprehensive analysis
 */
export class DeviceSensorFingerprinting {
  private accelerometerReadings: SensorReading[] = [];
  private gyroscopeReadings: SensorReading[] = [];
  private magnetometerReadings: SensorReading[] = [];
  private motionEvents: SensorEventData[] = [];
  private orientationEvents: OrientationEventData[] = [];
  private permissionStates: Record<string, string> = {};

  private readonly SAMPLING_DURATION = 3000; // 3 seconds
  private readonly MAX_READINGS = 100;
  private readonly MOTION_THRESHOLD = 0.1; // Minimum motion to detect

  private motionListener?: (event: DeviceMotionEvent) => void;
  private orientationListener?: (event: DeviceOrientationEvent) => void;
  private samplingActive: boolean = false;

  /**
   * Collect comprehensive device sensor fingerprint
   */
  async collectFingerprint(): Promise<DeviceSensorFingerprint> {
    const startTime = performance.now();
    let errorCount = 0;

    try {
      // Check sensor API availability
      if (!this.isSensorAPIAvailable()) {
        return this.createUnavailableFingerprint(startTime, errorCount);
      }

      // Check permissions
      const permissionResults = await this.checkPermissions();
      errorCount += permissionResults.errorCount;

      // Try Generic Sensor API first (if available)
      const genericSensorResults = await this.collectGenericSensorData();
      errorCount += genericSensorResults.errorCount;

      // Collect motion and orientation events
      const motionResults = await this.collectMotionOrientationData();
      errorCount += motionResults.errorCount;

      // Analyze sensor characteristics
      const accelerometer = this.analyzeSensorCharacteristics("accelerometer");
      const gyroscope = this.analyzeSensorCharacteristics("gyroscope");
      const magnetometer = this.analyzeSensorCharacteristics("magnetometer");

      // Analyze device motion/orientation capabilities
      const deviceMotion = this.analyzeDeviceMotion();
      const deviceOrientation = this.analyzeDeviceOrientation();

      // Extract hardware signatures
      const hardwareSignature = this.extractHardwareSignature();

      // Calculate cross-sensor correlation
      const correlation = this.calculateSensorCorrelation();

      // Detect privacy indicators
      const privacyIndicators = this.detectPrivacyIndicators();

      // Calculate unique hashes and confidence
      const sensorHash = await this.calculateSensorHash();
      const hardwareHash = await this.calculateHardwareHash(hardwareSignature);
      const confidenceLevel = this.calculateConfidenceLevel();

      const collectionTime = performance.now() - startTime;

      return {
        available: true,
        accelerometer,
        gyroscope,
        magnetometer,
        deviceMotion,
        deviceOrientation,
        hardwareSignature,
        permissions: this.formatPermissions(),
        correlation,
        privacyIndicators,
        sensorHash,
        hardwareHash,
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
   * Check if sensor APIs are available
   */
  private isSensorAPIAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      (typeof DeviceMotionEvent !== "undefined" ||
        typeof DeviceOrientationEvent !== "undefined" ||
        "Accelerometer" in window ||
        "Gyroscope" in window ||
        "Magnetometer" in window)
    );
  }

  /**
   * Check sensor permissions
   */
  private async checkPermissions(): Promise<{ errorCount: number }> {
    let errorCount = 0;
    this.permissionStates = {};

    try {
      if ("permissions" in navigator && navigator.permissions.query) {
        const sensorPermissions = [
          "accelerometer",
          "gyroscope",
          "magnetometer",
        ];

        for (const permission of sensorPermissions) {
          try {
            const result = await navigator.permissions.query({
              name: permission as PermissionName,
            });
            this.permissionStates[permission] = result.state;
          } catch (error) {
            this.permissionStates[permission] = "unknown";
            errorCount++;
          }
        }

        this.permissionStates.permissionAPI = "true";
      } else {
        this.permissionStates.permissionAPI = "false";
      }
    } catch (error) {
      errorCount++;
      this.permissionStates.permissionAPI = "false";
    }

    return { errorCount };
  }

  /**
   * Collect data using Generic Sensor API
   */
  private async collectGenericSensorData(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    // Try Accelerometer
    try {
      if ("Accelerometer" in window) {
        await this.collectGenericSensorReadings(
          "Accelerometer",
          this.accelerometerReadings
        );
      }
    } catch (error) {
      errorCount++;
    }

    // Try Gyroscope
    try {
      if ("Gyroscope" in window) {
        await this.collectGenericSensorReadings(
          "Gyroscope",
          this.gyroscopeReadings
        );
      }
    } catch (error) {
      errorCount++;
    }

    // Try Magnetometer
    try {
      if ("Magnetometer" in window) {
        await this.collectGenericSensorReadings(
          "Magnetometer",
          this.magnetometerReadings
        );
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Collect readings from a generic sensor
   */
  private async collectGenericSensorReadings(
    sensorType: string,
    readings: SensorReading[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const SensorClass = (window as any)[sensorType];
        const sensor = new SensorClass({ frequency: 60 });

        const startTime = performance.now();
        const timeout = setTimeout(() => {
          try {
            sensor.stop();
          } catch (e) {
            // Ignore stop errors
          }
          resolve();
        }, this.SAMPLING_DURATION);

        sensor.addEventListener("reading", () => {
          if (readings.length >= this.MAX_READINGS) {
            clearTimeout(timeout);
            sensor.stop();
            resolve();
            return;
          }

          readings.push({
            x: sensor.x || 0,
            y: sensor.y || 0,
            z: sensor.z || 0,
            timestamp: performance.now() - startTime,
          });
        });

        sensor.addEventListener("error", (event: Event) => {
          clearTimeout(timeout);
          reject(event);
        });

        sensor.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Collect motion and orientation data using legacy APIs
   */
  private async collectMotionOrientationData(): Promise<{
    errorCount: number;
  }> {
    let errorCount = 0;

    try {
      await this.setupMotionOrientationListeners();

      // Sample for the specified duration
      await new Promise((resolve) =>
        setTimeout(resolve, this.SAMPLING_DURATION)
      );

      this.removeMotionOrientationListeners();
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Setup motion and orientation event listeners
   */
  private async setupMotionOrientationListeners(): Promise<void> {
    this.samplingActive = true;
    this.motionEvents = [];
    this.orientationEvents = [];

    // Request permission for iOS 13+
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== "granted") {
          return;
        }
      } catch (error) {
        // Permission request failed
        return;
      }
    }

    // Device Motion listener
    this.motionListener = (event: DeviceMotionEvent) => {
      if (
        !this.samplingActive ||
        this.motionEvents.length >= this.MAX_READINGS
      ) {
        return;
      }

      this.motionEvents.push({
        acceleration: event.acceleration
          ? {
              x: event.acceleration.x || 0,
              y: event.acceleration.y || 0,
              z: event.acceleration.z || 0,
            }
          : undefined,
        accelerationIncludingGravity: event.accelerationIncludingGravity
          ? {
              x: event.accelerationIncludingGravity.x || 0,
              y: event.accelerationIncludingGravity.y || 0,
              z: event.accelerationIncludingGravity.z || 0,
            }
          : undefined,
        rotationRate: event.rotationRate
          ? {
              alpha: event.rotationRate.alpha || 0,
              beta: event.rotationRate.beta || 0,
              gamma: event.rotationRate.gamma || 0,
            }
          : undefined,
        interval: event.interval || 0,
        timestamp: performance.now(),
      });

      // Convert motion data to sensor readings if Generic API not available
      if (
        this.accelerometerReadings.length === 0 &&
        event.accelerationIncludingGravity
      ) {
        this.accelerometerReadings.push({
          x: event.accelerationIncludingGravity.x || 0,
          y: event.accelerationIncludingGravity.y || 0,
          z: event.accelerationIncludingGravity.z || 0,
          timestamp: performance.now(),
        });
      }

      if (this.gyroscopeReadings.length === 0 && event.rotationRate) {
        this.gyroscopeReadings.push({
          x: event.rotationRate.alpha || 0,
          y: event.rotationRate.beta || 0,
          z: event.rotationRate.gamma || 0,
          timestamp: performance.now(),
        });
      }
    };

    // Device Orientation listener
    this.orientationListener = (event: DeviceOrientationEvent) => {
      if (
        !this.samplingActive ||
        this.orientationEvents.length >= this.MAX_READINGS
      ) {
        return;
      }

      this.orientationEvents.push({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute || false,
        timestamp: performance.now(),
      });
    };

    window.addEventListener("devicemotion", this.motionListener);
    window.addEventListener("deviceorientation", this.orientationListener);
  }

  /**
   * Remove motion and orientation event listeners
   */
  private removeMotionOrientationListeners(): void {
    this.samplingActive = false;

    if (this.motionListener) {
      window.removeEventListener("devicemotion", this.motionListener);
      this.motionListener = undefined;
    }

    if (this.orientationListener) {
      window.removeEventListener("deviceorientation", this.orientationListener);
      this.orientationListener = undefined;
    }
  }

  /**
   * Analyze characteristics of a specific sensor
   */
  private analyzeSensorCharacteristics(
    sensorType: string
  ): SensorCharacteristics {
    let readings: SensorReading[] = [];

    switch (sensorType) {
      case "accelerometer":
        readings = this.accelerometerReadings;
        break;
      case "gyroscope":
        readings = this.gyroscopeReadings;
        break;
      case "magnetometer":
        readings = this.magnetometerReadings;
        break;
    }

    if (readings.length === 0) {
      return this.createUnavailableSensorCharacteristics();
    }

    try {
      // Calculate frequency
      const frequency = this.calculateSensorFrequency(readings);

      // Calculate precision and noise
      const precision = this.calculateSensorPrecision(readings);
      const noiseLevel = this.calculateNoiseLevel(readings);

      // Calculate range and resolution
      const range = this.calculateSensorRange(readings);
      const resolution = this.calculateSensorResolution(readings);

      // Calculate drift rate
      const driftRate = this.calculateDriftRate(readings);

      // Estimate calibration
      const calibration = this.estimateCalibration(readings);

      // Generate patterns
      const patterns = this.generateSensorPatterns(readings);

      return {
        available: true,
        frequency,
        precision,
        range,
        resolution,
        noiseLevel,
        driftRate,
        calibration,
        readings: readings.slice(0, 10), // Limit stored readings for privacy
        patterns,
      };
    } catch (error) {
      return this.createUnavailableSensorCharacteristics();
    }
  }

  /**
   * Calculate sensor frequency from readings
   */
  private calculateSensorFrequency(readings: SensorReading[]): number {
    if (readings.length < 2) return 0;

    const intervals: number[] = [];
    for (let i = 1; i < readings.length; i++) {
      const interval = readings[i].timestamp - readings[i - 1].timestamp;
      if (interval > 0) {
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) return 0;

    const avgInterval =
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    return avgInterval > 0 ? Math.round((1000 / avgInterval) * 100) / 100 : 0;
  }

  /**
   * Calculate sensor precision
   */
  private calculateSensorPrecision(readings: SensorReading[]): number {
    if (readings.length < 2) return 0;

    const xValues = readings.map((r) => r.x);
    const yValues = readings.map((r) => r.y);
    const zValues = readings.map((r) => r.z);

    const xStd = this.calculateStandardDeviation(xValues);
    const yStd = this.calculateStandardDeviation(yValues);
    const zStd = this.calculateStandardDeviation(zValues);

    return Math.round(((xStd + yStd + zStd) / 3) * 1000) / 1000;
  }

  /**
   * Calculate noise level
   */
  private calculateNoiseLevel(readings: SensorReading[]): number {
    if (readings.length < 10) return 0;

    // Calculate high-frequency variations
    let noiseSum = 0;
    let noiseCount = 0;

    for (let i = 2; i < readings.length - 2; i++) {
      const prev = readings[i - 1];
      const curr = readings[i];
      const next = readings[i + 1];

      // Calculate second derivative (acceleration of acceleration)
      const dx = next.x - curr.x - (curr.x - prev.x);
      const dy = next.y - curr.y - (curr.y - prev.y);
      const dz = next.z - curr.z - (curr.z - prev.z);

      noiseSum += Math.sqrt(dx * dx + dy * dy + dz * dz);
      noiseCount++;
    }

    return noiseCount > 0
      ? Math.round((noiseSum / noiseCount) * 1000) / 1000
      : 0;
  }

  /**
   * Calculate sensor range
   */
  private calculateSensorRange(readings: SensorReading[]): number {
    if (readings.length === 0) return 0;

    const allValues = readings.flatMap((r) => [r.x, r.y, r.z]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    return Math.round((max - min) * 1000) / 1000;
  }

  /**
   * Calculate sensor resolution
   */
  private calculateSensorResolution(readings: SensorReading[]): number {
    if (readings.length < 2) return 0;

    // Find smallest non-zero differences
    const differences: number[] = [];

    for (let i = 1; i < readings.length; i++) {
      const dx = Math.abs(readings[i].x - readings[i - 1].x);
      const dy = Math.abs(readings[i].y - readings[i - 1].y);
      const dz = Math.abs(readings[i].z - readings[i - 1].z);

      if (dx > 0) differences.push(dx);
      if (dy > 0) differences.push(dy);
      if (dz > 0) differences.push(dz);
    }

    if (differences.length === 0) return 0;

    // Estimate resolution as minimum significant difference
    differences.sort((a, b) => a - b);
    const minDiff = differences[Math.floor(differences.length * 0.1)]; // 10th percentile

    return Math.round(minDiff * 10000) / 10000;
  }

  /**
   * Calculate drift rate
   */
  private calculateDriftRate(readings: SensorReading[]): number {
    if (readings.length < 10) return 0;

    // Calculate trend in readings over time
    const timeValues = readings.map((r) => r.timestamp);
    const magnitudes = readings.map((r) =>
      Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z)
    );

    const driftSlope = this.calculateLinearRegression(
      timeValues,
      magnitudes
    ).slope;

    return Math.round(Math.abs(driftSlope) * 100000) / 100000;
  }

  /**
   * Estimate sensor calibration
   */
  private estimateCalibration(readings: SensorReading[]): SensorCalibration {
    if (readings.length === 0) {
      return {
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
      };
    }

    // Calculate mean values as offset estimates
    const meanX = readings.reduce((sum, r) => sum + r.x, 0) / readings.length;
    const meanY = readings.reduce((sum, r) => sum + r.y, 0) / readings.length;
    const meanZ = readings.reduce((sum, r) => sum + r.z, 0) / readings.length;

    // Calculate standard deviations as scale estimates
    const stdX = this.calculateStandardDeviation(readings.map((r) => r.x));
    const stdY = this.calculateStandardDeviation(readings.map((r) => r.y));
    const stdZ = this.calculateStandardDeviation(readings.map((r) => r.z));

    return {
      offsetX: Math.round(meanX * 1000) / 1000,
      offsetY: Math.round(meanY * 1000) / 1000,
      offsetZ: Math.round(meanZ * 1000) / 1000,
      scaleX: Math.round((stdX || 1) * 1000) / 1000,
      scaleY: Math.round((stdY || 1) * 1000) / 1000,
      scaleZ: Math.round((stdZ || 1) * 1000) / 1000,
    };
  }

  /**
   * Generate sensor pattern signatures
   */
  private generateSensorPatterns(
    readings: SensorReading[]
  ): SensorCharacteristics["patterns"] {
    if (readings.length < 5) {
      return {
        staticNoise: "insufficient_data",
        dynamicResponse: "insufficient_data",
        temperatureDrift: "insufficient_data",
      };
    }

    try {
      // Static noise pattern (when device should be still)
      const staticNoise = this.analyzeStaticNoise(readings);

      // Dynamic response pattern
      const dynamicResponse = this.analyzeDynamicResponse(readings);

      // Temperature drift pattern
      const temperatureDrift = this.analyzeTemperatureDrift(readings);

      return {
        staticNoise,
        dynamicResponse,
        temperatureDrift,
      };
    } catch (error) {
      return {
        staticNoise: "analysis_error",
        dynamicResponse: "analysis_error",
        temperatureDrift: "analysis_error",
      };
    }
  }

  /**
   * Analyze static noise patterns
   */
  private analyzeStaticNoise(readings: SensorReading[]): string {
    // Identify periods of low motion
    const motionMagnitudes = readings.map((r) =>
      Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z)
    );
    const threshold = this.MOTION_THRESHOLD;

    const stillPeriods = motionMagnitudes.filter((mag) => mag < threshold);

    if (stillPeriods.length < 5) {
      return "high_motion";
    }

    // Analyze noise characteristics in still periods
    const noiseLevel = this.calculateStandardDeviation(stillPeriods);

    if (noiseLevel < 0.01) return "very_low_noise";
    if (noiseLevel < 0.05) return "low_noise";
    if (noiseLevel < 0.1) return "medium_noise";
    return "high_noise";
  }

  /**
   * Analyze dynamic response patterns
   */
  private analyzeDynamicResponse(readings: SensorReading[]): string {
    if (readings.length < 10) return "insufficient_motion";

    // Calculate response time and settling characteristics
    const magnitudes = readings.map((r) =>
      Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z)
    );
    const maxMagnitude = Math.max(...magnitudes);
    const avgMagnitude =
      magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;

    const dynamicRange = maxMagnitude - Math.min(...magnitudes);

    if (dynamicRange < 0.1) return "limited_range";
    if (avgMagnitude / maxMagnitude > 0.8) return "slow_response";
    if (avgMagnitude / maxMagnitude < 0.3) return "fast_response";
    return "normal_response";
  }

  /**
   * Analyze temperature drift patterns
   */
  private analyzeTemperatureDrift(readings: SensorReading[]): string {
    if (readings.length < 20) return "insufficient_time";

    // Look for gradual trends over time
    const timeValues = readings.map((r) => r.timestamp);
    const magnitudes = readings.map((r) =>
      Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z)
    );

    const regression = this.calculateLinearRegression(timeValues, magnitudes);
    const slope = Math.abs(regression.slope);

    if (slope < 0.0001) return "stable";
    if (slope < 0.001) return "low_drift";
    if (slope < 0.01) return "medium_drift";
    return "high_drift";
  }

  /**
   * Analyze device motion capabilities
   */
  private analyzeDeviceMotion(): DeviceSensorFingerprint["deviceMotion"] {
    const hasMotionEvents = this.motionEvents.length > 0;
    const hasAcceleration = this.motionEvents.some((e) => e.acceleration);
    const hasAccelerationIncludingGravity = this.motionEvents.some(
      (e) => e.accelerationIncludingGravity
    );
    const hasRotationRate = this.motionEvents.some((e) => e.rotationRate);

    let avgInterval = 0;
    if (this.motionEvents.length > 0) {
      const intervals = this.motionEvents
        .map((e) => e.interval)
        .filter((i) => i > 0);
      if (intervals.length > 0) {
        avgInterval =
          intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      }
    }

    return {
      supported: hasMotionEvents,
      interval: Math.round(avgInterval),
      accelerationIncludingGravity: hasAccelerationIncludingGravity,
      rotationRate: hasRotationRate,
    };
  }

  /**
   * Analyze device orientation capabilities
   */
  private analyzeDeviceOrientation(): DeviceSensorFingerprint["deviceOrientation"] {
    const hasOrientationEvents = this.orientationEvents.length > 0;
    const hasAbsolute = this.orientationEvents.some((e) => e.absolute);
    const hasCompass = this.orientationEvents.some((e) => e.alpha !== null);

    return {
      supported: hasOrientationEvents,
      absolute: hasAbsolute,
      compassHeading: hasCompass,
    };
  }

  /**
   * Extract hardware signatures from sensor behavior
   */
  private extractHardwareSignature(): DeviceSensorFingerprint["hardwareSignature"] {
    try {
      const vendorFingerprint = this.generateVendorFingerprint();
      const modelSignature = this.generateModelSignature();
      const calibrationSignature = this.generateCalibrationSignature();
      const noiseProfile = this.generateNoiseProfile();

      return {
        vendorFingerprint,
        modelSignature,
        calibrationSignature,
        noiseProfile,
      };
    } catch (error) {
      return {
        vendorFingerprint: "extraction_error",
        modelSignature: "extraction_error",
        calibrationSignature: "extraction_error",
        noiseProfile: "extraction_error",
      };
    }
  }

  /**
   * Generate vendor fingerprint from sensor characteristics
   */
  private generateVendorFingerprint(): string {
    const characteristics = {
      accelerometerFreq: this.calculateSensorFrequency(
        this.accelerometerReadings
      ),
      gyroscopeFreq: this.calculateSensorFrequency(this.gyroscopeReadings),
      motionInterval:
        this.motionEvents.length > 0 ? this.motionEvents[0].interval : 0,
      hasGenericAPI: "Accelerometer" in window,
    };

    // Different vendors have different default frequencies and intervals
    const signature = JSON.stringify(characteristics);
    return Buffer.from(signature).toString("base64").substring(0, 16);
  }

  /**
   * Generate model signature from precision and noise patterns
   */
  private generateModelSignature(): string {
    const precisionFingerprint = {
      accelPrecision: this.calculateSensorPrecision(this.accelerometerReadings),
      gyroPrecision: this.calculateSensorPrecision(this.gyroscopeReadings),
      accelNoise: this.calculateNoiseLevel(this.accelerometerReadings),
      gyroNoise: this.calculateNoiseLevel(this.gyroscopeReadings),
    };

    const signature = JSON.stringify(precisionFingerprint);
    return Buffer.from(signature).toString("base64").substring(0, 16);
  }

  /**
   * Generate calibration signature
   */
  private generateCalibrationSignature(): string {
    const accelCalib = this.estimateCalibration(this.accelerometerReadings);
    const gyroCalib = this.estimateCalibration(this.gyroscopeReadings);

    const calibrationData = {
      accelOffset: [accelCalib.offsetX, accelCalib.offsetY, accelCalib.offsetZ],
      gyroOffset: [gyroCalib.offsetX, gyroCalib.offsetY, gyroCalib.offsetZ],
    };

    const signature = JSON.stringify(calibrationData);
    return Buffer.from(signature).toString("base64").substring(0, 16);
  }

  /**
   * Generate noise profile signature
   */
  private generateNoiseProfile(): string {
    const noiseData = {
      accelStatic: this.analyzeStaticNoise(this.accelerometerReadings),
      gyroStatic: this.analyzeStaticNoise(this.gyroscopeReadings),
      accelDynamic: this.analyzeDynamicResponse(this.accelerometerReadings),
      gyroDynamic: this.analyzeDynamicResponse(this.gyroscopeReadings),
    };

    const signature = JSON.stringify(noiseData);
    return Buffer.from(signature).toString("base64").substring(0, 16);
  }

  /**
   * Calculate cross-sensor correlation
   */
  private calculateSensorCorrelation(): DeviceSensorFingerprint["correlation"] {
    try {
      const accelerometerGyroscope = this.calculateAccelGyroCorrelation();
      const orientationMotion = this.calculateOrientationMotionCorrelation();
      const stabilityScore = this.calculateOverallStabilityScore();

      return {
        accelerometerGyroscope:
          Math.round(accelerometerGyroscope * 1000) / 1000,
        orientationMotion: Math.round(orientationMotion * 1000) / 1000,
        stabilityScore: Math.round(stabilityScore * 1000) / 1000,
      };
    } catch (error) {
      return {
        accelerometerGyroscope: 0,
        orientationMotion: 0,
        stabilityScore: 0,
      };
    }
  }

  /**
   * Calculate accelerometer-gyroscope correlation
   */
  private calculateAccelGyroCorrelation(): number {
    if (
      this.accelerometerReadings.length < 10 ||
      this.gyroscopeReadings.length < 10
    ) {
      return 0;
    }

    // Calculate correlation between magnitude changes
    const accelMagnitudes = this.accelerometerReadings.map((r) =>
      Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z)
    );
    const gyroMagnitudes = this.gyroscopeReadings.map((r) =>
      Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z)
    );

    const minLength = Math.min(accelMagnitudes.length, gyroMagnitudes.length);
    if (minLength < 5) return 0;

    return this.calculateCorrelationCoefficient(
      accelMagnitudes.slice(0, minLength),
      gyroMagnitudes.slice(0, minLength)
    );
  }

  /**
   * Calculate orientation-motion correlation
   */
  private calculateOrientationMotionCorrelation(): number {
    if (this.orientationEvents.length < 5 || this.motionEvents.length < 5) {
      return 0;
    }

    // Simple correlation based on timing alignment
    const orientationTimes = this.orientationEvents.map((e) => e.timestamp);
    const motionTimes = this.motionEvents.map((e) => e.timestamp);

    const timeOverlap = this.calculateTimeOverlap(
      orientationTimes,
      motionTimes
    );
    return timeOverlap;
  }

  /**
   * Calculate overall stability score
   */
  private calculateOverallStabilityScore(): number {
    let stabilitySum = 0;
    let stabilityCount = 0;

    // Accelerometer stability
    if (this.accelerometerReadings.length > 0) {
      const accelStability =
        1 - this.calculateSensorPrecision(this.accelerometerReadings);
      stabilitySum += Math.max(0, Math.min(1, accelStability));
      stabilityCount++;
    }

    // Gyroscope stability
    if (this.gyroscopeReadings.length > 0) {
      const gyroStability =
        1 - this.calculateSensorPrecision(this.gyroscopeReadings);
      stabilitySum += Math.max(0, Math.min(1, gyroStability));
      stabilityCount++;
    }

    return stabilityCount > 0 ? stabilitySum / stabilityCount : 0;
  }

  /**
   * Detect privacy indicators and spoofing attempts
   */
  private detectPrivacyIndicators(): DeviceSensorFingerprint["privacyIndicators"] {
    return {
      sensorsBlocked: this.detectSensorsBlocked(),
      reducedPrecision: this.detectReducedPrecision(),
      artificialReadings: this.detectArtificialReadings(),
      spoofingDetected: this.detectSpoofing(),
    };
  }

  /**
   * Detect if sensors are blocked
   */
  private detectSensorsBlocked(): boolean {
    // No readings from any sensor
    return (
      this.accelerometerReadings.length === 0 &&
      this.gyroscopeReadings.length === 0 &&
      this.magnetometerReadings.length === 0 &&
      this.motionEvents.length === 0 &&
      this.orientationEvents.length === 0
    );
  }

  /**
   * Detect reduced precision (privacy protection)
   */
  private detectReducedPrecision(): boolean {
    // Check for suspiciously rounded values
    const allReadings = [
      ...this.accelerometerReadings,
      ...this.gyroscopeReadings,
      ...this.magnetometerReadings,
    ];

    if (allReadings.length < 5) return false;

    const roundedCount = allReadings.filter(
      (reading) =>
        reading.x === Math.round(reading.x * 10) / 10 &&
        reading.y === Math.round(reading.y * 10) / 10 &&
        reading.z === Math.round(reading.z * 10) / 10
    ).length;

    return roundedCount / allReadings.length > 0.8;
  }

  /**
   * Detect artificial readings
   */
  private detectArtificialReadings(): boolean {
    // Check for perfect patterns or impossible values
    const allReadings = [
      ...this.accelerometerReadings,
      ...this.gyroscopeReadings,
    ];

    if (allReadings.length < 10) return false;

    // Check for repeated identical values
    const uniqueReadings = new Set(
      allReadings.map((r) => `${r.x},${r.y},${r.z}`)
    );

    return uniqueReadings.size < allReadings.length * 0.1;
  }

  /**
   * Detect spoofing attempts
   */
  private detectSpoofing(): boolean {
    // Check for impossible sensor combinations or values
    if (this.accelerometerReadings.length === 0) return false;

    // Check for impossible accelerometer values (e.g., no gravity component)
    const avgMagnitude =
      this.accelerometerReadings.reduce(
        (sum, r) => sum + Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z),
        0
      ) / this.accelerometerReadings.length;

    // Earth's gravity should be present in accelerometer readings
    return avgMagnitude < 5 || avgMagnitude > 15; // Normal range: ~9.8 m/s²
  }

  /**
   * Format permissions data
   */
  private formatPermissions(): DeviceSensorFingerprint["permissions"] {
    return {
      accelerometer: this.permissionStates.accelerometer || "unknown",
      gyroscope: this.permissionStates.gyroscope || "unknown",
      magnetometer: this.permissionStates.magnetometer || "unknown",
      permissionAPI: this.permissionStates.permissionAPI === "true",
    };
  }

  /**
   * Calculate unique sensor hash
   */
  private async calculateSensorHash(): Promise<string> {
    try {
      const hashData = {
        accelReadings: this.accelerometerReadings.slice(0, 5),
        gyroReadings: this.gyroscopeReadings.slice(0, 5),
        motionSupport: this.analyzeDeviceMotion(),
        orientationSupport: this.analyzeDeviceOrientation(),
      };

      return await calculateSHA256(JSON.stringify(hashData));
    } catch (error) {
      return "hash_error";
    }
  }

  /**
   * Calculate hardware hash
   */
  private async calculateHardwareHash(
    hardwareSignature: DeviceSensorFingerprint["hardwareSignature"]
  ): Promise<string> {
    try {
      return await calculateSHA256(JSON.stringify(hardwareSignature));
    } catch (error) {
      return "hardware_hash_error";
    }
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidenceLevel(): number {
    let confidence = 0;
    let factors = 0;

    // Sensor data availability
    confidence += this.accelerometerReadings.length > 0 ? 1 : 0;
    factors++;

    confidence += this.gyroscopeReadings.length > 0 ? 1 : 0;
    factors++;

    confidence += this.motionEvents.length > 0 ? 1 : 0;
    factors++;

    confidence += this.orientationEvents.length > 0 ? 1 : 0;
    factors++;

    // Data quality
    const totalReadings =
      this.accelerometerReadings.length +
      this.gyroscopeReadings.length +
      this.magnetometerReadings.length;
    confidence += Math.min(1, totalReadings / 50);
    factors++;

    return factors > 0 ? Math.round((confidence / factors) * 100) / 100 : 0;
  }

  /**
   * Helper: Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * Helper: Calculate linear regression
   */
  private calculateLinearRegression(
    x: number[],
    y: number[]
  ): { slope: number; intercept: number } {
    if (x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope: slope || 0, intercept: intercept || 0 };
  }

  /**
   * Helper: Calculate correlation coefficient
   */
  private calculateCorrelationCoefficient(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < x.length; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;

      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }

    const denominator = Math.sqrt(denomX * denomY);
    return denominator !== 0 ? numerator / denominator : 0;
  }

  /**
   * Helper: Calculate time overlap between two time series
   */
  private calculateTimeOverlap(times1: number[], times2: number[]): number {
    if (times1.length === 0 || times2.length === 0) return 0;

    const start1 = Math.min(...times1);
    const end1 = Math.max(...times1);
    const start2 = Math.min(...times2);
    const end2 = Math.max(...times2);

    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    const overlap = Math.max(0, overlapEnd - overlapStart);

    const totalRange = Math.max(end1, end2) - Math.min(start1, start2);
    return totalRange > 0 ? overlap / totalRange : 0;
  }

  /**
   * Create unavailable sensor characteristics
   */
  private createUnavailableSensorCharacteristics(): SensorCharacteristics {
    return {
      available: false,
      readings: [],
      patterns: {
        staticNoise: "unavailable",
        dynamicResponse: "unavailable",
        temperatureDrift: "unavailable",
      },
    };
  }

  /**
   * Create unavailable fingerprint
   */
  private createUnavailableFingerprint(
    startTime: number,
    errorCount: number
  ): DeviceSensorFingerprint {
    return {
      available: false,
      accelerometer: this.createUnavailableSensorCharacteristics(),
      gyroscope: this.createUnavailableSensorCharacteristics(),
      magnetometer: this.createUnavailableSensorCharacteristics(),
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
        vendorFingerprint: "unavailable",
        modelSignature: "unavailable",
        calibrationSignature: "unavailable",
        noiseProfile: "unavailable",
      },
      permissions: {
        accelerometer: "unknown",
        gyroscope: "unknown",
        magnetometer: "unknown",
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
      sensorHash: "unavailable",
      hardwareHash: "unavailable",
      confidenceLevel: 0,
      collectionTime: performance.now() - startTime,
      samplingDuration: 0,
      errorCount,
    };
  }
}

/**
 * Collect device sensor fingerprint
 */
export async function collectSensorFingerprint(): Promise<DeviceSensorFingerprint> {
  const fingerprinter = new DeviceSensorFingerprinting();
  return await fingerprinter.collectFingerprint();
}
