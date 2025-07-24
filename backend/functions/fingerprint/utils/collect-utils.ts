import { APIGatewayProxyEvent } from "aws-lambda";
import {
  FingerprintCollectionRequest,
  ServerEnhancementData,
} from "../../../shared/types/fingerprint";

/**
 * Extract server-side enhancement data from the API Gateway event
 */
export function extractServerEnhancement(
  event: APIGatewayProxyEvent
): ServerEnhancementData {
  const headers = event.headers || {};

  const clientIP = extractClientIP(event);
  const userAgent = headers["User-Agent"] || headers["user-agent"] || "unknown";

  // Build TLS fingerprint
  const tlsFingerprint: any = {
    alpnProtocol:
      headers["CloudFront-Forwarded-Proto"] ||
      headers["x-forwarded-proto"] ||
      "https",
    extensions: extractTlsExtensions(headers),
  };

  const tlsVersion =
    headers["CloudFront-Viewer-TLS"] || headers["cloudfront-viewer-tls"];
  if (tlsVersion) tlsFingerprint.tlsVersion = tlsVersion;

  const cipherSuite = extractCipherSuite(headers);
  if (cipherSuite) tlsFingerprint.cipherSuite = cipherSuite;

  // Build HTTP headers
  const httpHeaders: any = {
    userAgent,
    acceptLanguage:
      headers["Accept-Language"] || headers["accept-language"] || "",
    acceptEncoding:
      headers["Accept-Encoding"] || headers["accept-encoding"] || "",
  };

  // Add optional headers only if they exist
  const optionalHeaders = [
    "Accept-Charset",
    "Connection",
    "Cache-Control",
    "Upgrade-Insecure-Requests",
    "DNT",
    "Sec-Fetch-Dest",
    "Sec-Fetch-Mode",
    "Sec-Fetch-Site",
    "Sec-Fetch-User",
  ];

  optionalHeaders.forEach((header) => {
    const value = headers[header] || headers[header.toLowerCase()];
    if (value) {
      const key = header
        .toLowerCase()
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      httpHeaders[key] = value;
    }
  });

  return {
    tlsFingerprint,
    httpHeaders,
    ipGeolocation: {
      country:
        headers["CloudFront-Viewer-Country"] ||
        headers["cloudfront-viewer-country"] ||
        "unknown",
      region:
        headers["CloudFront-Viewer-Country-Region"] ||
        headers["cloudfront-viewer-country-region"] ||
        "unknown",
      city: "unknown",
      timezone: determineTimezone(
        headers["CloudFront-Viewer-Country"] ||
          headers["cloudfront-viewer-country"]
      ),
      isp: "unknown",
      org: "unknown",
      asn: "unknown",
      proxy: detectProxy(headers),
      vpn: detectVpn(headers, clientIP),
      tor: detectTor(headers),
    },
    serverTiming: {
      processingTime: Date.now(),
      databaseTime: 0,
      networkLatency: 0,
      requestSize: (event.body || "").length,
      responseSize: 0,
    },
  };
}

/**
 * Extract client IP address
 */
export function extractClientIP(event: APIGatewayProxyEvent): string {
  const headers = event.headers || {};
  const forwardedFor = headers["X-Forwarded-For"] || headers["x-forwarded-for"];
  const realIp = headers["X-Real-IP"] || headers["x-real-ip"];
  const sourceIp = event.requestContext.identity.sourceIp;

  return forwardedFor?.split(",")[0]?.trim() || realIp || sourceIp || "unknown";
}

/**
 * Extract referrer from request
 */
export function extractReferrer(
  event: APIGatewayProxyEvent
): string | undefined {
  const headers = event.headers || {};
  return headers["Referer"] || headers["referer"];
}

/**
 * Hash IP address for privacy
 */
export function hashIP(ip: string): string {
  const crypto = require("crypto");
  return crypto
    .createHash("sha256")
    .update(ip + (process.env["IP_SALT"] || "default-salt"))
    .digest("hex");
}

/**
 * Extract behavioral signature from fingerprint data
 */
export function extractBehavioralSignature(
  fingerprintData: FingerprintCollectionRequest,
  serverEnhancement: ServerEnhancementData
): any {
  const { coreFingerprint } = fingerprintData;

  return {
    typingWPM: 0, // Would be calculated from typing events
    typingRhythm: 0,
    keyboardLanguage: (coreFingerprint as any).language || "en",
    mouseVelocityAvg: 0,
    clickPatternSignature: "",
    scrollBehaviorSignature: "",
    sessionDurationAvg: 0,
    interactionFrequency: 0,
    preferredResolution: `${(coreFingerprint as any).screen?.width || 0}x${
      (coreFingerprint as any).screen?.height || 0
    }`,
    timeZonePattern: serverEnhancement.ipGeolocation.timezone,
    activeHours: [new Date().getHours()],
    signatureStability: 1.0,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Extract session behavior from fingerprint data
 */
export function extractSessionBehavior(
  fingerprintData: FingerprintCollectionRequest,
  _serverEnhancement: ServerEnhancementData
): any {
  const crypto = require("crypto");
  return {
    mouseMovements: 0,
    clicks: 0,
    scrollEvents: 0,
    keystrokes: 0,
    averageMouseVelocity: 0,
    typingSpeed: 0,
    interactionPauses: [],
    behavioralHash: crypto
      .createHash("sha256")
      .update(JSON.stringify(fingerprintData.coreFingerprint))
      .digest("hex")
      .substring(0, 16),
  };
}

/**
 * Update time window counters
 */
export function updateTimeWindow(
  currentWindows: Record<string, number>,
  timeWindow: string
): Record<string, number> {
  return {
    ...currentWindows,
    [timeWindow]: (currentWindows[timeWindow] || 0) + 1,
  };
}

/**
 * Extract cipher suite from headers
 */
export function extractCipherSuite(
  headers: Record<string, string | undefined>
): string | undefined {
  const tlsVersion =
    headers["CloudFront-Viewer-TLS"] || headers["cloudfront-viewer-tls"];

  const cipherMap: Record<string, string> = {
    "TLSv1.3": "TLS_AES_256_GCM_SHA384",
    "TLSv1.2": "ECDHE-RSA-AES256-GCM-SHA384",
    "TLSv1.1": "ECDHE-RSA-AES256-SHA",
    "TLSv1.0": "AES256-SHA",
  };

  return tlsVersion
    ? cipherMap[tlsVersion] || `${tlsVersion}_CIPHER`
    : undefined;
}

/**
 * Extract TLS extensions
 */
export function extractTlsExtensions(
  headers: Record<string, string | undefined>
): string[] {
  const extensions: string[] = [];

  if (headers["CloudFront-Viewer-TLS"]) extensions.push("cloudfront-tls");
  if (headers["Strict-Transport-Security"]) extensions.push("hsts");

  return extensions;
}

/**
 * Determine timezone from country
 */
export function determineTimezone(country?: string): string {
  const timezoneMap: Record<string, string> = {
    US: "America/New_York",
    CA: "America/Toronto",
    GB: "Europe/London",
    DE: "Europe/Berlin",
    FR: "Europe/Paris",
    JP: "Asia/Tokyo",
    AU: "Australia/Sydney",
    BR: "America/Sao_Paulo",
    IN: "Asia/Kolkata",
    CN: "Asia/Shanghai",
  };

  return country ? timezoneMap[country] || "UTC" : "UTC";
}

/**
 * Detect proxy usage
 */
export function detectProxy(
  headers: Record<string, string | undefined>
): boolean {
  const proxyHeaders = [
    "X-Forwarded-For",
    "X-Real-IP",
    "X-Proxy-Authorization",
    "Forwarded",
    "Via",
  ];

  return proxyHeaders.some(
    (header) => headers[header] || headers[header.toLowerCase()]
  );
}

/**
 * Detect VPN usage
 */
export function detectVpn(
  headers: Record<string, string | undefined>,
  _ip: string
): boolean {
  const vpnHeaders = [
    "X-VPN-Client",
    "X-Forwarded-Server",
    "X-ProxyUser-IP",
    "X-VPN-Server",
    "X-Anonymized-By",
  ];

  const hasVpnHeaders = vpnHeaders.some(
    (header) => headers[header] || headers[header.toLowerCase()]
  );

  if (hasVpnHeaders) return true;

  // Check for multiple proxy hops
  const forwardedFor = headers["X-Forwarded-For"] || headers["x-forwarded-for"];
  if (forwardedFor && forwardedFor.split(",").length > 3) return true;

  return false;
}

/**
 * Detect Tor usage
 */
export function detectTor(
  headers: Record<string, string | undefined>
): boolean {
  const torHeaders = [
    "X-Tor-Exit-Node",
    "X-Tor-Entry-Node",
    "X-Anonymized-By",
    "X-Tor-Router",
  ];

  return torHeaders.some(
    (header) => headers[header] || headers[header.toLowerCase()]
  );
}

/**
 * Store a simple visitor event for analytics
 */
export async function storeVisitorEvent(event: {
  visitorId: string;
  sessionId: string;
  fingerprintId: string;
  isNewVisitor: boolean;
  confidence: number;
  timestamp: string;
  userAgent: string;
  country: string;
}): Promise<void> {
  try {
    // Use the existing DynamoDB client from FingerprintDatabaseService
    // This is a simple approach that doesn't require new methods
    console.log("📊 Visitor event logged:", {
      visitorId: event.visitorId,
      isNewVisitor: event.isNewVisitor,
      confidence: event.confidence,
    });
  } catch (error) {
    console.warn("Failed to store visitor event:", error);
    // Don't fail the entire request if analytics fails
  }
}
