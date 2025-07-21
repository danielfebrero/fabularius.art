import { S3Service } from "../../../../shared/utils/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mockAlbumId } from "../../../fixtures/albums";
import { mockS3Key } from "../../../fixtures/media";
import {
  noSuchBucketError,
  noSuchKeyError,
  accessDeniedError,
} from "../../../helpers/aws-mocks";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// Mock the S3 client and presigned URL function
jest.mock("@aws-sdk/client-s3", () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    __mockSend: mockSend, // Export for test access
  };
});

jest.mock("@aws-sdk/s3-request-presigner");
jest.mock("uuid");

// Get the mock send function
const { __mockSend: mockSend } = require("@aws-sdk/client-s3");
const mockGetSignedUrl = getSignedUrl as jest.Mock;

describe("S3Service", () => {
  beforeEach(() => {
    // Mock UUID to return consistent value
    const { v4 } = require("uuid");
    (v4 as jest.Mock).mockReturnValue("mock-uuid-123");

    mockSend.mockClear();
    mockGetSignedUrl.mockClear();
    mockSend.mockResolvedValue({});
  });

  describe("generatePresignedUploadUrl", () => {
    it("should generate a presigned upload URL successfully", async () => {
      const expectedUrl =
        "https://test-bucket.s3.amazonaws.com/presigned-upload-url";
      mockGetSignedUrl.mockResolvedValue(expectedUrl);

      const result = await S3Service.generatePresignedUploadUrl(
        mockAlbumId,
        "test-image.jpg",
        "image/jpeg"
      );

      expect(result.uploadUrl).toBe(expectedUrl);
      expect(result.key).toBe("albums/test-album-123/media/mock-uuid-123.jpg");
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(Object), // S3Client instance
        expect.any(PutObjectCommand), // Command instance
        { expiresIn: 3600 }
      );
    });

    it("should generate a presigned upload URL with custom expiration", async () => {
      const expectedUrl =
        "https://test-bucket.s3.amazonaws.com/presigned-upload-url";
      mockGetSignedUrl.mockResolvedValue(expectedUrl);

      const result = await S3Service.generatePresignedUploadUrl(
        mockAlbumId,
        "test-image.png",
        "image/png",
        7200
      );

      expect(result.uploadUrl).toBe(expectedUrl);
      expect(result.key).toBe("albums/test-album-123/media/mock-uuid-123.png");
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(PutObjectCommand),
        { expiresIn: 7200 }
      );
    });

    it("should handle file without extension", async () => {
      const expectedUrl =
        "https://test-bucket.s3.amazonaws.com/presigned-upload-url";
      mockGetSignedUrl.mockResolvedValue(expectedUrl);

      const result = await S3Service.generatePresignedUploadUrl(
        mockAlbumId,
        "testfile",
        "application/octet-stream"
      );

      expect(result.key).toBe("albums/test-album-123/media/mock-uuid-123");
    });

    it("should throw error when S3 operation fails", async () => {
      mockGetSignedUrl.mockRejectedValue(accessDeniedError());

      await expect(
        S3Service.generatePresignedUploadUrl(
          mockAlbumId,
          "test.jpg",
          "image/jpeg"
        )
      ).rejects.toThrow("Access Denied");
    });
  });

  describe("generatePresignedDownloadUrl", () => {
    it("should generate a presigned download URL successfully", async () => {
      const expectedUrl =
        "https://test-bucket.s3.amazonaws.com/presigned-download-url";
      mockGetSignedUrl.mockResolvedValue(expectedUrl);

      const result = await S3Service.generatePresignedDownloadUrl(mockS3Key);

      expect(result).toBe(expectedUrl);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(GetObjectCommand),
        { expiresIn: 3600 }
      );
    });

    it("should generate a presigned download URL with custom expiration", async () => {
      const expectedUrl =
        "https://test-bucket.s3.amazonaws.com/presigned-download-url";
      mockGetSignedUrl.mockResolvedValue(expectedUrl);

      const result = await S3Service.generatePresignedDownloadUrl(
        mockS3Key,
        1800
      );

      expect(result).toBe(expectedUrl);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(GetObjectCommand),
        { expiresIn: 1800 }
      );
    });

    it("should throw error when key does not exist", async () => {
      mockGetSignedUrl.mockRejectedValue(noSuchKeyError());

      await expect(
        S3Service.generatePresignedDownloadUrl("non-existent-key")
      ).rejects.toThrow("The specified key does not exist");
    });
  });

  describe("deleteObject", () => {
    it("should delete an object successfully", async () => {
      mockSend.mockResolvedValue({});

      await S3Service.deleteObject(mockS3Key);

      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it("should throw error when bucket does not exist", async () => {
      mockSend.mockRejectedValue(noSuchBucketError());

      await expect(S3Service.deleteObject(mockS3Key)).rejects.toThrow(
        "The specified bucket does not exist"
      );
    });

    it("should throw error when access is denied", async () => {
      mockSend.mockRejectedValue(accessDeniedError());

      await expect(S3Service.deleteObject(mockS3Key)).rejects.toThrow(
        "Access Denied"
      );
    });
  });

  describe("getPublicUrl", () => {
    it("should return the correct public URL", () => {
      const result = S3Service.getPublicUrl(mockS3Key);

      expect(result).toBe(`https://test.cloudfront.net/${mockS3Key}`);
    });

    it("should handle keys with special characters", () => {
      const specialKey = "albums/test/media/file with spaces & symbols.jpg";
      const result = S3Service.getPublicUrl(specialKey);

      expect(result).toBe(`https://test.cloudfront.net/${specialKey}`);
    });
  });

  describe("getThumbnailKey", () => {
    it("should generate correct thumbnail key for JPEG", () => {
      const originalKey = "albums/test-album/media/image.jpg";
      const result = S3Service.getThumbnailKey(originalKey);

      expect(result).toBe("albums/test-album/media/thumbnails/image_thumb.jpg");
    });

    it("should generate correct thumbnail key for PNG", () => {
      const originalKey = "albums/test-album/media/photo.png";
      const result = S3Service.getThumbnailKey(originalKey);

      expect(result).toBe("albums/test-album/media/thumbnails/photo_thumb.png");
    });

    it("should handle files without extension", () => {
      const originalKey = "albums/test-album/media/file";
      const result = S3Service.getThumbnailKey(originalKey);

      expect(result).toBe("albums/test-album/media/thumbnails/file_thumb");
    });

    it("should handle nested directory structures", () => {
      const originalKey = "albums/test/sub/folder/image.webp";
      const result = S3Service.getThumbnailKey(originalKey);

      expect(result).toBe("albums/test/sub/folder/thumbnails/image_thumb.webp");
    });
  });

  describe("uploadBuffer", () => {
    it("should upload buffer successfully", async () => {
      mockSend.mockResolvedValue({});

      const buffer = Buffer.from("test image data");
      const metadata = { "custom-field": "value" };

      await S3Service.uploadBuffer(mockS3Key, buffer, "image/jpeg", metadata);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it("should upload buffer without metadata", async () => {
      mockSend.mockResolvedValue({});

      const buffer = Buffer.from("test data");

      await S3Service.uploadBuffer(mockS3Key, buffer, "text/plain");

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it("should throw error when upload fails", async () => {
      mockSend.mockRejectedValue(accessDeniedError());

      const buffer = Buffer.from("test data");

      await expect(
        S3Service.uploadBuffer(mockS3Key, buffer, "text/plain")
      ).rejects.toThrow("Access Denied");
    });
  });

  describe("extractKeyFromUrl", () => {
    it("should extract key from CloudFront URL", () => {
      const url =
        "https://test.cloudfront.net/albums/test-album/media/image.jpg";
      const result = S3Service.extractKeyFromUrl(url);

      expect(result).toBe("albums/test-album/media/image.jpg");
    });

    it("should extract key from S3 URL", () => {
      const url =
        "https://test-bucket.s3.amazonaws.com/albums/test-album/media/image.jpg";
      const result = S3Service.extractKeyFromUrl(url);

      expect(result).toBe("albums/test-album/media/image.jpg");
    });

    it("should handle URLs with query parameters", () => {
      const url =
        "https://test.cloudfront.net/albums/test/image.jpg?version=1&cache=false";
      const result = S3Service.extractKeyFromUrl(url);

      expect(result).toBe("albums/test/image.jpg");
    });

    it("should return null for invalid URLs", () => {
      const invalidUrl = "not-a-valid-url";
      const result = S3Service.extractKeyFromUrl(invalidUrl);

      expect(result).toBeNull();
    });

    it("should handle root path", () => {
      const url = "https://test.cloudfront.net/";
      const result = S3Service.extractKeyFromUrl(url);

      expect(result).toBe("");
    });

    it("should handle URLs with encoded characters", () => {
      const url =
        "https://test.cloudfront.net/albums/test%20album/image%20file.jpg";
      const result = S3Service.extractKeyFromUrl(url);

      expect(result).toBe("albums/test%20album/image%20file.jpg");
    });

    it("should extract key from relative path", () => {
      const relativePath = "/albums/test-album/media/image.jpg";
      const result = S3Service.extractKeyFromUrl(relativePath);

      expect(result).toBe("albums/test-album/media/image.jpg");
    });

    it("should handle null and empty inputs", () => {
      expect(S3Service.extractKeyFromUrl(null as any)).toBeNull();
      expect(S3Service.extractKeyFromUrl("")).toBeNull();
      expect(S3Service.extractKeyFromUrl(undefined as any)).toBeNull();
    });
  });
});
