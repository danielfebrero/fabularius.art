"use client";

import React, { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { userApi } from "@/lib/api/user";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  currentAvatarThumbnails?: {
    originalSize?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  onAvatarUpdated?: (_: {
    avatarUrl: string;
    avatarThumbnails: {
      originalSize?: string;
      small?: string;
      medium?: string;
      large?: string;
    };
  }) => void;
  size?: "small" | "medium" | "large";
  showUploadButton?: boolean;
  className?: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  currentAvatarThumbnails,
  onAvatarUpdated,
  size = "medium",
  showUploadButton = true,
  className,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  const sizeClasses = {
    small: "w-16 h-16 text-lg",
    medium: "w-24 h-24 text-2xl",
    large: "w-32 h-32 text-3xl",
  };

  const buttonSizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-10 h-10",
  };

  const iconSizeClasses = {
    small: "w-3 h-3",
    medium: "w-4 h-4",
    large: "w-5 h-5",
  };

  // Get initials for fallback display
  const getInitials = (user: any) => {
    if (!user) return "??";
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "??";
  };

  const initials = getInitials(user);

  // Get the best avatar URL to display
  const getAvatarUrl = () => {
    if (currentAvatarThumbnails?.large) {
      return currentAvatarThumbnails.large;
    }
    if (currentAvatarThumbnails?.medium) {
      return currentAvatarThumbnails.medium;
    }
    if (currentAvatarThumbnails?.small) {
      return currentAvatarThumbnails.small;
    }
    if (currentAvatarThumbnails?.originalSize) {
      return currentAvatarThumbnails.originalSize;
    }
    if (currentAvatarUrl) {
      return currentAvatarUrl;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    handleAvatarUpload(file);
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Get presigned upload URL
      console.log("🔄 Requesting presigned URL for avatar upload...");
      const { uploadUrl, avatarKey } = await userApi.uploadAvatar(
        file.name,
        file.type
      );

      // Step 2: Upload file to S3
      console.log("📤 Uploading avatar to S3...");
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      console.log(
        "✅ Avatar upload completed. Thumbnails will be generated automatically."
      );

      // Update parent component with the new avatar URL
      // Thumbnails will be available after S3 processing
      if (onAvatarUpdated) {
        onAvatarUpdated({
          avatarUrl: avatarKey,
          avatarThumbnails: {}, // Thumbnails will be available after S3 processing
        });
      }
    } catch (error) {
      console.error("❌ Avatar upload failed:", error);
      setError(error instanceof Error ? error.message : "Avatar upload failed");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileSelect = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Avatar Display */}
      <div
        className={cn(
          "relative bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl",
          sizeClasses[size],
          isUploading && "opacity-75"
        )}
        onClick={showUploadButton ? triggerFileSelect : undefined}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        ) : (
          <span>{initials}</span>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2
              className={cn("animate-spin text-white", iconSizeClasses[size])}
            />
          </div>
        )}
      </div>

      {/* Upload Button */}
      {showUploadButton && (
        <button
          onClick={triggerFileSelect}
          disabled={isUploading}
          className={cn(
            "absolute -top-1 -right-1 bg-background text-foreground border-2 border-primary rounded-full flex items-center justify-center hover:bg-muted transition-colors shadow-lg z-10 disabled:opacity-50 disabled:cursor-not-allowed",
            buttonSizeClasses[size]
          )}
          title="Upload avatar"
        >
          {isUploading ? (
            <Loader2 className={cn("animate-spin", iconSizeClasses[size])} />
          ) : (
            <Camera className={iconSizeClasses[size]} />
          )}
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
