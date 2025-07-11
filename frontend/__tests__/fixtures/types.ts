// Re-export types from backend for frontend tests
export interface Album {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  mediaCount: number;
  isPublic: boolean;
}

export interface Media {
  id: string;
  albumId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface CreateAlbumRequest {
  title: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateAlbumRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
}

export interface UploadMediaRequest {
  filename: string;
  mimeType: string;
  size: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
