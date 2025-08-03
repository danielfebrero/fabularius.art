import { useEffect, useState } from "react";
import { detectDeviceClientSide } from "@/lib/deviceUtils";

/**
 * Hook to detect if the user is on a mobile device (phone or tablet).
 * This hook provides backward compatibility while using improved device detection.
 * 
 * @deprecated Consider using useDevice() from DeviceContext for more granular control
 * @returns true for mobile phones and tablets
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      const deviceInfo = detectDeviceClientSide();
      // Include both mobile phones and tablets for mobile interface
      setIsMobile(deviceInfo.isMobile || deviceInfo.isTablet);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return isMobile;
}
