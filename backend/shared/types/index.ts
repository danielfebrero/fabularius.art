export interface Album {
  id: string;
  title: string;
  description?: string | undefined;
  coverImageUrl?: string | undefined;
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
  width?: number | undefined;
  height?: number | undefined;
  url: string;
  thumbnailUrl?: string | undefined;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any> | undefined;
}

export interface CreateAlbumRequest {
  title: string;
  description?: string | undefined;
  isPublic?: boolean | undefined;
}

export interface UpdateAlbumRequest {
  title?: string | undefined;
  description?: string | undefined;
  isPublic?: boolean | undefined;
}

export interface UploadMediaRequest {
  filename: string;
  mimeType: string;
  size: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
  message?: string | undefined;
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

// DynamoDB Entity Types
export interface AlbumEntity {
  PK: string; // ALBUM#{albumId}
  SK: string; // METADATA
  GSI1PK: string; // ALBUM
  GSI1SK: string; // {createdAt}#{albumId}
  EntityType: "Album";
  id: string;
  title: string;
  description?: string | undefined;
  coverImageUrl?: string | undefined;
  createdAt: string;
  updatedAt: string;
  mediaCount: number;
  isPublic: boolean;
}

export interface MediaEntity {
  PK: string; // ALBUM#{albumId}
  SK: string; // MEDIA#{mediaId}
  GSI1PK: string; // MEDIA#{albumId}
  GSI1SK: string; // {createdAt}#{mediaId}
  EntityType: "Media";
  id: string;
  albumId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width?: number | undefined;
  height?: number | undefined;
  url: string;
  thumbnailUrl?: string | undefined;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any> | undefined;
}
