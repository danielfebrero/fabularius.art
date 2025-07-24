// Centralized frontend configuration utility for API endpoints and shared config

/**
 * Production-safe export for app-wide config values.
 * Add additional config values as needed.
 */

export const API_URL: string =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
