"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface NavigationLoadingContextType {
  isNavigating: boolean;
  destinationType: "media" | "album" | null;
  startNavigation: (type: "media" | "album") => void;
  stopNavigation: () => void;
}

const NavigationLoadingContext = createContext<
  NavigationLoadingContextType | undefined
>(undefined);

export function NavigationLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [destinationType, setDestinationType] = useState<
    "media" | "album" | null
  >(null);
  const pathname = usePathname();

  // Hide skeleton when URL actually changes in browser address bar
  useEffect(() => {
    if (isNavigating) {
      setIsNavigating(false);
      setDestinationType(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const startNavigation = (type: "media" | "album") => {
    setIsNavigating(true);
    setDestinationType(type);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setDestinationType(null);
  };

  return (
    <NavigationLoadingContext.Provider
      value={{
        isNavigating,
        destinationType,
        startNavigation,
        stopNavigation,
      }}
    >
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (context === undefined) {
    throw new Error(
      "useNavigationLoading must be used within a NavigationLoadingProvider"
    );
  }
  return context;
}
