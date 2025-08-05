import MobileDetect from "mobile-detect";

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Server-side device detection using user agent string
 * @param userAgent - The user agent string from request headers
 * @returns DeviceInfo object with device type flags
 */
export function detectDevice(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    // Fallback for missing user agent - assume desktop
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const md = new MobileDetect(userAgent);
  const rawMobile = !!md.mobile();
  const rawTablet = !!md.tablet();

  const isMobile = rawMobile && !rawTablet; // Mobile excludes tablets
  const isTablet = rawTablet;
  const isDesktop = !rawMobile && !rawTablet; // Desktop is anything that's not mobile and not tablet

  const result = {
    isMobile,
    isTablet,
    isDesktop,
  };

  return result;
}

/**
 * Determines if device should use mobile interface
 * This includes both mobile phones and tablets
 * @param userAgent - The user agent string from request headers
 * @returns true if device should use mobile interface (phones or tablets)
 */
export function isMobileInterface(userAgent: string | null): boolean {
  const { isMobile, isTablet } = detectDevice(userAgent);
  return isMobile || isTablet;
}

/**
 * Client-side fallback for device detection
 * Used when server-side detection is not available
 * Uses multiple detection methods for robustness:
 * - Touch events and maxTouchPoints
 * - User agent string patterns
 * - Screen orientation API
 * - CSS media queries for pointer precision
 * @returns DeviceInfo object based on combined detection methods
 */
export function detectDeviceClientSide(): DeviceInfo {
  if (typeof window === "undefined") {
    // Server-side fallback
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const screenWidth = window.innerWidth;

  // Check for mouse/pointer capability to distinguish tablets from desktops
  const hasMouseSupport = window.matchMedia("(pointer: fine)").matches;

  // Additional mobile/tablet detection methods for edge cases where touch detection fails
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUserAgent =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );

  // Screen orientation API as additional indicator for mobile devices
  const hasOrientationAPI =
    typeof window.orientation !== "undefined" ||
    (screen && typeof screen.orientation !== "undefined");

  // Combine multiple detection methods for better accuracy
  const isTouchDevice = isTouch || isMobileUserAgent || hasOrientationAPI;

  // Use screen size breakpoints to determine device type
  // Mobile: <= 640px (with touch indicators)
  // Tablet: > 640px (with touch indicators but no mouse/fine pointer)
  // Desktop: has mouse/fine pointer capability AND no mobile indicators

  const isMobile = isTouchDevice && screenWidth <= 640;
  const isTablet = isTouchDevice && screenWidth > 640 && !hasMouseSupport;
  const isDesktop = !isTouchDevice || hasMouseSupport;

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Viewport breakpoints for device detection
 */
export const VIEWPORT_BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
} as const;

/**
 * Check if current viewport width indicates mobile device
 * @returns true if viewport width is <= 640px
 */
export function isViewportMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= VIEWPORT_BREAKPOINTS.MOBILE;
}

/**
 * Check if current viewport width indicates tablet device
 * @returns true if viewport width is > 640px and <= 1024px
 */
export function isViewportTablet(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth > VIEWPORT_BREAKPOINTS.MOBILE &&
    window.innerWidth <= VIEWPORT_BREAKPOINTS.TABLET
  );
}

/**
 * Check if current viewport width indicates desktop device
 * @returns true if viewport width is > 1024px
 */
export function isViewportDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth > VIEWPORT_BREAKPOINTS.TABLET;
}

/**
 * Get current viewport width safely
 * @returns current viewport width or 0 if not available
 */
export function getViewportWidth(): number {
  if (typeof window === "undefined") return 0;
  return window.innerWidth;
}

/**
 * Enhanced client-side device detection that includes viewport considerations
 * Combines user agent detection with viewport-based detection for better accuracy
 * @returns DeviceInfo object with comprehensive device detection
 */
export function detectDeviceClientSideWithViewport(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const clientSideInfo = detectDeviceClientSide();

  // Apply priority rules for device detection
  // Mobile if: client-side detects mobile OR small viewport
  const isMobile = clientSideInfo.isMobile || isViewportMobile();

  // Tablet if: client-side detects tablet (but not if mobile is true)
  const isTablet = (clientSideInfo.isTablet || isViewportTablet()) && !isMobile;

  // Desktop is fallback when neither mobile nor tablet
  const isDesktop = !isMobile && !isTablet;

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}
