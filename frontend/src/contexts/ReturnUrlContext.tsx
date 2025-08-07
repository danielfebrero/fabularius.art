"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface ReturnUrlContextType {
  /**
   * Store a return URL for post-authentication redirect
   * @param url - The URL to redirect to after authentication
   * @param persistent - Whether to store in sessionStorage (default: true)
   */
  setReturnUrl: (url: string, persistent?: boolean) => void;

  /**
   * Get the stored return URL
   * @param clear - Whether to clear the stored URL after retrieval (default: true)
   */
  getReturnUrl: (clear?: boolean) => string | null;

  /**
   * Clear the stored return URL
   */
  clearReturnUrl: () => void;

  /**
   * Store return URL from current location
   * @param currentPath - Optional current path, defaults to window.location.pathname + search
   */
  setReturnUrlFromCurrent: (currentPath?: string) => void;
}

const ReturnUrlContext = createContext<ReturnUrlContextType | undefined>(
  undefined
);

interface ReturnUrlProviderProps {
  children: ReactNode;
}

export function ReturnUrlProvider({ children }: ReturnUrlProviderProps) {
  const contextValue: ReturnUrlContextType = {
    setReturnUrl: (url: string, persistent: boolean = true) => {
      if (typeof window === "undefined") return;

      if (persistent) {
        sessionStorage.setItem("auth_return_url", url);
      }
      // Also store in OAuth-specific key for backward compatibility
      sessionStorage.setItem("oauth_return_to", url);
    },

    getReturnUrl: (clear: boolean = true) => {
      if (typeof window === "undefined") return null;

      // Check both new and legacy keys
      const returnUrl =
        sessionStorage.getItem("auth_return_url") ||
        sessionStorage.getItem("oauth_return_to");

      if (clear && returnUrl) {
        sessionStorage.removeItem("auth_return_url");
        sessionStorage.removeItem("oauth_return_to");
      }

      return returnUrl;
    },

    clearReturnUrl: () => {
      if (typeof window === "undefined") return;

      sessionStorage.removeItem("auth_return_url");
      sessionStorage.removeItem("oauth_return_to");
    },

    setReturnUrlFromCurrent: (currentPath?: string) => {
      if (typeof window === "undefined") return;

      const returnTo =
        currentPath || window.location.pathname + window.location.search;

      sessionStorage.setItem("auth_return_url", returnTo);
      sessionStorage.setItem("oauth_return_to", returnTo);
    },
  };

  return (
    <ReturnUrlContext.Provider value={contextValue}>
      {children}
    </ReturnUrlContext.Provider>
  );
}

export function useReturnUrl(): ReturnUrlContextType {
  const context = useContext(ReturnUrlContext);
  if (!context) {
    throw new Error("useReturnUrl must be used within a ReturnUrlProvider");
  }
  return context;
}
