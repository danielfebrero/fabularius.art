import { S3Service } from "./s3";

// Dynamically import Sharp to handle platform-specific binaries
let sharp: typeof import("sharp");

const loadSharp = async () => {
  if (!sharp) {
    try {
      sharp = (await import("sharp")).default;
      console.log("Sharp module loaded successfully");
    } catch (error) {
      console.error("Failed to load Sharp module:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        awsExecutionEnv: process.env["AWS_EXECUTION_ENV"],
      });
      throw new Error(
        "Sharp module not available. Please ensure Sharp is installed with the correct platform binaries for Lambda (linux-x64)."
      );
    }
  }
  return sharp;
};

export interface ThumbnailConfig {
  width: number;
  height: number;
  quality: number;
  suffix: string;
}

export const THUMBNAIL_CONFIGS: Record<string, ThumbnailConfig> = {
  cover: { width: 128, height: 128, quality: 75, suffix: "_thumb_cover" },
  small: { width: 240, height: 240, quality: 80, suffix: "_thumb_small" },
  medium: { width: 300, height: 300, quality: 85, suffix: "_thumb_medium" },
  large: { width: 365, height: 365, quality: 85, suffix: "_thumb_large" },
  xlarge: { width: 600, height: 600, quality: 90, suffix: "_thumb_xlarge" },
};

export class ThumbnailService {
  /**
   * Generate thumbnails for an image
   */
  static async generateThumbnails(
    originalKey: string,
    imageBuffer: Buffer,
    configs: ThumbnailConfig[] = Object.values(THUMBNAIL_CONFIGS)
  ): Promise<{ [configName: string]: string }> {
    const thumbnailUrls: { [configName: string]: string } = {};
    const originalPath = originalKey.split("/");
    const fileName = originalPath[originalPath.length - 1];
    const basePath = originalPath.slice(0, -1).join("/");

    // Extract file extension and name
    if (!fileName) {
      throw new Error(`Invalid file path: ${originalKey}`);
    }

    const lastDotIndex = fileName.lastIndexOf(".");
    const fileNameWithoutExt =
      lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName;

    for (const config of configs) {
      try {
        // Load Sharp dynamically
        const sharpInstance = await loadSharp();

        // Generate thumbnail buffer
        const thumbnailBuffer = await sharpInstance(imageBuffer)
          .resize(config.width, config.height, {
            fit: "cover",
            position: "center",
          })
          .jpeg({ quality: config.quality })
          .toBuffer();

        // Create thumbnail key
        const thumbnailKey = `${basePath}/thumbnails/${fileNameWithoutExt}${config.suffix}.jpg`;

        // Upload thumbnail to S3
        await S3Service.uploadBuffer(
          thumbnailKey,
          thumbnailBuffer,
          "image/jpeg",
          {
            "original-key": originalKey,
            "thumbnail-config": JSON.stringify(config),
          }
        );

        // Store the URL
        const configName =
          Object.keys(THUMBNAIL_CONFIGS).find(
            (key) => THUMBNAIL_CONFIGS[key] === config
          ) || "custom";

        thumbnailUrls[configName] = S3Service.getRelativePath(thumbnailKey);
      } catch (error) {
        console.error(
          `Failed to generate ${config.suffix} thumbnail for ${originalKey}:`,
          error
        );
      }
    }

    return thumbnailUrls;
  }

  /**
   * Generate album cover thumbnails for an album
   */
  static async generateAlbumCoverThumbnails(
    coverImageBuffer: Buffer,
    albumId: string,
    contentType: string
  ): Promise<{
    cover?: string;
    small?: string;
    medium?: string;
    large?: string;
    xlarge?: string;
  }> {
    const thumbnailUrls: {
      cover?: string;
      small?: string;
      medium?: string;
      large?: string;
      xlarge?: string;
    } = {};
    const baseKey = `albums/${albumId}/cover/thumbnails/`;

    // Validate content type
    if (!this.isImageFile(contentType)) {
      throw new Error(
        `Unsupported content type for album cover: ${contentType}`
      );
    }

    // Generate thumbnails for all 5 sizes
    const configs = Object.entries(THUMBNAIL_CONFIGS);

    for (const [sizeName, config] of configs) {
      try {
        // Load Sharp dynamically
        const sharpInstance = await loadSharp();

        // Generate thumbnail buffer
        const thumbnailBuffer = await sharpInstance(coverImageBuffer)
          .resize(config.width, config.height, {
            fit: "cover",
            position: "center",
          })
          .jpeg({ quality: config.quality })
          .toBuffer();

        // Create thumbnail key using simple size names for album covers
        const thumbnailKey = `${baseKey}${sizeName}.jpg`;

        // Upload thumbnail to S3
        await S3Service.uploadBuffer(
          thumbnailKey,
          thumbnailBuffer,
          "image/jpeg",
          {
            "album-id": albumId,
            "thumbnail-size": sizeName,
            "thumbnail-config": JSON.stringify(config),
          }
        );

        // Store the URL
        thumbnailUrls[sizeName as keyof typeof thumbnailUrls] =
          S3Service.getRelativePath(thumbnailKey);
      } catch (error) {
        console.error(
          `Failed to generate ${sizeName} album cover thumbnail for album ${albumId}:`,
          error
        );
      }
    }

    return thumbnailUrls;
  }

  /**
   * Generate a single thumbnail (default small size)
   */
  static async generateSingleThumbnail(
    originalKey: string,
    imageBuffer: Buffer,
    config: ThumbnailConfig = THUMBNAIL_CONFIGS["small"] || {
      width: 240,
      height: 240,
      quality: 80,
      suffix: "_thumb_small",
    }
  ): Promise<string | null> {
    try {
      const thumbnails = await this.generateThumbnails(
        originalKey,
        imageBuffer,
        [config]
      );
      const configName =
        Object.keys(THUMBNAIL_CONFIGS).find(
          (key) => THUMBNAIL_CONFIGS[key] === config
        ) || "custom";

      return thumbnails[configName] || null;
    } catch (error) {
      console.error(
        `Failed to generate single thumbnail for ${originalKey}:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if a file is an image that supports thumbnail generation
   */
  static isImageFile(mimeType: string): boolean {
    return (
      mimeType.startsWith("image/") &&
      [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ].includes(mimeType.toLowerCase())
    );
  }

  /**
   * Get the default thumbnail URL (small size)
   */
  static getDefaultThumbnailKey(originalKey: string): string {
    const originalPath = originalKey.split("/");
    const fileName = originalPath[originalPath.length - 1];
    const basePath = originalPath.slice(0, -1).join("/");

    if (!fileName) {
      throw new Error(`Invalid file path: ${originalKey}`);
    }

    const lastDotIndex = fileName.lastIndexOf(".");
    const fileNameWithoutExt =
      lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName;

    return `${basePath}/thumbnails/${fileNameWithoutExt}${
      THUMBNAIL_CONFIGS["small"]?.suffix || "_thumb_small"
    }.jpg`;
  }

  /**
   * Get thumbnail URL from key
   */
  static getThumbnailUrl(originalKey: string): string {
    const thumbnailKey = this.getDefaultThumbnailKey(originalKey);
    return S3Service.getRelativePath(thumbnailKey);
  }
}
