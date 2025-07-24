/**
 * Utility functions for fingerprint collection
 */

/**
 * Generate a secure hash from data
 */
export function hashData(data: string): string {
  // Simple hash function - in production, use a proper crypto library
  let hash = 0;
  if (data.length === 0) return hash.toString();

  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Calculate SHA-256 hash using Web Crypto API
 */
export async function calculateSHA256(data: string): Promise<string> {
  if (!isBrowser() || !window.crypto?.subtle) {
    // Fallback to simple hash if crypto API not available
    return hashData(data);
  }

  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", dataBuffer);
    return arrayBufferToHex(hashBuffer);
  } catch (error) {
    // Fallback to simple hash on error
    return hashData(data);
  }
}

/**
 * Safe feature detection with error handling
 */
export function safeFeatureDetect<T>(
  detector: () => T,
  fallback: T,
  errorHandler?: (error: Error) => void
): T {
  try {
    return detector();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error as Error);
    }
    return fallback;
  }
}

/**
 * Check if running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Check if running in a web worker
 */
export function isWebWorker(): boolean {
  return (
    typeof self !== "undefined" &&
    typeof (self as any).importScripts === "function"
  );
}

/**
 * Debounce function to prevent rapid repeated calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Create a promise that resolves after a delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap an async function with a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: string = "Operation timed out"
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutError)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Safe JSON stringify with error handling
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return "[Circular]";
  }
}

/**
 * Check if a value is null or undefined
 */
export function isNullish(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Generate a random string
 */
export function randomString(length: number = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get a consistent timestamp
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * Convert an array buffer to hex string
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  return Array.from(uint8Array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Calculate entropy of a string
 */
export function calculateEntropy(str: string): number {
  if (!str) return 0;

  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  const length = str.length;
  let entropy = 0;

  for (const count of Object.values(freq)) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * Check if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  if (!isBrowser()) return false;

  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl") ||
      canvas.getContext("webgl2")
    );
  } catch {
    return false;
  }
}

/**
 * Check if Audio API is supported
 */
export function isAudioAPISupported(): boolean {
  if (!isBrowser()) return false;

  return !!(
    window.AudioContext ||
    (window as any).webkitAudioContext ||
    (window as any).mozAudioContext
  );
}

/**
 * Check if WebRTC is supported
 */
export function isWebRTCSupported(): boolean {
  if (!isBrowser()) return false;

  return !!(
    window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  );
}

/**
 * Check if device orientation is supported
 */
export function isDeviceOrientationSupported(): boolean {
  if (!isBrowser()) return false;

  return "DeviceOrientationEvent" in window;
}

/**
 * Check if device motion is supported
 */
export function isDeviceMotionSupported(): boolean {
  if (!isBrowser()) return false;

  return "DeviceMotionEvent" in window;
}

/**
 * Check if touch is supported
 */
export function isTouchSupported(): boolean {
  if (!isBrowser()) return false;

  return !!(
    "ontouchstart" in window ||
    ((window as any).DocumentTouch &&
      document instanceof (window as any).DocumentTouch) ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get screen information safely
 */
export function getScreenInfo() {
  if (!isBrowser()) return null;

  return safeFeatureDetect(
    () => ({
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio || 1,
    }),
    null
  );
}

/**
 * Get timezone information
 */
export function getTimezoneInfo() {
  if (!isBrowser()) return null;

  return safeFeatureDetect(
    () => ({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      locale: navigator.language,
    }),
    null
  );
}

/**
 * Get user agent information safely
 */
export function getUserAgentInfo() {
  if (!isBrowser()) return null;

  return safeFeatureDetect(
    () => ({
      userAgent: navigator.userAgent,
      appVersion: navigator.appVersion,
      platform: navigator.platform,
      vendor: navigator.vendor,
      product: (navigator as any).product,
      productSub: (navigator as any).productSub,
      vendorSub: (navigator as any).vendorSub,
      buildID: (navigator as any).buildID,
      oscpu: (navigator as any).oscpu,
    }),
    null
  );
}

/**
 * Check if script is running in an automated environment
 */
export function isAutomated(): boolean {
  if (!isBrowser()) return false;

  return safeFeatureDetect(() => {
    // Check for common automation indicators
    return !!(
      (window as any).webdriver ||
      (window as any).__webdriver_evaluate ||
      (window as any).__selenium_evaluate ||
      (window as any).__webdriver_script_function ||
      (window as any).__webdriver_script_func ||
      (window as any).__webdriver_script_fn ||
      (window as any).__fxdriver_evaluate ||
      (window as any).__driver_unwrapped ||
      (window as any).__webdriver_unwrapped ||
      (window as any).__driver_evaluate ||
      (window as any).__selenium_unwrapped ||
      (window as any).__fxdriver_unwrapped ||
      navigator.webdriver ||
      (window as any).domAutomation ||
      (window as any).domAutomationController ||
      (window as any)._phantom ||
      (window as any).phantom ||
      (window as any).Buffer ||
      (window as any).emit ||
      (window as any).spawn
    );
  }, false);
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  return {
    result,
    duration: end - start,
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i === maxRetries) {
        throw lastError;
      }

      const delayTime = baseDelay * Math.pow(2, i);
      await delay(delayTime);
    }
  }

  throw lastError!;
}
