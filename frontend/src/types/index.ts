export interface Album {
  id: string;
  title: string;
  tags?: string[];
  coverImageUrl?: string;
  thumbnailUrls?: {
    cover?: string;
    small?: string;
    medium?: string;
    large?: string;
    xlarge?: string;
    originalSize?: string;
  };
  isPublic: boolean;
  mediaCount: number;
  likeCount?: number;
  bookmarkCount?: number;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  media?: Media[];
}

export interface Media {
  id: string;
  filename: string;
  originalName?: string;
  originalFilename?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  thumbnailUrls?: {
    cover?: string;
    small?: string;
    medium?: string;
    large?: string;
    xlarge?: string;
    originalSize?: string;
  };
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  // User tracking fields
  createdBy?: string; // userId or adminId who uploaded this media
  createdByType?: "user" | "admin"; // type of creator
  albums?: Album[]; // For storing full album information when populated
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Admin types
export interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: AdminUser;
  };
  error?: string;
}

export interface AdminStats {
  totalAlbums: number;
  totalMedia: number;
  publicAlbums: number;
  storageUsed: string;
  storageUsedBytes: number;
}

// Thumbnail system types
export type ThumbnailSize =
  | "cover"
  | "small"
  | "medium"
  | "large"
  | "xlarge"
  | "originalSize";
export type ThumbnailContext =
  | "cover-selector"
  | "discover"
  | "albums"
  | "admin"
  | "default";

export interface ThumbnailUrls {
  cover?: string;
  small?: string;
  medium?: string;
  large?: string;
  xlarge?: string;
  originalSize?: string;
}

// User authentication types
export * from "./user";

// Permission and plan types
export * from "./permissions";
