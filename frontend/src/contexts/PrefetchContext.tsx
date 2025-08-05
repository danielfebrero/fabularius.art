"use client";

import React, { createContext, useContext, useRef, ReactNode } from "react";

interface PrefetchContextType {
  isPrefetching: (key: string) => boolean;
  startPrefetch: (keys: string[], promise: Promise<void>) => void;
  endPrefetch: (keys: string[]) => void;
  waitForPrefetch: (key: string) => Promise<void>;
}

const PrefetchContext = createContext<PrefetchContextType | undefined>(
  undefined
);

interface PrefetchProviderProps {
  children: ReactNode;
}

export function PrefetchProvider({ children }: PrefetchProviderProps) {
  const prefetchingKeys = useRef(new Set<string>());
  const prefetchPromises = useRef(new Map<string, Promise<void>>());

  const contextValue: PrefetchContextType = {
    isPrefetching: (key: string) => prefetchingKeys.current.has(key),

    startPrefetch: (keys: string[], promise: Promise<void>) => {
      keys.forEach((key) => {
        prefetchingKeys.current.add(key);
        prefetchPromises.current.set(key, promise);
      });
    },

    endPrefetch: (keys: string[]) => {
      keys.forEach((key) => {
        prefetchingKeys.current.delete(key);
        prefetchPromises.current.delete(key);
      });
    },

    waitForPrefetch: async (key: string) => {
      const promise = prefetchPromises.current.get(key);
      if (promise) {
        await promise;
      }
    },
  };

  return (
    <PrefetchContext.Provider value={contextValue}>
      {children}
    </PrefetchContext.Provider>
  );
}

export function usePrefetchContext(): PrefetchContextType {
  const context = useContext(PrefetchContext);
  if (!context) {
    throw new Error(
      "usePrefetchContext must be used within a PrefetchProvider"
    );
  }
  return context;
}
