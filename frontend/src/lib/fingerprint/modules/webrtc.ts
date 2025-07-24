/**
 * WebRTC fingerprinting module
 * Local IP detection and NAT traversal analysis
 */

import { safeFeatureDetect, isBrowser, hashData } from "@/lib/fingerprint/utils";
import type {
  WebRTCFingerprint,
  NetworkInterface,
  RTCCodecCapability,
  RTCHeaderExtensionCapability,
} from "@/types/fingerprint";

/**
 * STUN servers for IP discovery and NAT analysis
 */
const STUN_SERVERS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stun4.l.google.com:19302",
  "stun:stun.cloudflare.com:3478",
  "stun:stun.nextcloud.com:443",
  "stun:stun.sipgate.net:3478",
  "stun:stun.ekiga.net:3478",
  "stun:stun.ideasip.com:3478",
  "stun:stun.stunprotocol.org:3478",
  "stun:stun.voiparound.com:3478",
  "stun:stun.voipbuster.com:3478",
  "stun:stun.voipstunt.com:3478",
  "stun:stun.voxgratia.org:3478",
];

/**
 * TURN servers for advanced NAT traversal testing
 */
const TURN_SERVERS = [
  "turn:numb.viagenie.ca:3478",
  "turn:turn.bistri.com:80",
  "turn:turn.anyfirewall.com:443",
];

/**
 * ICE candidate types for analysis
 */
const CANDIDATE_TYPES = ["host", "srflx", "prflx", "relay"] as const;

/**
 * Network protocols for testing
 */
const PROTOCOLS = ["udp", "tcp", "tls"] as const;

/**
 * NAT types for classification
 */
const NAT_TYPES = [
  "Open Internet",
  "Full Cone NAT",
  "Restricted NAT",
  "Port Restricted NAT",
  "Symmetric NAT",
  "Unknown",
] as const;

/**
 * Check if WebRTC is supported
 */
function isWebRTCSupported(): boolean {
  if (!isBrowser()) return false;

  return !!(
    window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  );
}

/**
 * Get WebRTC constructor
 */
function getRTCPeerConnection(): typeof RTCPeerConnection | null {
  if (!isBrowser()) return null;

  return (
    window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection ||
    null
  );
}

/**
 * Create RTC configuration with STUN/TURN servers
 */
function createRTCConfiguration(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    // Google STUN servers
    { urls: STUN_SERVERS.slice(0, 5) },
    // Additional STUN servers
    { urls: STUN_SERVERS.slice(5) },
  ];

  // Add TURN servers (would need credentials in production)
  TURN_SERVERS.forEach((turnServer) => {
    iceServers.push({
      urls: turnServer,
      username: "guest",
      credential: "somepassword",
    });
  });

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    iceTransportPolicy: "all",
  };
}

/**
 * Extract IP addresses from ICE candidates
 */
function extractIPFromCandidate(candidate: string): string | null {
  const ipRegex = /(?:^|\s)(\d{1,3}(?:\.\d{1,3}){3})(?:\s|$)/;
  const ipv6Regex =
    /(?:^|\s)([0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){7})(?:\s|$)/;

  const ipv4Match = candidate.match(ipRegex);
  if (ipv4Match) return ipv4Match[1];

  const ipv6Match = candidate.match(ipv6Regex);
  if (ipv6Match) return ipv6Match[1];

  return null;
}

/**
 * Classify network interface type based on IP
 */
function classifyNetworkInterface(ip: string): NetworkInterface["type"] {
  // Private IP ranges
  if (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    (ip.startsWith("172.") &&
      parseInt(ip.split(".")[1]) >= 16 &&
      parseInt(ip.split(".")[1]) <= 31)
  ) {
    return "wifi"; // Most likely WiFi for private IPs
  }

  // Loopback
  if (ip.startsWith("127.") || ip === "::1") {
    return "unknown";
  }

  // Link-local
  if (ip.startsWith("169.254.") || ip.startsWith("fe80:")) {
    return "ethernet";
  }

  // Carrier-grade NAT
  if (
    ip.startsWith("100.") &&
    parseInt(ip.split(".")[1]) >= 64 &&
    parseInt(ip.split(".")[1]) <= 127
  ) {
    return "cellular";
  }

  // Public IP - could be any type
  return "unknown";
}

/**
 * Determine NAT type based on candidates
 */
function determineNATType(candidates: RTCIceCandidate[]): string {
  const hostCandidates = candidates.filter((c) => c.type === "host");
  const srflxCandidates = candidates.filter((c) => c.type === "srflx");
  const relayCandidates = candidates.filter((c) => c.type === "relay");

  if (hostCandidates.length === 0) {
    return "Symmetric NAT";
  }

  if (srflxCandidates.length === 0) {
    return "Blocked";
  }

  // Check if server reflexive candidates match host candidates
  const hostIPs = hostCandidates
    .map((c) => extractIPFromCandidate(c.candidate))
    .filter(Boolean);
  const srflxIPs = srflxCandidates
    .map((c) => extractIPFromCandidate(c.candidate))
    .filter(Boolean);

  if (hostIPs.some((ip) => srflxIPs.includes(ip))) {
    return "Open Internet";
  }

  if (srflxCandidates.length === 1) {
    return "Full Cone NAT";
  }

  if (relayCandidates.length > 0) {
    return "Symmetric NAT";
  }

  return "Port Restricted NAT";
}

/**
 * Get RTC capabilities
 */
function getRTCCapabilities(): WebRTCFingerprint["rtcCapabilities"] {
  const RTCPeerConnection = getRTCPeerConnection();
  if (!RTCPeerConnection) {
    return {
      codecs: [],
      headerExtensions: [],
      transports: [],
    };
  }

  const capabilities = {
    codecs: [] as RTCCodecCapability[],
    headerExtensions: [] as RTCHeaderExtensionCapability[],
    transports: [] as string[],
  };

  try {
    // Get sender capabilities (static method may not be available in all browsers)
    if ((RTCPeerConnection as any).getSenderCapabilities) {
      try {
        const audioCapabilities = (
          RTCPeerConnection as any
        ).getSenderCapabilities("audio");
        const videoCapabilities = (
          RTCPeerConnection as any
        ).getSenderCapabilities("video");

        if (audioCapabilities && audioCapabilities.codecs) {
          capabilities.codecs.push(...audioCapabilities.codecs);
        }
        if (audioCapabilities && audioCapabilities.headerExtensions) {
          capabilities.headerExtensions.push(
            ...audioCapabilities.headerExtensions
          );
        }

        if (videoCapabilities && videoCapabilities.codecs) {
          capabilities.codecs.push(...videoCapabilities.codecs);
        }
        if (videoCapabilities && videoCapabilities.headerExtensions) {
          capabilities.headerExtensions.push(
            ...videoCapabilities.headerExtensions
          );
        }
      } catch (capError) {
        console.warn("Error getting sender capabilities:", capError);
      }
    }

    // Get receiver capabilities (static method may not be available in all browsers)
    if ((RTCPeerConnection as any).getReceiverCapabilities) {
      try {
        const audioCapabilities = (
          RTCPeerConnection as any
        ).getReceiverCapabilities("audio");
        const videoCapabilities = (
          RTCPeerConnection as any
        ).getReceiverCapabilities("video");

        if (audioCapabilities && audioCapabilities.codecs) {
          capabilities.codecs.push(...audioCapabilities.codecs);
        }
        if (audioCapabilities && audioCapabilities.headerExtensions) {
          capabilities.headerExtensions.push(
            ...audioCapabilities.headerExtensions
          );
        }

        if (videoCapabilities && videoCapabilities.codecs) {
          capabilities.codecs.push(...videoCapabilities.codecs);
        }
        if (videoCapabilities && videoCapabilities.headerExtensions) {
          capabilities.headerExtensions.push(
            ...videoCapabilities.headerExtensions
          );
        }
      } catch (capError) {
        console.warn("Error getting receiver capabilities:", capError);
      }
    }

    // Deduplicate codecs and extensions
    const uniqueCodecs = capabilities.codecs.filter(
      (codec, index, array) =>
        array.findIndex(
          (c) =>
            c.mimeType === codec.mimeType && c.clockRate === codec.clockRate
        ) === index
    );

    const uniqueExtensions = capabilities.headerExtensions.filter(
      (ext, index, array) => array.findIndex((e) => e.uri === ext.uri) === index
    );

    capabilities.codecs = uniqueCodecs;
    capabilities.headerExtensions = uniqueExtensions;
    capabilities.transports = ["udp", "tcp"]; // Standard transports
  } catch (error) {
    console.warn("Error getting RTC capabilities:", error);
  }

  return capabilities;
}

/**
 * Collect local IPs using WebRTC
 */
async function collectLocalIPs(): Promise<{
  localIPs: string[];
  publicIP?: string;
  candidates: RTCIceCandidate[];
  iceGatheringTime: number;
  natType: string;
  networkInterfaces: NetworkInterface[];
}> {
  const RTCPeerConnection = getRTCPeerConnection();
  if (!RTCPeerConnection) {
    return {
      localIPs: [],
      candidates: [],
      iceGatheringTime: 0,
      natType: "Unknown",
      networkInterfaces: [],
    };
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    const localIPs: string[] = [];
    const candidates: RTCIceCandidate[] = [];
    const networkInterfaces: NetworkInterface[] = [];
    let publicIP: string | undefined;

    const pc = new RTCPeerConnection(createRTCConfiguration());

    // Add a dummy data channel to trigger ICE gathering
    pc.createDataChannel("fingerprint", { ordered: false });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        candidates.push(event.candidate);

        const ip = extractIPFromCandidate(event.candidate.candidate);
        if (ip && !localIPs.includes(ip)) {
          localIPs.push(ip);

          // Classify the network interface
          const networkInterface: NetworkInterface = {
            type: classifyNetworkInterface(ip),
            ip,
            family: ip.includes(":") ? "IPv6" : "IPv4",
            internal: isPrivateIP(ip),
          };

          networkInterfaces.push(networkInterface);

          // Check if this is a public IP
          if (!isPrivateIP(ip) && !publicIP) {
            publicIP = ip;
          }
        }
      }
    };

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") {
        const iceGatheringTime = Date.now() - startTime;
        const natType = determineNATType(candidates);

        pc.close();
        resolve({
          localIPs,
          publicIP,
          candidates,
          iceGatheringTime,
          natType,
          networkInterfaces,
        });
      }
    };

    // Create offer to start ICE gathering
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((error) => {
        console.warn("Error creating WebRTC offer:", error);
        pc.close();
        resolve({
          localIPs: [],
          candidates: [],
          iceGatheringTime: Date.now() - startTime,
          natType: "Unknown",
          networkInterfaces: [],
        });
      });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (pc.iceGatheringState !== "complete") {
        const iceGatheringTime = Date.now() - startTime;
        const natType = determineNATType(candidates);

        pc.close();
        resolve({
          localIPs,
          publicIP,
          candidates,
          iceGatheringTime,
          natType,
          networkInterfaces,
        });
      }
    }, 10000);
  });
}

/**
 * Check if IP is private/internal
 */
function isPrivateIP(ip: string): boolean {
  if (ip.includes(":")) {
    // IPv6 private ranges
    return (
      ip.startsWith("fe80:") ||
      ip.startsWith("fc00:") ||
      ip.startsWith("fd00:") ||
      ip === "::1"
    );
  }

  // IPv4 private ranges
  return (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    (ip.startsWith("172.") &&
      parseInt(ip.split(".")[1]) >= 16 &&
      parseInt(ip.split(".")[1]) <= 31) ||
    ip.startsWith("127.") ||
    ip.startsWith("169.254.")
  );
}

/**
 * Test STUN server responses
 */
async function testSTUNServers(): Promise<Record<string, any>> {
  const stunResponses: Record<string, any> = {};

  for (const stunServer of STUN_SERVERS.slice(0, 3)) {
    // Test first 3 to avoid too many requests
    try {
      const startTime = Date.now();

      const RTCPeerConnection = getRTCPeerConnection();
      if (!RTCPeerConnection) continue;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: stunServer }],
      });

      let resolved = false;

      const testPromise = new Promise<void>((resolve) => {
        pc.onicecandidate = (event) => {
          if (event.candidate && !resolved) {
            resolved = true;
            const responseTime = Date.now() - startTime;
            stunResponses[stunServer] = {
              responseTime,
              candidate: event.candidate.candidate,
              success: true,
            };
            pc.close();
            resolve();
          }
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            stunResponses[stunServer] = {
              responseTime: Date.now() - startTime,
              success: false,
              error: "timeout",
            };
            pc.close();
            resolve();
          }
        }, 5000);
      });

      pc.createDataChannel("test");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await testPromise;
    } catch (error) {
      stunResponses[stunServer] = {
        success: false,
        error: error instanceof Error ? error.message : "unknown error",
      };
    }
  }

  return stunResponses;
}

/**
 * Analyze connection types and protocols
 */
function analyzeConnectionTypes(candidates: RTCIceCandidate[]): {
  connectionTypes: string[];
  protocols: string[];
} {
  const connectionTypes = new Set<string>();
  const protocols = new Set<string>();

  candidates.forEach((candidate) => {
    // Extract connection type from candidate
    if (candidate.type) {
      connectionTypes.add(candidate.type);
    }

    // Extract protocol from candidate string
    const candidateStr = candidate.candidate.toLowerCase();
    if (candidateStr.includes("udp")) protocols.add("udp");
    if (candidateStr.includes("tcp")) protocols.add("tcp");
    if (candidateStr.includes("tls")) protocols.add("tls");
  });

  return {
    connectionTypes: Array.from(connectionTypes),
    protocols: Array.from(protocols),
  };
}

/**
 * Get RTC configuration details
 */
function getRTCConfigurationDetails(): {
  iceCandidatePoolSize: number;
  bundlePolicy: string;
  rtcpMuxPolicy: string;
  iceTransportPolicy: string;
  sdpSemantics: string;
} {
  const config = createRTCConfiguration();

  return {
    iceCandidatePoolSize: config.iceCandidatePoolSize || 0,
    bundlePolicy: config.bundlePolicy || "balanced",
    rtcpMuxPolicy: config.rtcpMuxPolicy || "negotiate",
    iceTransportPolicy: config.iceTransportPolicy || "all",
    sdpSemantics: "unified-plan", // Default SDP semantics
  };
}

/**
 * Main WebRTC fingerprinting function
 */
export async function collectWebRTCFingerprint(): Promise<WebRTCFingerprint> {
  if (!isBrowser() || !isWebRTCSupported()) {
    return {
      isSupported: false,
      localIPs: [],
      stunResponses: {},
      rtcCapabilities: {
        codecs: [],
        headerExtensions: [],
        transports: [],
      },
      iceGatheringTime: 0,
      candidateTypes: [],
      candidates: [],
      networkInterfaces: [],
      connectionTypes: [],
      protocols: [],
      stunServers: [],
      turnServers: [],
      iceCandidatePoolSize: 0,
      bundlePolicy: "",
      rtcpMuxPolicy: "",
      iceTransportPolicy: "",
      sdpSemantics: "",
      fingerprint: "",
      entropy: 0,
    };
  }

  try {
    // Collect local IPs and ICE candidates
    const {
      localIPs,
      publicIP,
      candidates,
      iceGatheringTime,
      natType,
      networkInterfaces,
    } = await collectLocalIPs();

    // Test STUN servers
    const stunResponses = await testSTUNServers();

    // Get RTC capabilities
    const rtcCapabilities = getRTCCapabilities();

    // Analyze connection types and protocols
    const { connectionTypes, protocols } = analyzeConnectionTypes(candidates);

    // Get configuration details
    const configDetails = getRTCConfigurationDetails();

    // Extract candidate types - convert Set to Array safely
    const candidateTypeSet = new Set<string>();
    candidates.forEach((c) => {
      if (c.type) {
        candidateTypeSet.add(c.type);
      }
    });
    const candidateTypes = Array.from(candidateTypeSet);

    // Create fingerprint data
    const fingerprintData = {
      localIPs,
      publicIP,
      rtcCapabilities,
      candidateTypes,
      natType,
      networkInterfaces,
      connectionTypes,
      protocols,
      stunServers: STUN_SERVERS,
      turnServers: TURN_SERVERS,
      stunResponses,
      iceGatheringTime,
      ...configDetails,
    };

    // Generate fingerprint hash
    const fingerprint = await hashData(JSON.stringify(fingerprintData));

    // Calculate entropy
    const combinedData = JSON.stringify(fingerprintData);
    const entropy = new Set(combinedData).size / combinedData.length;

    return {
      isSupported: true,
      localIPs,
      publicIP,
      stunResponses,
      rtcCapabilities,
      iceGatheringTime,
      candidateTypes,
      candidates,
      natType,
      networkInterfaces,
      connectionTypes,
      protocols,
      stunServers: STUN_SERVERS,
      turnServers: TURN_SERVERS,
      iceCandidatePoolSize: configDetails.iceCandidatePoolSize,
      bundlePolicy: configDetails.bundlePolicy,
      rtcpMuxPolicy: configDetails.rtcpMuxPolicy,
      iceTransportPolicy: configDetails.iceTransportPolicy,
      sdpSemantics: configDetails.sdpSemantics,
      fingerprint,
      entropy: Math.round(entropy * 1000) / 1000,
    };
  } catch (error) {
    console.warn("Error collecting WebRTC fingerprint:", error);

    return {
      isSupported: true,
      localIPs: [],
      stunResponses: {},
      rtcCapabilities: {
        codecs: [],
        headerExtensions: [],
        transports: [],
      },
      iceGatheringTime: 0,
      candidateTypes: [],
      candidates: [],
      networkInterfaces: [],
      connectionTypes: [],
      protocols: [],
      stunServers: STUN_SERVERS,
      turnServers: TURN_SERVERS,
      iceCandidatePoolSize: 0,
      bundlePolicy: "",
      rtcpMuxPolicy: "",
      iceTransportPolicy: "",
      sdpSemantics: "",
      fingerprint: "",
      entropy: 0,
    };
  }
}
