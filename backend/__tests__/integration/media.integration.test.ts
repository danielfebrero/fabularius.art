import { handler as uploadMediaHandler } from "../../functions/media/upload";
import { handler as getMediaHandler } from "../../functions/media/get";
import { DynamoDBService } from "../../shared/utils/dynamodb";
import { S3Service } from "../../shared/utils/s3";
import {
  createUploadMediaEvent,
  createGetMediaEvent,
  expectSuccessResponse,
  expectNotFoundResponse,
} from "../helpers/api-gateway";
import { mockAlbumEntity, mockAlbumId } from "../fixtures/albums";
import { mockUploadMediaRequest, mockS3Key } from "../fixtures/media";

// Mock the services
jest.mock("../../shared/utils/dynamodb");
jest.mock("../../shared/utils/s3");
jest.mock("uuid");

const mockGetAlbum = DynamoDBService.getAlbum as jest.MockedFunction<
  typeof DynamoDBService.getAlbum
>;
const mockCreateMedia = DynamoDBService.createMedia as jest.MockedFunction<
  typeof DynamoDBService.createMedia
>;
const mockListAlbumMedia =
  DynamoDBService.listAlbumMedia as jest.MockedFunction<
    typeof DynamoDBService.listAlbumMedia
  >;
const mockGeneratePresignedUploadUrl =
  S3Service.generatePresignedUploadUrl as jest.MockedFunction<
    typeof S3Service.generatePresignedUploadUrl
  >;
const mockGetPublicUrl = S3Service.getPublicUrl as jest.MockedFunction<
  typeof S3Service.getPublicUrl
>;

describe("Media Integration Tests", () => {
  const testTimestamp = "2023-01-01T00:00:00.000Z";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date.prototype, "toISOString").mockReturnValue(testTimestamp);

    // Mock UUID generation
    const { v4: uuidv4 } = require("uuid");
    (uuidv4 as jest.Mock).mockReturnValue("integration-test-media-id");

    // Set up default mocks
    mockGetPublicUrl.mockReturnValue(
      `https://test.cloudfront.net/${mockS3Key}`
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Media Upload and Retrieval Workflow", () => {
    it("should upload media and then retrieve it in album media list", async () => {
      // Step 1: Upload media to an album
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockGeneratePresignedUploadUrl.mockResolvedValue({
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-upload-url",
        key: mockS3Key,
      });
      mockCreateMedia.mockResolvedValue();

      const uploadEvent = createUploadMediaEvent(
        mockAlbumId,
        mockUploadMediaRequest
      );
      const uploadResult = await uploadMediaHandler(uploadEvent);

      const uploadResponse = expectSuccessResponse(uploadResult);
      expect(uploadResponse.mediaId).toBe("integration-test-media-id");
      expect(uploadResponse.uploadUrl).toBe(
        "https://test-bucket.s3.amazonaws.com/presigned-upload-url"
      );
      expect(uploadResponse.key).toBe(mockS3Key);

      // Verify the media entity was created correctly
      expect(mockCreateMedia).toHaveBeenCalledWith({
        PK: `ALBUM#${mockAlbumId}`,
        SK: "MEDIA#integration-test-media-id",
        GSI1PK: `MEDIA#${mockAlbumId}`,
        GSI1SK: `${testTimestamp}#integration-test-media-id`,
        EntityType: "Media",
        id: "integration-test-media-id",
        albumId: mockAlbumId,
        filename: mockS3Key,
        originalFilename: mockUploadMediaRequest.filename,
        mimeType: mockUploadMediaRequest.mimeType,
        size: mockUploadMediaRequest.size,
        url: `https://test.cloudfront.net/${mockS3Key}`,
        createdAt: testTimestamp,
        updatedAt: testTimestamp,
        status: "pending",
      });

      // Step 2: Retrieve media list for the album
      const mediaEntity = {
        PK: `ALBUM#${mockAlbumId}`,
        SK: "MEDIA#integration-test-media-id",
        GSI1PK: `MEDIA#${mockAlbumId}`,
        GSI1SK: `${testTimestamp}#integration-test-media-id`,
        EntityType: "Media" as const,
        id: "integration-test-media-id",
        albumId: mockAlbumId,
        filename: mockS3Key,
        originalFilename: mockUploadMediaRequest.filename,
        mimeType: mockUploadMediaRequest.mimeType,
        size: mockUploadMediaRequest.size,
        width: 1920,
        height: 1080,
        url: `https://test.cloudfront.net/${mockS3Key}`,
        thumbnailUrl: `https://test.cloudfront.net/albums/${mockAlbumId}/media/thumbnails/test-file_thumb.jpg`,
        createdAt: testTimestamp,
        updatedAt: testTimestamp,
        metadata: {
          camera: "Canon EOS R5",
          iso: 100,
        },
      };

      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: [mediaEntity],
      });

      const getEvent = createGetMediaEvent(mockAlbumId);
      const getResult = await getMediaHandler(getEvent);

      const mediaList = expectSuccessResponse(getResult);
      expect(mediaList.media).toHaveLength(1);
      expect(mediaList.media[0].id).toBe("integration-test-media-id");
      expect(mediaList.media[0].originalFilename).toBe(
        mockUploadMediaRequest.filename
      );
      expect(mediaList.media[0].mimeType).toBe(mockUploadMediaRequest.mimeType);
      expect(mediaList.media[0].size).toBe(mockUploadMediaRequest.size);
    });

    it("should handle multiple media uploads to the same album", async () => {
      // Step 1: Upload first media
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockGeneratePresignedUploadUrl.mockResolvedValue({
        uploadUrl:
          "https://test-bucket.s3.amazonaws.com/presigned-upload-url-1",
        key: "albums/test-album-123/media/first-file.jpg",
      });
      mockCreateMedia.mockResolvedValue();

      const firstUploadEvent = createUploadMediaEvent(mockAlbumId, {
        filename: "first-image.jpg",
        mimeType: "image/jpeg",
        size: 1024000,
      });
      const firstUploadResult = await uploadMediaHandler(firstUploadEvent);

      const firstUploadResponse = expectSuccessResponse(firstUploadResult);
      expect(firstUploadResponse.mediaId).toBe("integration-test-media-id");

      // Step 2: Upload second media (simulate different UUID)
      (require("uuid").v4 as jest.Mock).mockReturnValueOnce("second-media-id");
      mockGeneratePresignedUploadUrl.mockResolvedValue({
        uploadUrl:
          "https://test-bucket.s3.amazonaws.com/presigned-upload-url-2",
        key: "albums/test-album-123/media/second-file.png",
      });

      const secondUploadEvent = createUploadMediaEvent(mockAlbumId, {
        filename: "second-image.png",
        mimeType: "image/png",
        size: 2048000,
      });
      const secondUploadResult = await uploadMediaHandler(secondUploadEvent);

      const secondUploadResponse = expectSuccessResponse(secondUploadResult);
      expect(secondUploadResponse.mediaId).toBe("second-media-id");

      // Step 3: Retrieve media list showing both files
      const mediaEntities = [
        {
          PK: `ALBUM#${mockAlbumId}`,
          SK: "MEDIA#integration-test-media-id",
          GSI1PK: `MEDIA#${mockAlbumId}`,
          GSI1SK: `${testTimestamp}#integration-test-media-id`,
          EntityType: "Media" as const,
          id: "integration-test-media-id",
          albumId: mockAlbumId,
          filename: "albums/test-album-123/media/first-file.jpg",
          originalFilename: "first-image.jpg",
          mimeType: "image/jpeg",
          size: 1024000,
          url: "https://test.cloudfront.net/albums/test-album-123/media/first-file.jpg",
          createdAt: testTimestamp,
          updatedAt: testTimestamp,
        },
        {
          PK: `ALBUM#${mockAlbumId}`,
          SK: "MEDIA#second-media-id",
          GSI1PK: `MEDIA#${mockAlbumId}`,
          GSI1SK: `${testTimestamp}#second-media-id`,
          EntityType: "Media" as const,
          id: "second-media-id",
          albumId: mockAlbumId,
          filename: "albums/test-album-123/media/second-file.png",
          originalFilename: "second-image.png",
          mimeType: "image/png",
          size: 2048000,
          url: "https://test.cloudfront.net/albums/test-album-123/media/second-file.png",
          createdAt: testTimestamp,
          updatedAt: testTimestamp,
        },
      ];

      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mediaEntities,
      });

      const getEvent = createGetMediaEvent(mockAlbumId);
      const getResult = await getMediaHandler(getEvent);

      const mediaList = expectSuccessResponse(getResult);
      expect(mediaList.media).toHaveLength(2);
      expect(mediaList.media[0].originalFilename).toBe("first-image.jpg");
      expect(mediaList.media[1].originalFilename).toBe("second-image.png");
    });
  });

  describe("Error Scenarios Integration", () => {
    it("should handle media upload to non-existent album", async () => {
      mockGetAlbum.mockResolvedValue(null);

      const uploadEvent = createUploadMediaEvent(
        "non-existent-album",
        mockUploadMediaRequest
      );
      const uploadResult = await uploadMediaHandler(uploadEvent);

      expectNotFoundResponse(uploadResult, "Album not found");
      expect(mockGeneratePresignedUploadUrl).not.toHaveBeenCalled();
      expect(mockCreateMedia).not.toHaveBeenCalled();
    });

    it("should handle media retrieval from non-existent album", async () => {
      mockGetAlbum.mockResolvedValue(null);

      const getEvent = createGetMediaEvent("non-existent-album");
      const getResult = await getMediaHandler(getEvent);

      expectNotFoundResponse(getResult, "Album not found");
      expect(mockListAlbumMedia).not.toHaveBeenCalled();
    });

    it("should handle empty media list for existing album", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: [],
      });

      const getEvent = createGetMediaEvent(mockAlbumId);
      const getResult = await getMediaHandler(getEvent);

      const mediaList = expectSuccessResponse(getResult);
      expect(mediaList.media).toHaveLength(0);
      expect(mediaList.pagination.hasNext).toBe(false);
    });
  });

  describe("Data Consistency Integration", () => {
    it("should maintain data consistency between upload and retrieval operations", async () => {
      // Upload media with specific data
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockGeneratePresignedUploadUrl.mockResolvedValue({
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-upload-url",
        key: mockS3Key,
      });
      mockCreateMedia.mockResolvedValue();

      const mediaData = {
        filename: "consistency-test.jpg",
        mimeType: "image/jpeg",
        size: 1536000,
      };

      const uploadEvent = createUploadMediaEvent(mockAlbumId, mediaData);
      const uploadResult = await uploadMediaHandler(uploadEvent);

      const uploadResponse = expectSuccessResponse(uploadResult);

      // Simulate retrieving the same media
      const mediaEntity = {
        PK: `ALBUM#${mockAlbumId}`,
        SK: `MEDIA#${uploadResponse.mediaId}`,
        GSI1PK: `MEDIA#${mockAlbumId}`,
        GSI1SK: `${testTimestamp}#${uploadResponse.mediaId}`,
        EntityType: "Media" as const,
        id: uploadResponse.mediaId,
        albumId: mockAlbumId,
        filename: uploadResponse.key,
        originalFilename: mediaData.filename,
        mimeType: mediaData.mimeType,
        size: mediaData.size,
        url: `https://test.cloudfront.net/${uploadResponse.key}`,
        createdAt: testTimestamp,
        updatedAt: testTimestamp,
      };

      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: [mediaEntity],
      });

      const getEvent = createGetMediaEvent(mockAlbumId);
      const getResult = await getMediaHandler(getEvent);

      const mediaList = expectSuccessResponse(getResult);
      const retrievedMedia = mediaList.media[0];

      // Verify all fields match
      expect(retrievedMedia.id).toBe(uploadResponse.mediaId);
      expect(retrievedMedia.originalFilename).toBe(mediaData.filename);
      expect(retrievedMedia.mimeType).toBe(mediaData.mimeType);
      expect(retrievedMedia.size).toBe(mediaData.size);
      expect(retrievedMedia.filename).toBe(uploadResponse.key);
    });

    it("should handle optional media fields consistently", async () => {
      // Upload media and then retrieve with optional fields
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockGeneratePresignedUploadUrl.mockResolvedValue({
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-upload-url",
        key: mockS3Key,
      });
      mockCreateMedia.mockResolvedValue();

      const uploadEvent = createUploadMediaEvent(
        mockAlbumId,
        mockUploadMediaRequest
      );
      const uploadResult = await uploadMediaHandler(uploadEvent);

      const uploadResponse = expectSuccessResponse(uploadResult);

      // Simulate media with optional fields
      const mediaEntityWithOptionals = {
        PK: `ALBUM#${mockAlbumId}`,
        SK: `MEDIA#${uploadResponse.mediaId}`,
        GSI1PK: `MEDIA#${mockAlbumId}`,
        GSI1SK: `${testTimestamp}#${uploadResponse.mediaId}`,
        EntityType: "Media" as const,
        id: uploadResponse.mediaId,
        albumId: mockAlbumId,
        filename: uploadResponse.key,
        originalFilename: mockUploadMediaRequest.filename,
        mimeType: mockUploadMediaRequest.mimeType,
        size: mockUploadMediaRequest.size,
        width: 1920,
        height: 1080,
        url: `https://test.cloudfront.net/${uploadResponse.key}`,
        thumbnailUrl: `https://test.cloudfront.net/thumbnails/${uploadResponse.key}`,
        createdAt: testTimestamp,
        updatedAt: testTimestamp,
        metadata: {
          camera: "Test Camera",
          location: "Test Location",
        },
      };

      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: [mediaEntityWithOptionals],
      });

      const getEvent = createGetMediaEvent(mockAlbumId);
      const getResult = await getMediaHandler(getEvent);

      const mediaList = expectSuccessResponse(getResult);
      const retrievedMedia = mediaList.media[0];

      expect(retrievedMedia.width).toBe(1920);
      expect(retrievedMedia.height).toBe(1080);
      expect(retrievedMedia.thumbnailUrl).toBeTruthy();
      expect(retrievedMedia.metadata).toEqual({
        camera: "Test Camera",
        location: "Test Location",
      });
    });
  });

  describe("Service Integration", () => {
    it("should properly integrate S3 and DynamoDB services", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockGeneratePresignedUploadUrl.mockResolvedValue({
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-upload-url",
        key: mockS3Key,
      });
      mockCreateMedia.mockResolvedValue();

      const uploadEvent = createUploadMediaEvent(
        mockAlbumId,
        mockUploadMediaRequest
      );
      await uploadMediaHandler(uploadEvent);

      // Verify S3 service was called correctly
      expect(mockGeneratePresignedUploadUrl).toHaveBeenCalledWith(
        mockAlbumId,
        mockUploadMediaRequest.filename,
        mockUploadMediaRequest.mimeType
      );

      // Verify DynamoDB service was called correctly
      expect(mockGetAlbum).toHaveBeenCalledWith(mockAlbumId);
      expect(mockCreateMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          EntityType: "Media",
          albumId: mockAlbumId,
          originalFilename: mockUploadMediaRequest.filename,
          mimeType: mockUploadMediaRequest.mimeType,
          size: mockUploadMediaRequest.size,
        })
      );

      // Verify S3 public URL generation
      expect(mockGetPublicUrl).toHaveBeenCalledWith(mockS3Key);
    });
  });
});
