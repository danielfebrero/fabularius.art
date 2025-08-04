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
 * @returns DeviceInfo object based on screen size and touch capability
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

  // Use screen size breakpoints to determine device type
  // Mobile: <= 640px
  // Tablet: 641px - 1024px (with touch)
  // Desktop: > 1024px or no touch

  const isMobile = isTouch && screenWidth <= 640;
  const isTablet = isTouch && screenWidth > 640 && screenWidth <= 1024;
  const isDesktop = !isTouch || screenWidth > 1024;

  return {
    isMobile,
    isTablet,
    isDesktop: isDesktop && !isMobile && !isTablet,
  };
}
