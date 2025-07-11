import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";

const isLocal = process.env["AWS_SAM_LOCAL"] === "true";

let s3Config: S3ClientConfig = {};

if (isLocal) {
  s3Config = {
    endpoint: "http://fabularius-local-aws:4566",
    region: process.env["AWS_REGION"] || "us-east-1",
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
    forcePathStyle: true, // Required for LocalStack
  };
}

const s3Client = new S3Client(s3Config);

// Middleware to remove unsupported headers for LocalStack
if (isLocal) {
  s3Client.middlewareStack.add(
    (next) => async (args) => {
      // Remove from headers
      if (args.request && (args.request as any).headers) {
        delete (args.request as any).headers["x-amz-sdk-checksum-algorithm"];
      }
      // Remove from query params (for presigned URLs)
      if (args.request && (args.request as any).query) {
        delete (args.request as any).query["x-amz-sdk-checksum-algorithm"];
        delete (args.request as any).query["x-amz-checksum-crc32"];
      }
      return next(args);
    },
    { step: "build", name: "removeChecksumHeader" }
  );
}

const BUCKET_NAME = (
  isLocal ? "local-fabularius-media" : process.env["S3_BUCKET"]
)!;

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

    const rawUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
      signableHeaders: new Set([
        "host",
        "x-amz-meta-original-filename",
        "x-amz-meta-album-id",
      ]),
    });

    // Remove unwanted query params (x-amz-sdk-checksum-algorithm, x-amz-checksum-crc32)
    const url = isLocal
      ? rawUrl
          .replace(/([&?])x-amz-sdk-checksum-algorithm=[^&]*/g, "$1")
          .replace(/([&?])x-amz-checksum-crc32=[^&]*/g, "$1")
          .replace(/([&?])x-id=PutObject/g, "$1x-id=PutObject") // keep this if needed
          .replace(/[&?]+$/, "") // remove trailing & or ?
          .replace(/\?&/, "?")
          .replace(/&&/, "&")
      : rawUrl;

    // For docker hostname to localhost fix:
    const uploadUrl = isLocal
      ? url.replace("fabularius-local-aws", "localhost")
      : url;

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
    if (isLocal) {
      return `http://localhost:4566/${BUCKET_NAME}/${key}`;
    }

    if (CLOUDFRONT_DOMAIN) {
      return `https://${CLOUDFRONT_DOMAIN}/${key}`;
    }

    const region = process.env["AWS_REGION"] || "us-east-1";
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
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

      if (isLocal) {
        const pathParts = urlObj.pathname.split("/");
        // path is /<bucket-name>/<key>, so we slice(2) to get the key
        return pathParts.slice(2).join("/");
      }

      // For remote S3, remove leading slash
      return urlObj.pathname.substring(1);
    } catch {
      return null;
    }
  }
}
