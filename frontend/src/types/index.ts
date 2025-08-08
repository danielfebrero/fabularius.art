// Re-export shared types from the shared types package
export * from "@pornspot-ai/shared-types";

// Frontend-specific pagination types that extend the base types
export interface UnifiedPaginationMeta {
  hasNext: boolean; // Whether more pages exist
  cursor: string | null; // Base64-encoded cursor for next page
  limit: number; // Actual limit used
}

// Base unified paginated response type
export interface UnifiedPaginatedResponse<T = any> extends ApiResponse {
  data: {
    pagination: UnifiedPaginationMeta;
  } & Record<string, T[] | UnifiedPaginationMeta>;
}

// Specific unified response types for type safety
export interface UnifiedAlbumsResponse extends ApiResponse {
  data: {
    albums: Album[];
    pagination: UnifiedPaginationMeta;
  };
}

export interface UnifiedMediaResponse extends ApiResponse {
  data: {
    media: Media[];
    pagination: UnifiedPaginationMeta;
  };
}

// Frontend-specific thumbnail system types
export type ThumbnailContext =
  | "cover-selector"
  | "create-album"
  | "discover"
  | "albums"
  | "admin"
  | "default";

// Frontend-specific permission and plan types
export * from "./permissions";
