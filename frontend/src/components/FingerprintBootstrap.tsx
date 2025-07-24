"use client";
import { useEffect } from "react";
import { FingerprintCollector } from "@/lib/fingerprint/collector";

// Extend the Window interface for TypeScript safety
declare global {
  interface Window {
    __fingerprint_collected?: boolean;
  }
}
/**
 * FingerprintBootstrap
 * Initializes visitor fingerprinting on first app load (client-side only).
 */
export default function FingerprintBootstrap() {
  useEffect(() => {
    // Prevent multiple collection attempts per session/visit
    if (typeof window !== "undefined" && !window.__fingerprint_collected) {
      window.__fingerprint_collected = true;
      try {
        const collector = new FingerprintCollector();
        collector.collect().catch((err) => {
          // Optional: report error for analytics/monitoring here
          // eslint-disable-next-line no-console
          console.warn("Fingerprint collection failed", err);
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Fingerprint collector error", err);
      }
    }
  }, []);
  return null;
}
