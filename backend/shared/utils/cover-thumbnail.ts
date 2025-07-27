import { S3Service } from "./s3";
import { ThumbnailService } from "./thumbnail";

/**
 * Cover Image Thumbnail Utility
 *
 * This utility handles cover image thumbnail generation for albums.
 * It abstracts the common pattern of downloading cover images from S3,
 * determining content type, and generating thumbnails.
 */
export class CoverThumbnailUtil {
  /**
   * Determine content type from S3 key extension
   */
  static getContentTypeFromS3Key(s3Key: string): string {
    const lowerKey = s3Key.toLowerCase();

    if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) {
      return "image/jpeg";
    }
    if (lowerKey.endsWith(".png")) {
      return "image/png";
    }
    if (lowerKey.endsWith(".webp")) {
      return "image/webp";
    }

    // Default fallback
    return "image/jpeg";
  }

  /**
   * Process cover image and generate thumbnails
   *
   * @param coverImageUrl - The URL of the cover image
   * @param albumId - The album ID for thumbnail generation
   * @returns Promise<ThumbnailUrls> - The generated thumbnail URLs, or null if processing fails
   */
  static async processCoverImageThumbnails(
    coverImageUrl: string,
    albumId: string
  ): Promise<{
    cover?: string;
    small?: string;
    medium?: string;
    large?: string;
    xlarge?: string;
  } | null> {
    try {
      console.log(
        `Generating thumbnails for album ${albumId} cover image: ${coverImageUrl}`
      );

      // Extract S3 key from URL
      const s3Key = S3Service.extractKeyFromUrl(coverImageUrl);
      if (!s3Key) {
        console.warn(`Could not extract S3 key from URL: ${coverImageUrl}`);
        return null;
      }

      // Download cover image from S3
      const coverImageBuffer = await S3Service.downloadBuffer(s3Key);
      if (!coverImageBuffer) {
        console.warn(`Could not download cover image from S3: ${s3Key}`);
        return null;
      }

      // Determine content type from URL extension
      const contentType = this.getContentTypeFromS3Key(s3Key);

      // Generate thumbnails using ThumbnailService
      const thumbnailUrls = await ThumbnailService.generateAlbumCoverThumbnails(
        coverImageBuffer,
        albumId,
        contentType
      );

      console.log(
        `Successfully generated ${
          Object.keys(thumbnailUrls).length
        } thumbnail sizes for album ${albumId}`
      );

      return thumbnailUrls;
    } catch (error) {
      console.error(
        `Failed to generate thumbnails for album ${albumId}:`,
        error
      );
      return null;
    }
  }
}
