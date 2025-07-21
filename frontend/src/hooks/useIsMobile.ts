import { useEffect, useState } from "react";

/**
 * Hook to detect if the user is on a mobile device based on screen width and touch capability.
 * Returns true when viewport is <= 768px and device supports touch.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      // 768px threshold covers typical mobile/tablet breakpoints
      const isTouch =
        typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0);

      const isSmallScreen =
        typeof window !== "undefined" && window.innerWidth <= 768;

      setIsMobile(!!(isTouch && isSmallScreen));
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return isMobile;
}
