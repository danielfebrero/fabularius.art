export interface Album {
  id: string;
  title: string;
  tags?: string[] | undefined;
  coverImageUrl?: string | undefined;
  thumbnailUrls?:
    | {
        cover?: string;
        small?: string;
        medium?: string;
        large?: string;
        xlarge?: string;
      }
    | undefined;
  createdAt: string;
  updatedAt: string;
  mediaCount: number;
  isPublic: boolean;
  likeCount?: number;
  bookmarkCount?: number;
  viewCount?: number;
}

export interface Media {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width?: number | undefined;
  height?: number | undefined;
  url: string;
  thumbnailUrl?: string | undefined;
  thumbnailUrls?:
    | { small?: string; medium?: string; large?: string }
    | undefined;
  status?: "pending" | "uploaded" | "failed" | undefined;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any> | undefined;
  // User tracking fields
  createdBy?: string | undefined;
  createdByType?: "user" | "admin" | undefined;
  // Album relationships (populated when needed)
  albums?: string[] | undefined; // array of album IDs this media belongs to
}

export interface CreateAlbumRequest {
  title: string;
  tags?: string[] | undefined;
  isPublic?: boolean | undefined;
}

export interface UpdateAlbumRequest {
  title?: string | undefined;
  tags?: string[] | undefined;
  isPublic?: boolean | undefined;
  coverImageUrl?: string | undefined;
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
  tags?: string[] | undefined;
  coverImageUrl?: string | undefined;
  thumbnailUrls?:
    | {
        cover?: string;
        small?: string;
        medium?: string;
        large?: string;
        xlarge?: string;
      }
    | undefined;
  createdAt: string;
  updatedAt: string;
  mediaCount: number;
  isPublic: string; // "true" or "false" - stored as string for GSI compatibility
  likeCount?: number;
  bookmarkCount?: number;
  viewCount?: number;
}

export interface MediaEntity {
  PK: string; // MEDIA#{mediaId}
  SK: string; // METADATA
  GSI1PK: string; // MEDIA_BY_CREATOR
  GSI1SK: string; // {createdBy}#{createdAt}#{mediaId}
  GSI2PK: string; // MEDIA_ID
  GSI2SK: string; // {mediaId}
  EntityType: "Media";
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width?: number | undefined;
  height?: number | undefined;
  url: string;
  thumbnailUrl?: string | undefined;
  thumbnailUrls?:
    | { small?: string; medium?: string; large?: string }
    | undefined;
  status?: "pending" | "uploaded" | "failed" | undefined;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any> | undefined;
  // User tracking fields
  createdBy?: string | undefined; // userId or adminId who uploaded this media
  createdByType?: "user" | "admin" | undefined; // type of creator
}

// New entity for album-media relationships (many-to-many)
export interface AlbumMediaEntity {
  PK: string; // ALBUM#{albumId}
  SK: string; // MEDIA#{mediaId}
  GSI1PK: string; // MEDIA#{mediaId}
  GSI1SK: string; // ALBUM#{albumId}#{addedAt}
  GSI2PK: string; // ALBUM_MEDIA_BY_DATE
  GSI2SK: string; // {addedAt}#{albumId}#{mediaId}
  EntityType: "AlbumMedia";
  albumId: string;
  mediaId: string;
  addedAt: string; // when media was added to this album
  addedBy?: string | undefined; // who added it to this album
}

// Admin Authentication Types
export interface AdminUser {
  adminId: string;
  username: string;
  createdAt: string;
  isActive: boolean;
}

export interface AdminSession {
  sessionId: string;
  adminId: string;
  adminUsername: string;
  createdAt: string;
  expiresAt: string;
  lastAccessedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  admin: AdminUser;
  sessionId: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  admin?: AdminUser;
  session?: AdminSession;
}

// Admin DynamoDB Entity Types
export interface AdminUserEntity {
  PK: string; // ADMIN#{adminId}
  SK: string; // METADATA
  GSI1PK: string; // ADMIN_USERNAME
  GSI1SK: string; // {username}
  EntityType: "AdminUser";
  adminId: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  isActive: boolean;
}

export interface AdminSessionEntity {
  PK: string; // SESSION#{sessionId}
  SK: string; // METADATA
  GSI1PK: string; // SESSION_EXPIRY
  GSI1SK: string; // {expiresAt}#{sessionId}
  EntityType: "AdminSession";
  sessionId: string;
  adminId: string;
  adminUsername: string;
  createdAt: string;
  expiresAt: string;
  lastAccessedAt: string;
  ttl: number; // For DynamoDB TTL
}

// Admin Statistics Types
export interface AdminStats {
  totalAlbums: number;
  totalMedia: number;
  publicAlbums: number;
  storageUsed: string;
  storageUsedBytes: number;
}

// Export user types
export * from "./user";
