/**
 * Media Device Fingerprinting Module
 *
 * Collects detailed media device information for device identification:
 * - Camera, microphone, and speaker enumeration with metadata
 * - Device capabilities and constraint analysis
 * - Permission state detection and privacy tool identification
 * - Hardware signature extraction from device characteristics
 * - Stream analysis for resolution, frame rate, and audio properties
 * - Virtual device and spoofing detection
 */

import type {
  MediaDeviceFingerprint,
  MediaDeviceInfo,
  MediaCapabilities,
} from "@/types/fingerprint";
import { calculateSHA256 } from "@/lib/fingerprint/utils";

interface DeviceAnalysis {
  devices: MediaDeviceInfo[];
  permissions: Record<string, string>;
  capabilities: Record<string, any>;
  streamCharacteristics: Record<string, any>;
}

interface StreamTest {
  resolution: { width: number; height: number };
  frameRate: number;
  audioChannels: number;
  sampleRate: number;
}

/**
 * Advanced media device fingerprinting with comprehensive analysis
 */
export class MediaDeviceFingerprinting {
  private devices: MediaDeviceInfo[] = [];
  private capabilities: Record<string, any> = {};
  private permissionStates: Record<string, string> = {};
  private streamTests: StreamTest[] = [];
  private readonly ENUMERATION_TIMEOUT = 5000; // 5 seconds
  private readonly STREAM_TEST_TIMEOUT = 3000; // 3 seconds

  /**
   * Collect comprehensive media device fingerprint
   */
  async collectFingerprint(): Promise<MediaDeviceFingerprint> {
    const startTime = performance.now();
    let errorCount = 0;

    try {
      // Check if MediaDevices API is available
      if (!this.isMediaDevicesSupported()) {
        return this.createUnavailableFingerprint(startTime, errorCount);
      }

      // Enumerate devices
      const deviceResults = await this.enumerateDevices();
      errorCount += deviceResults.errorCount;

      // Check permissions
      const permissionResults = await this.checkPermissions();
      errorCount += permissionResults.errorCount;

      // Analyze capabilities
      const capabilityResults = await this.analyzeCapabilities();
      errorCount += capabilityResults.errorCount;

      // Test stream characteristics (if permissions allow)
      const streamResults = await this.testStreamCharacteristics();
      errorCount += streamResults.errorCount;

      // Extract hardware signatures
      const hardwareSignature = this.extractHardwareSignature();

      // Analyze privacy indicators
      const privacyIndicators = this.analyzePrivacyIndicators();

      // Calculate unique hash and scores
      const mediaDeviceHash = await this.calculateMediaDeviceHash();
      const stabilityScore = this.calculateStabilityScore();
      const confidenceLevel = this.calculateConfidenceLevel();

      const collectionTime = performance.now() - startTime;

      return {
        available: true,
        devices: this.categorizeDevices(),
        capabilities: this.formatCapabilities(),
        permissions: this.formatPermissions(),
        hardwareSignature,
        streamAnalysis: this.formatStreamAnalysis(),
        privacyIndicators,
        mediaDeviceHash,
        stabilityScore,
        confidenceLevel,
        collectionTime,
        enumerationDuration: deviceResults.duration,
        errorCount,
      };
    } catch (error) {
      errorCount++;
      return this.createUnavailableFingerprint(startTime, errorCount);
    }
  }

  /**
   * Check if MediaDevices API is supported
   */
  private isMediaDevicesSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.enumerateDevices === "function"
    );
  }

  /**
   * Enumerate all available media devices
   */
  private async enumerateDevices(): Promise<{
    errorCount: number;
    duration: number;
  }> {
    const startTime = performance.now();
    let errorCount = 0;

    try {
      // First enumeration without permissions (limited info)
      const devices = await Promise.race([
        navigator.mediaDevices.enumerateDevices(),
        new Promise<MediaDeviceInfo[]>((_, reject) =>
          setTimeout(
            () => reject(new Error("Enumeration timeout")),
            this.ENUMERATION_TIMEOUT
          )
        ),
      ]);

      this.devices = devices.map((device) => ({
        deviceId: device.deviceId,
        kind: device.kind,
        label: device.label,
        groupId: device.groupId || "",
      }));

      // Try to get more detailed info with permissions
      await this.tryDetailedEnumeration();
    } catch (error) {
      errorCount++;
      this.devices = [];
    }

    return {
      errorCount,
      duration: performance.now() - startTime,
    };
  }

  /**
   * Try to get detailed device information with permissions
   */
  private async tryDetailedEnumeration(): Promise<void> {
    try {
      // Request temporary access to get device labels
      let stream: MediaStream | null = null;

      try {
        // Try video first
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1, height: 1 },
          audio: false,
        });

        // Re-enumerate to get labels
        const detailedDevices = await navigator.mediaDevices.enumerateDevices();
        this.devices = detailedDevices.map((device) => ({
          deviceId: device.deviceId,
          kind: device.kind,
          label: device.label,
          groupId: device.groupId || "",
        }));
      } catch (videoError) {
        // Try audio only
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate: 8000 },
            video: false,
          });

          const detailedDevices =
            await navigator.mediaDevices.enumerateDevices();
          this.devices = detailedDevices.map((device) => ({
            deviceId: device.deviceId,
            kind: device.kind,
            label: device.label,
            groupId: device.groupId || "",
          }));
        } catch (audioError) {
          // Keep original enumeration
        }
      } finally {
        // Clean up stream
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
    } catch (error) {
      // Ignore errors - keep original enumeration
    }
  }

  /**
   * Check permission states
   */
  private async checkPermissions(): Promise<{ errorCount: number }> {
    let errorCount = 0;
    this.permissionStates = {};

    try {
      // Check if Permissions API is available
      if ("permissions" in navigator && navigator.permissions.query) {
        const permissions = ["camera", "microphone"];

        for (const permission of permissions) {
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

        // Check speaker permission (if available)
        try {
          const speakerResult = await navigator.permissions.query({
            name: "speaker-selection" as PermissionName,
          });
          this.permissionStates.speaker = speakerResult.state;
        } catch (error) {
          this.permissionStates.speaker = "unknown";
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
   * Analyze device capabilities and constraints
   */
  private async analyzeCapabilities(): Promise<{ errorCount: number }> {
    let errorCount = 0;
    this.capabilities = {};

    try {
      // Get supported constraints
      if (navigator.mediaDevices.getSupportedConstraints) {
        this.capabilities.supportedConstraints = Object.keys(
          navigator.mediaDevices.getSupportedConstraints()
        );
      }

      // Test various constraint combinations
      await this.testConstraintCapabilities();

      // Analyze video capabilities
      await this.analyzeVideoCapabilities();

      // Analyze audio capabilities
      await this.analyzeAudioCapabilities();
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Test constraint capabilities
   */
  private async testConstraintCapabilities(): Promise<void> {
    const testConstraints = [
      { video: { width: { min: 640, ideal: 1280, max: 1920 } } },
      { video: { height: { min: 480, ideal: 720, max: 1080 } } },
      { video: { frameRate: { min: 15, ideal: 30, max: 60 } } },
      { audio: { sampleRate: { min: 8000, ideal: 44100, max: 48000 } } },
      { audio: { echoCancellation: true } },
      { audio: { noiseSuppression: true } },
      { audio: { autoGainControl: true } },
    ];

    this.capabilities.constraintTests = {};

    for (const constraint of testConstraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        const tracks = stream.getTracks();

        if (tracks.length > 0) {
          const settings = tracks[0].getSettings();
          const constraintKey = Object.keys(constraint)[0];
          this.capabilities.constraintTests[constraintKey] = {
            supported: true,
            settings: settings,
          };
        }

        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        const constraintKey = Object.keys(constraint)[0];
        this.capabilities.constraintTests[constraintKey] = {
          supported: false,
          error: (error as Error).name,
        };
      }
    }
  }

  /**
   * Analyze video capabilities
   */
  private async analyzeVideoCapabilities(): Promise<void> {
    this.capabilities.video = {
      resolutions: [],
      frameRates: [],
      codecs: [],
    };

    try {
      // Test common resolutions
      const resolutions = [
        { width: 320, height: 240 },
        { width: 640, height: 480 },
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 },
        { width: 3840, height: 2160 },
      ];

      for (const resolution of resolutions) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { exact: resolution.width },
              height: { exact: resolution.height },
            },
          });

          this.capabilities.video.resolutions.push(resolution);
          stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
          // Resolution not supported
        }
      }

      // Test frame rates
      const frameRates = [15, 24, 30, 60];
      for (const frameRate of frameRates) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { frameRate: { exact: frameRate } },
          });

          this.capabilities.video.frameRates.push(frameRate);
          stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
          // Frame rate not supported
        }
      }
    } catch (error) {
      // Video analysis failed
    }
  }

  /**
   * Analyze audio capabilities
   */
  private async analyzeAudioCapabilities(): Promise<void> {
    this.capabilities.audio = {
      sampleRates: [],
      channels: [],
      features: {},
    };

    try {
      // Test sample rates
      const sampleRates = [8000, 16000, 22050, 44100, 48000];
      for (const sampleRate of sampleRates) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate: { exact: sampleRate } },
          });

          this.capabilities.audio.sampleRates.push(sampleRate);
          stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
          // Sample rate not supported
        }
      }

      // Test audio features
      const features = [
        "echoCancellation",
        "noiseSuppression",
        "autoGainControl",
      ];
      for (const feature of features) {
        try {
          const constraint = { [feature]: true };
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: constraint,
          });

          this.capabilities.audio.features[feature] = true;
          stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
          this.capabilities.audio.features[feature] = false;
        }
      }
    } catch (error) {
      // Audio analysis failed
    }
  }

  /**
   * Test stream characteristics
   */
  private async testStreamCharacteristics(): Promise<{ errorCount: number }> {
    let errorCount = 0;
    this.streamTests = [];

    try {
      // Only test if we have permission or devices available
      if (
        this.devices.length === 0 ||
        this.permissionStates.camera === "denied"
      ) {
        return { errorCount };
      }

      // Test default video stream
      try {
        const videoStream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ video: true }),
          new Promise<MediaStream>((_, reject) =>
            setTimeout(
              () => reject(new Error("Stream timeout")),
              this.STREAM_TEST_TIMEOUT
            )
          ),
        ]);

        const videoTrack = videoStream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          this.streamTests.push({
            resolution: {
              width: settings.width || 0,
              height: settings.height || 0,
            },
            frameRate: settings.frameRate || 0,
            audioChannels: 0,
            sampleRate: 0,
          });
        }

        videoStream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        errorCount++;
      }

      // Test default audio stream
      try {
        const audioStream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ audio: true }),
          new Promise<MediaStream>((_, reject) =>
            setTimeout(
              () => reject(new Error("Stream timeout")),
              this.STREAM_TEST_TIMEOUT
            )
          ),
        ]);

        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          const settings = audioTrack.getSettings();
          if (this.streamTests.length > 0) {
            this.streamTests[0].audioChannels = settings.channelCount || 0;
            this.streamTests[0].sampleRate = settings.sampleRate || 0;
          } else {
            this.streamTests.push({
              resolution: { width: 0, height: 0 },
              frameRate: 0,
              audioChannels: settings.channelCount || 0,
              sampleRate: settings.sampleRate || 0,
            });
          }
        }

        audioStream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        errorCount++;
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Extract hardware signature from device characteristics
   */
  private extractHardwareSignature(): MediaDeviceFingerprint["hardwareSignature"] {
    try {
      // Analyze device IDs and labels for patterns
      const deviceFingerprint = this.generateDeviceFingerprint();
      const vendorPatterns = this.extractVendorPatterns();
      const modelSignatures = this.extractModelSignatures();
      const driverVersions = this.extractDriverVersions();

      return {
        deviceFingerprint,
        vendorPatterns,
        modelSignatures,
        driverVersions,
      };
    } catch (error) {
      return {
        deviceFingerprint: "extraction_error",
        vendorPatterns: [],
        modelSignatures: [],
        driverVersions: [],
      };
    }
  }

  /**
   * Generate device fingerprint from IDs and characteristics
   */
  private generateDeviceFingerprint(): string {
    const deviceData = {
      deviceCount: this.devices.length,
      deviceIds: this.devices.map((d) => d.deviceId.substring(0, 8)), // Partial IDs for privacy
      kinds: this.devices.map((d) => d.kind).sort(),
      groupIds: Array.from(new Set(this.devices.map((d) => d.groupId))),
      capabilities: Object.keys(
        this.capabilities.supportedConstraints || []
      ).sort(),
    };

    return Buffer.from(JSON.stringify(deviceData))
      .toString("base64")
      .substring(0, 32);
  }

  /**
   * Extract vendor patterns from device labels
   */
  private extractVendorPatterns(): string[] {
    const vendors = new Set<string>();

    this.devices.forEach((device) => {
      if (device.label) {
        // Common vendor patterns
        const vendorPatterns = [
          /^(Logitech|Realtek|Intel|AMD|NVIDIA|Creative|Plantronics|Jabra|Sennheiser)/i,
          /(USB|HD|Audio|Camera|Webcam|Microphone)/i,
        ];

        vendorPatterns.forEach((pattern) => {
          const match = device.label.match(pattern);
          if (match) {
            vendors.add(match[1] || match[0]);
          }
        });
      }
    });

    return Array.from(vendors);
  }

  /**
   * Extract model signatures from device information
   */
  private extractModelSignatures(): string[] {
    const models = new Set<string>();

    this.devices.forEach((device) => {
      if (device.label) {
        // Extract model numbers and specific identifiers
        const modelPatterns = [
          /\b[A-Z]{2,}\d{3,}\b/g, // Pattern like HD3000, C920, etc.
          /\b\d{3,}[A-Z]{1,3}\b/g, // Pattern like 1080p, 720HD, etc.
        ];

        modelPatterns.forEach((pattern) => {
          const matches = device.label.match(pattern);
          if (matches) {
            matches.forEach((match) => models.add(match));
          }
        });
      }
    });

    return Array.from(models);
  }

  /**
   * Extract driver version indicators
   */
  private extractDriverVersions(): string[] {
    const versions = new Set<string>();

    // Extract from device labels if available
    this.devices.forEach((device) => {
      if (device.label) {
        const versionPattern = /v?\d+\.\d+(\.\d+)?/g;
        const matches = device.label.match(versionPattern);
        if (matches) {
          matches.forEach((match) => versions.add(match));
        }
      }
    });

    return Array.from(versions);
  }

  /**
   * Analyze privacy indicators and masking
   */
  private analyzePrivacyIndicators(): MediaDeviceFingerprint["privacyIndicators"] {
    return {
      labelsBlocked: this.detectLabelBlocking(),
      deviceIdsRandomized: this.detectDeviceIdRandomization(),
      permissionDenied: this.detectPermissionDenial(),
      virtualDevicesDetected: this.detectVirtualDevices(),
    };
  }

  /**
   * Detect if device labels are being blocked
   */
  private detectLabelBlocking(): boolean {
    return (
      this.devices.length > 0 &&
      this.devices.every((device) => !device.label || device.label === "")
    );
  }

  /**
   * Detect if device IDs are being randomized
   */
  private detectDeviceIdRandomization(): boolean {
    if (this.devices.length === 0) return false;

    // Check for default or obviously random device IDs
    const suspiciousPatterns = [
      /^default$/i,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID pattern
      /^[0-9a-f]{32,}$/i, // Long hex strings
    ];

    return this.devices.some((device) =>
      suspiciousPatterns.some((pattern) => pattern.test(device.deviceId))
    );
  }

  /**
   * Detect if permissions are being denied
   */
  private detectPermissionDenial(): boolean {
    return Object.values(this.permissionStates).some(
      (state) => state === "denied"
    );
  }

  /**
   * Detect virtual devices (e.g., OBS, ManyCam)
   */
  private detectVirtualDevices(): boolean {
    const virtualDevicePatterns = [
      /OBS/i,
      /ManyCam/i,
      /XSplit/i,
      /Virtual/i,
      /Snap Camera/i,
      /ChromaCam/i,
    ];

    return this.devices.some(
      (device) =>
        device.label &&
        virtualDevicePatterns.some((pattern) => pattern.test(device.label))
    );
  }

  /**
   * Categorize devices by type
   */
  private categorizeDevices(): MediaDeviceFingerprint["devices"] {
    const videoInputs = this.devices.filter((d) => d.kind === "videoinput");
    const audioInputs = this.devices.filter((d) => d.kind === "audioinput");
    const audioOutputs = this.devices.filter((d) => d.kind === "audiooutput");

    return {
      videoInputs,
      audioInputs,
      audioOutputs,
      totalCount: this.devices.length,
      uniqueDevices: new Set(this.devices.map((d) => d.groupId)).size,
    };
  }

  /**
   * Format capabilities data
   */
  private formatCapabilities(): MediaDeviceFingerprint["capabilities"] {
    return {
      video: {
        resolutions: this.capabilities.video?.resolutions || [],
        audioFormats: [],
        videoCodecs: [],
        constraints: this.extractVideoConstraints(),
      },
      audio: {
        resolutions: [],
        audioFormats:
          this.capabilities.audio?.sampleRates?.map(
            (rate: number) => `${rate}Hz`
          ) || [],
        videoCodecs: [],
        constraints: this.extractAudioConstraints(),
      },
      supportedConstraints: this.capabilities.supportedConstraints || [],
    };
  }

  /**
   * Extract video constraints
   */
  private extractVideoConstraints(): MediaCapabilities["constraints"] {
    const video = this.capabilities.video || {};
    return {
      width:
        video.resolutions?.length > 0
          ? {
              min: Math.min(...video.resolutions.map((r: any) => r.width)),
              max: Math.max(...video.resolutions.map((r: any) => r.width)),
            }
          : undefined,
      height:
        video.resolutions?.length > 0
          ? {
              min: Math.min(...video.resolutions.map((r: any) => r.height)),
              max: Math.max(...video.resolutions.map((r: any) => r.height)),
            }
          : undefined,
      frameRate:
        video.frameRates?.length > 0
          ? {
              min: Math.min(...video.frameRates),
              max: Math.max(...video.frameRates),
            }
          : undefined,
    };
  }

  /**
   * Extract audio constraints
   */
  private extractAudioConstraints(): MediaCapabilities["constraints"] {
    const audio = this.capabilities.audio || {};
    return {
      sampleRate:
        audio.sampleRates?.length > 0
          ? {
              min: Math.min(...audio.sampleRates),
              max: Math.max(...audio.sampleRates),
            }
          : undefined,
      echoCancellation: audio.features?.echoCancellation,
      noiseSuppression: audio.features?.noiseSuppression,
      autoGainControl: audio.features?.autoGainControl,
    };
  }

  /**
   * Format permissions data
   */
  private formatPermissions(): MediaDeviceFingerprint["permissions"] {
    return {
      camera: this.permissionStates.camera || "unknown",
      microphone: this.permissionStates.microphone || "unknown",
      speaker: this.permissionStates.speaker || "unknown",
      permissionAPI: this.permissionStates.permissionAPI === "true",
    };
  }

  /**
   * Format stream analysis data
   */
  private formatStreamAnalysis(): MediaDeviceFingerprint["streamAnalysis"] {
    const defaultTest = this.streamTests[0];

    return {
      defaultResolution: defaultTest
        ? defaultTest.resolution
        : { width: 0, height: 0 },
      supportedFrameRates: this.capabilities.video?.frameRates || [],
      audioChannels: defaultTest ? [defaultTest.audioChannels] : [],
      bitRateProfiles: [],
    };
  }

  /**
   * Calculate unique media device hash
   */
  private async calculateMediaDeviceHash(): Promise<string> {
    try {
      const hashData = {
        devices: this.devices.map((d) => ({
          kind: d.kind,
          groupId: d.groupId,
        })),
        capabilities: this.capabilities.supportedConstraints,
        resolutions: this.capabilities.video?.resolutions,
        audioFeatures: this.capabilities.audio?.features,
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
    let score = 0;
    let factors = 0;

    // Device consistency
    if (this.devices.length > 0) {
      score +=
        this.devices.filter((d) => d.deviceId && d.deviceId !== "default")
          .length / this.devices.length;
      factors++;
    }

    // Capability consistency
    if (this.capabilities.supportedConstraints?.length > 0) {
      score += Math.min(1, this.capabilities.supportedConstraints.length / 20);
      factors++;
    }

    // Permission API availability
    if (this.permissionStates.permissionAPI === "true") {
      score += 1;
      factors++;
    }

    return factors > 0 ? Math.round((score / factors) * 100) / 100 : 0;
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidenceLevel(): number {
    let confidence = 0;
    let factors = 0;

    // Device enumeration success
    confidence += this.devices.length > 0 ? 1 : 0;
    factors++;

    // Label availability
    confidence += this.devices.some((d) => d.label && d.label !== "") ? 1 : 0;
    factors++;

    // Capability testing success
    confidence += Object.keys(this.capabilities).length > 0 ? 1 : 0;
    factors++;

    // Stream testing success
    confidence += this.streamTests.length > 0 ? 1 : 0;
    factors++;

    return factors > 0 ? Math.round((confidence / factors) * 100) / 100 : 0;
  }

  /**
   * Create unavailable fingerprint
   */
  private createUnavailableFingerprint(
    startTime: number,
    errorCount: number
  ): MediaDeviceFingerprint {
    return {
      available: false,
      devices: {
        videoInputs: [],
        audioInputs: [],
        audioOutputs: [],
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
        camera: "unknown",
        microphone: "unknown",
        speaker: "unknown",
        permissionAPI: false,
      },
      hardwareSignature: {
        deviceFingerprint: "unavailable",
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
        permissionDenied: false,
        virtualDevicesDetected: false,
      },
      mediaDeviceHash: "unavailable",
      stabilityScore: 0,
      confidenceLevel: 0,
      collectionTime: performance.now() - startTime,
      enumerationDuration: 0,
      errorCount,
    };
  }
}

/**
 * Collect media device fingerprint
 */
export async function collectMediaDeviceFingerprint(): Promise<MediaDeviceFingerprint> {
  const fingerprinter = new MediaDeviceFingerprinting();
  return await fingerprinter.collectFingerprint();
}
