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
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  // User tracking fields
  createdBy?: string; // userId or adminId who created this album
  createdByType?: "user" | "admin"; // type of creator
  media?: Media[];
  comments?: Comment[];
}

export interface Media {
  id: string;
  albumId?: string; // Album this media belongs to (required for bookmark functionality)
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
  likeCount?: number;
  bookmarkCount?: number;
  viewCount?: number;
  commentCount?: number;
  // User tracking fields
  createdBy?: string; // userId or adminId who uploaded this media
  createdByType?: "user" | "admin"; // type of creator
  albums?: Album[]; // For storing full album information when populated
  comments?: Comment[]; // Include comments directly in Media
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
  | "create-album"
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

// Comment types
export interface Comment {
  id: string;
  content: string;
  targetType: "album" | "media";
  targetId: string;
  userId: string;
  username?: string;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
  isEdited?: boolean;
  target?: Media | Album; // Added for enriched comments from getUserComments API
}

export interface CreateCommentRequest {
  content: string;
  targetType: "album" | "media";
  targetId: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentResponse {
  success: boolean;
  data?: Comment;
  error?: string;
}

export interface CommentListResponse {
  success: boolean;
  data?: {
    comments: Comment[];
    pagination: {
      page: number;
      limit: number;
      hasNext: boolean;
      nextKey?: string;
      cursor?: string;
      total: number;
    };
  };
  error?: string;
}

export interface CommentLikeStatusResponse {
  success: boolean;
  data?: {
    statuses: Array<{
      commentId: string;
      isLiked: boolean;
    }>;
  };
  error?: string;
}

// User authentication types
export * from "./user";

// Permission and plan types
export * from "./permissions";
