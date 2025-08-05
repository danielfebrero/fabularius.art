"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DeviceInfo,
  detectDeviceClientSideWithViewport,
} from "@/lib/deviceUtils";

interface DeviceContextType extends DeviceInfo {
  isMobileInterface: boolean; // true for both mobile and tablet
}

const DeviceContext = createContext<DeviceContextType | null>(null);

interface DeviceProviderProps {
  children: React.ReactNode;
  initialDeviceInfo?: DeviceInfo;
}

export function DeviceProvider({
  children,
  initialDeviceInfo,
}: DeviceProviderProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === "undefined") {
      return (
        initialDeviceInfo || {
          isMobile: false,
          isTablet: false,
          isDesktop: true,
        }
      );
    }

    const clientSideInfo = detectDeviceClientSideWithViewport();
    const isMobile =
      initialDeviceInfo?.isMobile || false || clientSideInfo.isMobile;
    const isTablet =
      initialDeviceInfo?.isTablet || false || clientSideInfo.isTablet;
    const isDesktop = !isMobile && !isTablet;

    return { isMobile, isTablet, isDesktop };
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const clientSideInfo = detectDeviceClientSideWithViewport();
      const isMobile =
        initialDeviceInfo?.isMobile || false || clientSideInfo.isMobile;
      const isTablet =
        initialDeviceInfo?.isTablet || false || clientSideInfo.isTablet;
      const isDesktop = !isMobile && !isTablet;

      const newDeviceInfo = { isMobile, isTablet, isDesktop };

      if (
        newDeviceInfo.isMobile !== deviceInfo.isMobile ||
        newDeviceInfo.isTablet !== deviceInfo.isTablet ||
        newDeviceInfo.isDesktop !== deviceInfo.isDesktop
      ) {
        setDeviceInfo(newDeviceInfo);
      }
    };

    updateDeviceInfo();

    window.addEventListener("resize", updateDeviceInfo);
    window.addEventListener("orientationchange", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);
    };
  }, [
    deviceInfo.isMobile,
    deviceInfo.isTablet,
    deviceInfo.isDesktop,
    initialDeviceInfo,
  ]);

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

export function useIsMobile(): boolean {
  const { isMobileInterface } = useDevice();
  return isMobileInterface;
}

export function useIsMobilePhone(): boolean {
  const { isMobile } = useDevice();
  return isMobile;
}

export function useIsTablet(): boolean {
  const { isTablet } = useDevice();
  return isTablet;
}

export function useIsDesktop(): boolean {
  const { isDesktop } = useDevice();
  return isDesktop;
}
