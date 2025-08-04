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
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Always prefer server-side detection when available
    if (initialDeviceInfo) {
      return initialDeviceInfo;
    }
    // Only use client-side as absolute fallback
    const clientSideInfo = detectDeviceClientSide();
    return clientSideInfo;
  });

  // Re-validate device info on client-side after hydration
  useEffect(() => {
    const validateDeviceInfo = () => {
      const clientSideInfo = detectDeviceClientSide();

      // If server-side detection differs significantly from client-side,
      // prefer client-side for better accuracy
      if (
        clientSideInfo.isMobile !== deviceInfo.isMobile ||
        clientSideInfo.isTablet !== deviceInfo.isTablet ||
        clientSideInfo.isDesktop !== deviceInfo.isDesktop
      ) {
        console.log("Device detection mismatch, updating:", {
          server: deviceInfo,
          client: clientSideInfo,
          initialDeviceInfo,
        });
        setDeviceInfo(clientSideInfo);
      }
    };

    // Validate on mount and after a short delay to ensure proper hydration
    validateDeviceInfo();
    const timeoutId = setTimeout(validateDeviceInfo, 100);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDeviceInfo]); // Only run once on mount

  useEffect(() => {
    // Always add resize and orientation change handlers to handle edge cases
    // like screen rotation or window resizing that might affect mobile interface
    const updateDeviceInfo = () => {
      const newDeviceInfo = detectDeviceClientSide();

      // Only update if there's an actual change to prevent unnecessary re-renders
      if (
        newDeviceInfo.isMobile !== deviceInfo.isMobile ||
        newDeviceInfo.isTablet !== deviceInfo.isTablet ||
        newDeviceInfo.isDesktop !== deviceInfo.isDesktop
      ) {
        console.log("Device info updated due to resize/orientation:", {
          old: deviceInfo,
          new: newDeviceInfo,
        });
        setDeviceInfo(newDeviceInfo);
      }
    };

    // Add both resize and orientation change listeners
    window.addEventListener("resize", updateDeviceInfo);
    window.addEventListener("orientationchange", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);
    };
  }, [deviceInfo]);

  const contextValue: DeviceContextType = {
    ...deviceInfo,
    isMobileInterface: deviceInfo.isMobile || deviceInfo.isTablet,
  };

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
