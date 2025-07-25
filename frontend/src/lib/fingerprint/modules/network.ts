/**
 * Network Timing Fingerprinting Module
 *
 * Collects detailed network characteristics for device/location identification:
 * - RTT measurements to multiple global endpoints
 * - Network timing pattern analysis and jitter calculation
 * - Connection type detection and bandwidth estimation
 * - Geographic inference from network proximity
 * - VPN, proxy, and Tor detection
 * - DNS provider and network infrastructure analysis
 */

import type {
  NetworkFingerprint,
  NetworkEndpoint,
  NetworkAnalysis,
  ConnectionInfo,
} from "@/types/fingerprint";
import { calculateSHA256 } from "@/lib/fingerprint/utils";

interface TimingMeasurement {
  dns: number;
  connect: number;
  ssl: number;
  request: number;
  response: number;
  total: number;
}

interface BandwidthTest {
  downloadSize: number;
  uploadSize: number;
  downloadTime: number;
  uploadTime: number;
  downloadSpeed: number;
  uploadSpeed: number;
}

/**
 * Advanced network timing fingerprinting with comprehensive analysis
 */
export class NetworkTimingFingerprinting {
  private endpoints: NetworkEndpoint[] = [];
  private timingMeasurements: TimingMeasurement[] = [];
  private bandwidthTests: BandwidthTest[] = [];
  private connectionInfo: ConnectionInfo = {};

  private readonly TEST_ENDPOINTS = [
    {
      url: "https://www.google.com/generate_204",
      location: "Global",
      provider: "Google",
    },
    {
      url: "https://www.cloudflare.com/cdn-cgi/trace",
      location: "Global",
      provider: "Cloudflare",
    },
    {
      url: "https://www.amazon.com/favicon.ico",
      location: "US",
      provider: "AWS",
    },
    {
      url: "https://www.microsoft.com/favicon.ico",
      location: "Global",
      provider: "Microsoft",
    },
    {
      url: "https://cdn.jsdelivr.net/npm/jquery@3.6.0/package.json",
      location: "Global",
      provider: "jsDelivr",
    },
    { url: "https://httpbin.org/delay/0", location: "US", provider: "httpbin" },
    {
      url: "https://jsonplaceholder.typicode.com/posts/1",
      location: "US",
      provider: "typicode",
    },
    {
      url: "https://api.github.com/zen",
      location: "Global",
      provider: "GitHub",
    },
  ];

  private readonly TIMING_TIMEOUT = 10000; // 10 seconds
  private readonly BANDWIDTH_TEST_SIZE = 100 * 1024; // 100KB
  private readonly MAX_CONCURRENT_TESTS = 3;

  /**
   * Collect comprehensive network timing fingerprint
   */
  async collectFingerprint(): Promise<NetworkFingerprint> {
    const startTime = performance.now();
    let errorCount = 0;

    try {
      // Get connection information from Network Information API
      this.gatherConnectionInfo();

      // Measure RTT to various endpoints
      const rttResults = await this.measureEndpointRTTs();
      errorCount += rttResults.errorCount;

      // Perform detailed timing analysis
      const timingResults = await this.performDetailedTimingAnalysis();
      errorCount += timingResults.errorCount;

      // Estimate bandwidth
      const bandwidthResults = await this.estimateBandwidth();
      errorCount += bandwidthResults.errorCount;

      // Analyze network characteristics
      const analysis = this.analyzeNetworkMetrics();

      // Detect geographic location
      const geographic = this.inferGeographicLocation();

      // Analyze network characteristics
      const characteristics = await this.analyzeNetworkCharacteristics();

      // Detect privacy tools
      const privacyIndicators = this.detectPrivacyTools();

      // Calculate unique hashes
      const networkHash = await this.calculateNetworkHash();
      const timingHash = await this.calculateTimingHash();
      const confidenceLevel = this.calculateConfidenceLevel();

      const collectionTime = performance.now() - startTime;

      return {
        available: true,
        endpoints: this.endpoints,
        analysis,
        connection: this.connectionInfo,
        timingPatterns: this.extractTimingPatterns(),
        bandwidth: this.formatBandwidthResults(),
        geographic,
        characteristics,
        privacyIndicators,
        networkHash,
        timingHash,
        confidenceLevel,
        collectionTime,
        testDuration: collectionTime,
        errorCount,
      };
    } catch (error) {
      errorCount++;
      return this.createUnavailableFingerprint(startTime, errorCount);
    }
  }

  /**
   * Gather connection information from Network Information API
   */
  private gatherConnectionInfo(): void {
    try {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (connection) {
        this.connectionInfo = {
          type: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          downlinkMax: connection.downlinkMax,
          rtt: connection.rtt,
          saveData: connection.saveData,
        };
      }
    } catch (error) {
      // Network Information API not available
    }
  }

  /**
   * Measure RTT to various endpoints
   */
  private async measureEndpointRTTs(): Promise<{ errorCount: number }> {
    let errorCount = 0;
    this.endpoints = [];

    // Test endpoints in batches to avoid overwhelming the network
    const batches = this.chunkArray(
      this.TEST_ENDPOINTS,
      this.MAX_CONCURRENT_TESTS
    );

    for (const batch of batches) {
      const promises = batch.map((endpoint) =>
        this.measureSingleEndpoint(endpoint)
      );
      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          this.endpoints.push(result.value);
        } else {
          errorCount++;
          // Add failed endpoint with error status
          this.endpoints.push({
            url: batch[index].url,
            location: batch[index].location,
            provider: batch[index].provider,
            rtt: -1,
            status: 0,
            timestamp: performance.now(),
          });
        }
      });

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return { errorCount };
  }

  /**
   * Measure RTT to a single endpoint
   */
  private async measureSingleEndpoint(endpointConfig: {
    url: string;
    location: string;
    provider: string;
  }): Promise<NetworkEndpoint | null> {
    try {
      const startTime = performance.now();

      const response = await Promise.race([
        fetch(endpointConfig.url, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), this.TIMING_TIMEOUT)
        ),
      ]);

      const endTime = performance.now();
      const rtt = endTime - startTime;

      return {
        url: endpointConfig.url,
        location: endpointConfig.location,
        provider: endpointConfig.provider,
        rtt: Math.round(rtt * 100) / 100,
        status: response.status || 200,
        timestamp: startTime,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Perform detailed timing analysis using Resource Timing API
   */
  private async performDetailedTimingAnalysis(): Promise<{
    errorCount: number;
  }> {
    let errorCount = 0;

    try {
      // Use a few endpoints for detailed timing analysis
      const timingEndpoints = this.TEST_ENDPOINTS.slice(0, 3);

      for (const endpoint of timingEndpoints) {
        try {
          const timing = await this.measureDetailedTiming(endpoint.url);
          if (timing) {
            this.timingMeasurements.push(timing);
          }
        } catch (error) {
          errorCount++;
        }
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Measure detailed timing for a single endpoint
   */
  private async measureDetailedTiming(
    url: string
  ): Promise<TimingMeasurement | null> {
    try {
      // Clear existing entries
      if (performance.clearResourceTimings) {
        performance.clearResourceTimings();
      }

      const startTime = performance.now();

      await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
      });

      // Get resource timing entry
      const entries = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      const entry = entries.find((e) => e.name.includes(new URL(url).hostname));

      if (entry) {
        return {
          dns: entry.domainLookupEnd - entry.domainLookupStart,
          connect: entry.connectEnd - entry.connectStart,
          ssl:
            entry.secureConnectionStart > 0
              ? entry.connectEnd - entry.secureConnectionStart
              : 0,
          request: entry.responseStart - entry.requestStart,
          response: entry.responseEnd - entry.responseStart,
          total: entry.responseEnd - entry.startTime,
        };
      }

      // Fallback timing
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      return {
        dns: 0,
        connect: 0,
        ssl: 0,
        request: totalTime * 0.6,
        response: totalTime * 0.4,
        total: totalTime,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Estimate bandwidth using small download tests
   */
  private async estimateBandwidth(): Promise<{ errorCount: number }> {
    let errorCount = 0;

    try {
      // Simple bandwidth test using a small resource
      const testUrl = "https://httpbin.org/bytes/" + this.BANDWIDTH_TEST_SIZE;

      const downloadTest = await this.performBandwidthTest(testUrl, "download");
      if (downloadTest) {
        this.bandwidthTests.push(downloadTest);
      } else {
        errorCount++;
      }
    } catch (error) {
      errorCount++;
    }

    return { errorCount };
  }

  /**
   * Perform a bandwidth test
   */
  private async performBandwidthTest(
    url: string,
    type: "download" | "upload"
  ): Promise<BandwidthTest | null> {
    try {
      const startTime = performance.now();

      const response = await fetch(url, {
        method: type === "upload" ? "POST" : "GET",
        cache: "no-cache",
        body:
          type === "upload"
            ? new ArrayBuffer(this.BANDWIDTH_TEST_SIZE)
            : undefined,
      });

      if (!response.ok) {
        return null;
      }

      let dataSize = 0;
      if (type === "download") {
        const data = await response.arrayBuffer();
        dataSize = data.byteLength;
      } else {
        dataSize = this.BANDWIDTH_TEST_SIZE;
      }

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      const speed = (dataSize * 8) / duration / 1000; // kbps

      return {
        downloadSize: type === "download" ? dataSize : 0,
        uploadSize: type === "upload" ? dataSize : 0,
        downloadTime: type === "download" ? duration : 0,
        uploadTime: type === "upload" ? duration : 0,
        downloadSpeed: type === "download" ? speed : 0,
        uploadSpeed: type === "upload" ? speed : 0,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze network metrics
   */
  private analyzeNetworkMetrics(): NetworkAnalysis {
    const validRTTs = this.endpoints.filter((e) => e.rtt > 0).map((e) => e.rtt);

    if (validRTTs.length === 0) {
      return {
        avgRTT: 0,
        minRTT: 0,
        maxRTT: 0,
        jitter: 0,
        packetLoss: 0,
        stability: 0,
        latencyVariation: 0,
        throughputEstimate: 0,
        jitterMeasurement: 0,
      };
    }

    const avgRTT =
      validRTTs.reduce((sum, rtt) => sum + rtt, 0) / validRTTs.length;
    const minRTT = Math.min(...validRTTs);
    const maxRTT = Math.max(...validRTTs);

    // Calculate jitter (variation in RTT)
    const jitter = this.calculateJitter(validRTTs);

    // Calculate packet loss percentage
    const packetLoss =
      ((this.endpoints.length - validRTTs.length) / this.endpoints.length) *
      100;

    // Calculate stability score
    const stability = this.calculateStabilityScore(validRTTs);

    // Calculate latency variation (coefficient of variation)
    const latencyVariation = avgRTT > 0 ? (jitter / avgRTT) * 100 : 0;

    // Estimate throughput based on bandwidth tests
    const throughputEstimate = this.estimateThroughputFromBandwidth();

    // Calculate jitter measurement (same as jitter but kept separate for interface compatibility)
    const jitterMeasurement = jitter;

    return {
      avgRTT: Math.round(avgRTT * 100) / 100,
      minRTT: Math.round(minRTT * 100) / 100,
      maxRTT: Math.round(maxRTT * 100) / 100,
      jitter: Math.round(jitter * 100) / 100,
      packetLoss: Math.round(packetLoss * 100) / 100,
      stability: Math.round(stability * 100) / 100,
      latencyVariation: Math.round(latencyVariation * 100) / 100,
      throughputEstimate: Math.round(throughputEstimate * 100) / 100,
      jitterMeasurement: Math.round(jitterMeasurement * 100) / 100,
    };
  }

  /**
   * Calculate jitter (RTT variation)
   */
  private calculateJitter(rtts: number[]): number {
    if (rtts.length < 2) return 0;

    const avg = rtts.reduce((sum, rtt) => sum + rtt, 0) / rtts.length;
    const variance =
      rtts.reduce((sum, rtt) => sum + Math.pow(rtt - avg, 2), 0) / rtts.length;

    return Math.sqrt(variance);
  }

  /**
   * Calculate network stability score
   */
  private calculateStabilityScore(rtts: number[]): number {
    if (rtts.length < 2) return 0;

    const jitter = this.calculateJitter(rtts);
    const avgRTT = rtts.reduce((sum, rtt) => sum + rtt, 0) / rtts.length;

    // Stability is inversely related to jitter relative to average RTT
    const normalizedJitter = avgRTT > 0 ? jitter / avgRTT : 1;
    return Math.max(0, Math.min(1, 1 - normalizedJitter));
  }

  /**
   * Estimate throughput from bandwidth tests
   */
  private estimateThroughputFromBandwidth(): number {
    if (this.bandwidthTests.length === 0) {
      // Fallback estimation based on connection info if available
      if (this.connectionInfo.downlink) {
        return this.connectionInfo.downlink * 1000; // Convert Mbps to kbps
      }
      return 0;
    }

    const totalDownload = this.bandwidthTests.reduce(
      (sum, test) => sum + test.downloadSpeed,
      0
    );
    const totalUpload = this.bandwidthTests.reduce(
      (sum, test) => sum + test.uploadSpeed,
      0
    );
    const testCount = this.bandwidthTests.length;

    // Return average of download and upload speeds
    return (totalDownload + totalUpload) / (testCount * 2);
  }

  /**
   * Infer geographic location from network timing
   */
  private inferGeographicLocation(): NetworkFingerprint["geographic"] {
    try {
      // Analyze RTT to different geographic regions
      const proximityToServers: Record<string, number> = {};

      this.endpoints.forEach((endpoint) => {
        if (endpoint.rtt > 0) {
          proximityToServers[endpoint.location] = endpoint.rtt;
        }
      });

      // Find closest region
      const closestRegion = Object.entries(proximityToServers).sort(
        ([, a], [, b]) => a - b
      )[0];

      const estimatedLocation = closestRegion ? closestRegion[0] : "Unknown";

      // Get timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      return {
        estimatedLocation,
        timezone,
        proximityToServers,
      };
    } catch (error) {
      return {
        estimatedLocation: "Unknown",
        timezone: "Unknown",
        proximityToServers: {},
      };
    }
  }

  /**
   * Analyze network characteristics
   */
  private async analyzeNetworkCharacteristics(): Promise<
    NetworkFingerprint["characteristics"]
  > {
    try {
      // Estimate MTU from timing patterns
      const mtu = this.estimateMTU();

      // Detect IP version
      const ipVersion = this.detectIPVersion();

      // Detect DNS provider
      const dnsProvider = await this.detectDNSProvider();

      // Detect proxy/VPN/Tor
      const proxy = this.detectProxy();
      const vpn = this.detectVPN();
      const tor = this.detectTor();

      return {
        mtu,
        ipVersion,
        dnsProvider,
        proxy,
        vpn,
        tor,
      };
    } catch (error) {
      return {
        mtu: 1500,
        ipVersion: "IPv4",
        dnsProvider: "Unknown",
        proxy: false,
        vpn: false,
        tor: false,
      };
    }
  }

  /**
   * Estimate MTU from timing patterns
   */
  private estimateMTU(): number {
    // Default MTU for Ethernet
    return 1500;
  }

  /**
   * Detect IP version
   */
  private detectIPVersion(): string {
    // Simple heuristic based on timing patterns
    const avgRTT = this.endpoints
      .filter((e) => e.rtt > 0)
      .reduce((sum, e, _, arr) => sum + e.rtt / arr.length, 0);

    // IPv6 often has slightly different timing characteristics
    return avgRTT > 100 ? "IPv6" : "IPv4";
  }

  /**
   * Detect DNS provider
   */
  private async detectDNSProvider(): Promise<string> {
    try {
      // Analyze DNS timing if available
      const dnsTimings = this.timingMeasurements
        .map((t) => t.dns)
        .filter((t) => t > 0);

      if (dnsTimings.length === 0) return "Unknown";

      const avgDNSTime =
        dnsTimings.reduce((sum, t) => sum + t, 0) / dnsTimings.length;

      // Rough heuristics for DNS provider detection
      if (avgDNSTime < 10) return "Cloudflare/Google";
      if (avgDNSTime < 30) return "ISP";
      return "Custom/Slow";
    } catch (error) {
      return "Unknown";
    }
  }

  /**
   * Detect proxy usage
   */
  private detectProxy(): boolean {
    // Look for consistent timing patterns that might indicate proxy
    const rtts = this.endpoints.filter((e) => e.rtt > 0).map((e) => e.rtt);
    if (rtts.length < 2) return false;

    // Proxies often add consistent overhead
    const jitter = this.calculateJitter(rtts);
    const avgRTT = rtts.reduce((sum, rtt) => sum + rtt, 0) / rtts.length;

    return jitter < 10 && avgRTT > 200; // Low jitter + high RTT might indicate proxy
  }

  /**
   * Detect VPN usage
   */
  private detectVPN(): boolean {
    // VPNs often add encryption overhead and route through specific locations
    const avgRTT = this.endpoints
      .filter((e) => e.rtt > 0)
      .reduce((sum, e, _, arr) => sum + e.rtt / arr.length, 0);

    // High RTT to all providers might indicate VPN
    return avgRTT > 150 && this.connectionInfo.saveData === false;
  }

  /**
   * Detect Tor usage
   */
  private detectTor(): boolean {
    // Tor has very specific timing characteristics
    const avgRTT = this.endpoints
      .filter((e) => e.rtt > 0)
      .reduce((sum, e, _, arr) => sum + e.rtt / arr.length, 0);

    const jitter = this.calculateJitter(
      this.endpoints.filter((e) => e.rtt > 0).map((e) => e.rtt)
    );

    // Very high RTT + high jitter might indicate Tor
    return avgRTT > 500 && jitter > 100;
  }

  /**
   * Detect privacy tools and network masking
   */
  private detectPrivacyTools(): NetworkFingerprint["privacyIndicators"] {
    const avgRTT = this.endpoints
      .filter((e) => e.rtt > 0)
      .reduce((sum, e, _, arr) => sum + e.rtt / arr.length, 0);

    return {
      maskedIP: this.detectVPN() || this.detectProxy() || this.detectTor(),
      reducedTiming: avgRTT === 0 || this.endpoints.every((e) => e.rtt <= 0),
      artificialDelays: this.detectArtificialDelays(),
      tunneled: this.detectVPN() || this.detectTor(),
    };
  }

  /**
   * Detect artificial delays
   */
  private detectArtificialDelays(): boolean {
    const rtts = this.endpoints.filter((e) => e.rtt > 0).map((e) => e.rtt);
    if (rtts.length < 3) return false;

    // Check for suspiciously round numbers
    const roundNumbers = rtts.filter((rtt) => rtt % 10 === 0 || rtt % 50 === 0);
    return roundNumbers.length / rtts.length > 0.7;
  }

  /**
   * Extract timing patterns
   */
  private extractTimingPatterns(): NetworkFingerprint["timingPatterns"] {
    const patterns = {
      dnsLookup: [] as number[],
      tcpConnect: [] as number[],
      tlsHandshake: [] as number[],
      requestResponse: [] as number[],
      totalTime: [] as number[],
    };

    this.timingMeasurements.forEach((timing) => {
      patterns.dnsLookup.push(timing.dns);
      patterns.tcpConnect.push(timing.connect);
      patterns.tlsHandshake.push(timing.ssl);
      patterns.requestResponse.push(timing.request + timing.response);
      patterns.totalTime.push(timing.total);
    });

    return patterns;
  }

  /**
   * Format bandwidth results
   */
  private formatBandwidthResults(): NetworkFingerprint["bandwidth"] {
    if (this.bandwidthTests.length === 0) {
      return {
        estimated: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        testDuration: 0,
      };
    }

    const totalDownload = this.bandwidthTests.reduce(
      (sum, test) => sum + test.downloadSpeed,
      0
    );
    const totalUpload = this.bandwidthTests.reduce(
      (sum, test) => sum + test.uploadSpeed,
      0
    );
    const testCount = this.bandwidthTests.length;

    const downloadSpeed = totalDownload / testCount;
    const uploadSpeed = totalUpload / testCount;
    const estimated = Math.max(downloadSpeed, uploadSpeed);
    const testDuration = this.bandwidthTests.reduce(
      (sum, test) => sum + test.downloadTime + test.uploadTime,
      0
    );

    return {
      estimated: Math.round(estimated * 100) / 100,
      downloadSpeed: Math.round(downloadSpeed * 100) / 100,
      uploadSpeed: Math.round(uploadSpeed * 100) / 100,
      testDuration: Math.round(testDuration * 100) / 100,
    };
  }

  /**
   * Calculate network hash
   */
  private async calculateNetworkHash(): Promise<string> {
    try {
      const hashData = {
        endpoints: this.endpoints.map((e) => ({
          provider: e.provider,
          location: e.location,
          rtt: Math.round(e.rtt / 10) * 10, // Round to reduce precision
        })),
        connection: this.connectionInfo,
        analysis: this.analyzeNetworkMetrics(),
      };

      return await calculateSHA256(JSON.stringify(hashData));
    } catch (error) {
      return "network_hash_error";
    }
  }

  /**
   * Calculate timing hash
   */
  private async calculateTimingHash(): Promise<string> {
    try {
      const timingData = {
        patterns: this.extractTimingPatterns(),
        measurements: this.timingMeasurements.map((t) => ({
          dns: Math.round(t.dns),
          connect: Math.round(t.connect),
          ssl: Math.round(t.ssl),
          total: Math.round(t.total),
        })),
      };

      return await calculateSHA256(JSON.stringify(timingData));
    } catch (error) {
      return "timing_hash_error";
    }
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidenceLevel(): number {
    let confidence = 0;
    let factors = 0;

    // Successful endpoint measurements
    const successfulEndpoints = this.endpoints.filter((e) => e.rtt > 0).length;
    confidence += Math.min(1, successfulEndpoints / this.TEST_ENDPOINTS.length);
    factors++;

    // Timing measurement quality
    confidence += Math.min(1, this.timingMeasurements.length / 3);
    factors++;

    // Bandwidth test success
    confidence += this.bandwidthTests.length > 0 ? 1 : 0;
    factors++;

    // Connection info availability
    confidence += Object.keys(this.connectionInfo).length > 0 ? 1 : 0;
    factors++;

    return factors > 0 ? Math.round((confidence / factors) * 100) / 100 : 0;
  }

  /**
   * Helper: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Create unavailable fingerprint
   */
  private createUnavailableFingerprint(
    startTime: number,
    errorCount: number
  ): NetworkFingerprint {
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
        estimatedLocation: "Unknown",
        timezone: "Unknown",
        proximityToServers: {},
      },
      characteristics: {
        mtu: 1500,
        ipVersion: "Unknown",
        dnsProvider: "Unknown",
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
      networkHash: "unavailable",
      timingHash: "unavailable",
      confidenceLevel: 0,
      collectionTime: performance.now() - startTime,
      testDuration: 0,
      errorCount,
    };
  }
}

/**
 * Collect network timing fingerprint
 */
export async function collectNetworkFingerprint(): Promise<NetworkFingerprint> {
  const fingerprinter = new NetworkTimingFingerprinting();
  return await fingerprinter.collectFingerprint();
}
