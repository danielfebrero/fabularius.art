export interface Album {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
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
  thumbnailUrl: string;
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
