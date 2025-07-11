// Frontend types that match the backend types
export interface Album {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  mediaCount: number;
}

export interface Media {
  id: string;
  albumId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CreateAlbumRequest {
  title: string;
  description: string;
  isPublic?: boolean;
}

export interface UpdateAlbumRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  coverImage?: string;
}

export interface UploadMediaRequest {
  albumId: string;
  file: File;
}

// UI Component Props
export interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "filled";
  size?: "sm" | "md" | "lg";
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "outlined";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

// Form types
export interface AlbumFormData {
  title: string;
  description: string;
  isPublic: boolean;
}

export interface MediaUploadFormData {
  files: FileList;
  albumId: string;
}

// Hook return types
export interface UseAlbumsReturn {
  albums: Album[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refresh: () => void;
}

export interface UseMediaReturn {
  media: Media[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refresh: () => void;
}

export interface UseAlbumReturn {
  album: Album | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
