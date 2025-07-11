import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";

const s3Client = new S3Client({});
const BUCKET_NAME = process.env["S3_BUCKET"]!;
const CLOUDFRONT_DOMAIN = process.env["CLOUDFRONT_DOMAIN"]!;

export class S3Service {
  static async generatePresignedUploadUrl(
    albumId: string,
    filename: string,
    mimeType: string,
    expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; key: string }> {
    const fileExtension = path.extname(filename);
    const key = `albums/${albumId}/media/${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        "original-filename": filename,
        "album-id": albumId,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return { uploadUrl, key };
  }

  static async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  static async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  static getPublicUrl(key: string): string {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`;
  }

  static getThumbnailKey(originalKey: string): string {
    const parsedPath = path.parse(originalKey);
    return `${parsedPath.dir}/thumbnails/${parsedPath.name}_thumb${parsedPath.ext}`;
  }

  static async uploadBuffer(
    key: string,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: metadata,
    });

    await s3Client.send(command);
  }

  static extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }
}
