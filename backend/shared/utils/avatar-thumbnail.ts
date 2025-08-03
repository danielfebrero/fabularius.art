import { S3Service } from "./s3";

// Dynamically import Sharp to handle platform-specific binaries
let sharp: typeof import("sharp");

const loadSharp = async () => {
  if (!sharp) {
    try {
      sharp = (await import("sharp")).default;
      console.log("Sharp module loaded successfully for avatar processing");
    } catch (error) {
      console.error("Failed to load Sharp module:", error);
      throw new Error(
        "Sharp module not available. Please ensure Sharp is installed with the correct platform binaries for Lambda (linux-x64)."
      );
    }
  }
  return sharp;
};

export interface AvatarThumbnailConfig {
  width: number;
  height: number;
  quality: number;
  suffix: string;
}

// Avatar-specific thumbnail configurations
// Based on actual UI usage patterns with aspect ratio preservation
export const AVATAR_THUMBNAIL_CONFIGS: Record<string, AvatarThumbnailConfig> = {
  small: { width: 32, height: 32, quality: 85, suffix: "_avatar_small" }, // Max 32px for small UI elements
  medium: { width: 96, height: 96, quality: 90, suffix: "_avatar_medium" }, // Max 96px for medium displays
  large: { width: 128, height: 128, quality: 95, suffix: "_avatar_large" }, // Max 128px for large profile displays
};

/**
 * Avatar Thumbnail Service
 *
 * Handles avatar-specific thumbnail generation with optimized sizes for UI components
 */
export class AvatarThumbnailService {
  /**
   * Check if a file is an image type suitable for avatars
   */
  static isImageFile(contentType: string): boolean {
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    return supportedTypes.includes(contentType.toLowerCase());
  }

  /**
   * Generate avatar thumbnails for a user
   */
  static async generateAvatarThumbnails(
    avatarImageBuffer: Buffer,
    userId: string,
    contentType: string
  ): Promise<{
    originalSize?: string;
    small?: string;
    medium?: string;
    large?: string;
  }> {
    const thumbnailUrls: {
      originalSize?: string;
      small?: string;
      medium?: string;
      large?: string;
    } = {};

    // Validate content type
    if (!this.isImageFile(contentType)) {
      throw new Error(`Unsupported content type for avatar: ${contentType}`);
    }

    console.log(`Generating avatar thumbnails for user ${userId}`);

    // Load Sharp dynamically
    const sharpInstance = await loadSharp();

    try {
      // Generate originalSize (WebP optimized version of original)
      const originalWebpBuffer = await sharpInstance(avatarImageBuffer)
        .webp({ quality: 95 }) // High quality WebP
        .toBuffer();

      const originalSizeKey = `users/${userId}/avatar/original.webp`;
      await S3Service.uploadBuffer(
        originalSizeKey,
        originalWebpBuffer,
        "image/webp",
        {
          "user-id": userId,
          "thumbnail-type": "originalSize",
          "avatar-thumbnail": "true",
        }
      );

      thumbnailUrls.originalSize = S3Service.getRelativePath(originalSizeKey);
      console.log(`Generated originalSize avatar for user ${userId}`);

      // Generate small, medium, and large thumbnails
      const configs = Object.entries(AVATAR_THUMBNAIL_CONFIGS);

      for (const [sizeName, config] of configs) {
        try {
          const resizedBuffer = await sharpInstance(avatarImageBuffer)
            .resize(config.width, config.height, {
              fit: "inside", // Preserve aspect ratio, fit within dimensions
              withoutEnlargement: true, // Don't enlarge if image is smaller
            })
            .webp({ quality: config.quality })
            .toBuffer();

          const thumbnailKey = `users/${userId}/avatar/thumbnails/${sizeName}.webp`;

          await S3Service.uploadBuffer(
            thumbnailKey,
            resizedBuffer,
            "image/webp",
            {
              "user-id": userId,
              "thumbnail-size": sizeName,
              "thumbnail-config": JSON.stringify(config),
              "avatar-thumbnail": "true",
            }
          );

          // Store the URL
          thumbnailUrls[sizeName as keyof typeof thumbnailUrls] =
            S3Service.getRelativePath(thumbnailKey);

          console.log(
            `Generated ${sizeName} avatar thumbnail for user ${userId}: ${config.width}x${config.height}px`
          );
        } catch (error) {
          console.error(
            `Failed to generate ${sizeName} avatar thumbnail for user ${userId}:`,
            error
          );
        }
      }

      console.log(
        `Successfully generated ${
          Object.keys(thumbnailUrls).length
        } avatar sizes for user ${userId}`
      );

      return thumbnailUrls;
    } catch (error) {
      console.error(
        `Failed to generate avatar thumbnails for user ${userId}:`,
        error
      );
      throw error;
    }
  }
}
