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
  };
  isPublic: boolean;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
  media?: Media[];
}

export interface Media {
  id: string;
  albumId: string;
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
  };
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
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

export interface AdminContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (_credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export interface AdminStats {
  totalAlbums: number;
  totalMedia: number;
  publicAlbums: number;
  storageUsed: string;
  storageUsedBytes: number;
}

// Thumbnail system types
export type ThumbnailSize = "cover" | "small" | "medium" | "large" | "xlarge";
export type ThumbnailContext =
  | "cover-selector"
  | "homepage"
  | "albums"
  | "admin"
  | "default";

export interface ThumbnailUrls {
  cover?: string;
  small?: string;
  medium?: string;
  large?: string;
  xlarge?: string;
}

// User authentication types
export * from "./user";
