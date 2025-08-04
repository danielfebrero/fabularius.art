"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DeviceInfo, detectDeviceClientSide } from "@/lib/deviceUtils";

interface DeviceContextType extends DeviceInfo {
  isMobileInterface: boolean; // true for both mobile and tablet
}

const DeviceContext = createContext<DeviceContextType | null>(null);

interface DeviceProviderProps {
  children: React.ReactNode;
  // Initial device info from server-side detection
  initialDeviceInfo?: DeviceInfo;
}

export function DeviceProvider({
  children,
  initialDeviceInfo,
}: DeviceProviderProps) {
  console.log("DeviceProvider initialized with:", initialDeviceInfo);

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Always prefer server-side detection when available
    if (initialDeviceInfo) {
      console.log("Using server-side device detection:", initialDeviceInfo);
      return initialDeviceInfo;
    }
    // Only use client-side as absolute fallback
    console.log("Falling back to client-side device detection");
    const clientSideInfo = detectDeviceClientSide();
    console.log("Client-side detection result:", clientSideInfo);
    return clientSideInfo;
  });

  useEffect(() => {
    // Only use resize handling if we don't have server-side detection
    // Server-side user agent detection is more reliable and doesn't change
    if (!initialDeviceInfo) {
      const updateDeviceInfo = () => {
        const newDeviceInfo = detectDeviceClientSide();
        console.log("Device info updated (resize):", newDeviceInfo);
        setDeviceInfo(newDeviceInfo);
      };

      // Only add resize listener if relying on client-side detection
      window.addEventListener("resize", updateDeviceInfo);
      return () => window.removeEventListener("resize", updateDeviceInfo);
    }
    // No cleanup needed if we're trusting server-side detection
  }, [initialDeviceInfo]);

  const contextValue: DeviceContextType = {
    ...deviceInfo,
    isMobileInterface: deviceInfo.isMobile || deviceInfo.isTablet,
  };

  console.log("DeviceContext value:", contextValue);

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice(): DeviceContextType {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
}

/**
 * Hook that returns true for mobile phones and tablets
 * This replaces the old useIsMobile hook with better device detection
 */
export function useIsMobile(): boolean {
  const { isMobileInterface } = useDevice();
  return isMobileInterface;
}

/**
 * Hook that returns true only for mobile phones (excludes tablets)
 */
export function useIsMobilePhone(): boolean {
  const { isMobile } = useDevice();
  return isMobile;
}

/**
 * Hook that returns true only for tablets
 */
export function useIsTablet(): boolean {
  const { isTablet } = useDevice();
  return isTablet;
}

/**
 * Hook that returns true for desktop devices
 */
export function useIsDesktop(): boolean {
  const { isDesktop } = useDevice();
  return isDesktop;
}
