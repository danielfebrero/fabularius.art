import { handler } from "../../../../functions/media/get";
import { DynamoDBService } from "../../../../shared/utils/dynamodb";
import {
  createGetMediaEvent,
  expectSuccessResponse,
  expectBadRequestResponse,
  expectNotFoundResponse,
  expectInternalErrorResponse,
  createCursor,
} from "../../../helpers/api-gateway";
import { mockAlbumEntity, mockAlbumId } from "../../../fixtures/albums";
import {
  mockMediaList,
  mockMediaPaginationResponse,
  mockMediaEntityMinimal,
} from "../../../fixtures/media";

// Mock the DynamoDB service
jest.mock("../../../../shared/utils/dynamodb");

const mockGetAlbum = DynamoDBService.getAlbum as jest.MockedFunction<
  typeof DynamoDBService.getAlbum
>;
const mockListAlbumMedia =
  DynamoDBService.listAlbumMedia as jest.MockedFunction<
    typeof DynamoDBService.listAlbumMedia
  >;

describe("Media Get Handler", () => {
  beforeEach(() => {
    mockGetAlbum.mockClear();
    mockListAlbumMedia.mockClear();
  });

  describe("successful requests", () => {
    it("should return media for an album with default pagination", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mockMediaList,
      });

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.media).toHaveLength(3);
      expect(data.media[0]).toEqual({
        id: mockMediaList[0]!.id,
        albumId: mockMediaList[0]!.albumId,
        filename: mockMediaList[0]!.filename,
        originalFilename: mockMediaList[0]!.originalFilename,
        mimeType: mockMediaList[0]!.mimeType,
        size: mockMediaList[0]!.size,
        width: mockMediaList[0]!.width,
        height: mockMediaList[0]!.height,
        url: mockMediaList[0]!.url,
        thumbnailUrl: mockMediaList[0]!.thumbnailUrl,
        createdAt: mockMediaList[0]!.createdAt,
        updatedAt: mockMediaList[0]!.updatedAt,
        metadata: mockMediaList[0]!.metadata,
      });
      expect(data.pagination.hasNext).toBe(false);
      expect(data.pagination.cursor).toBeNull();

      expect(mockGetAlbum).toHaveBeenCalledWith(mockAlbumId);
      expect(mockListAlbumMedia).toHaveBeenCalledWith(
        mockAlbumId,
        50,
        undefined
      );
    });

    it("should return media with custom limit", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mockMediaList.slice(0, 2),
      });

      const event = createGetMediaEvent(mockAlbumId, { limit: "2" });
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.media).toHaveLength(2);
      expect(mockListAlbumMedia).toHaveBeenCalledWith(
        mockAlbumId,
        2,
        undefined
      );
    });

    it("should return media with pagination cursor", async () => {
      const lastEvaluatedKey = mockMediaPaginationResponse.lastEvaluatedKey;
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mockMediaList,
        lastEvaluatedKey,
      });

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.pagination.hasNext).toBe(true);
      expect(data.pagination.cursor).toBe(createCursor(lastEvaluatedKey));
    });

    it("should handle cursor from query parameters", async () => {
      const lastEvaluatedKey = mockMediaPaginationResponse.lastEvaluatedKey;
      const cursor = createCursor(lastEvaluatedKey);

      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mockMediaList,
      });

      const event = createGetMediaEvent(mockAlbumId, { cursor, limit: "10" });
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.pagination.hasNext).toBe(false);
      expect(mockListAlbumMedia).toHaveBeenCalledWith(
        mockAlbumId,
        10,
        lastEvaluatedKey
      );
    });

    it("should handle media without optional fields", async () => {
      const minimalMedia = [mockMediaEntityMinimal];

      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: minimalMedia,
      });

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.media).toHaveLength(1);
      expect(data.media[0].width).toBeUndefined();
      expect(data.media[0].height).toBeUndefined();
      expect(data.media[0].thumbnailUrl).toBeUndefined();
      expect(data.media[0].metadata).toBeUndefined();
      expect(data.media[0].filename).toBe(minimalMedia[0]!.filename);
    });

    it("should handle empty media list", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: [],
      });

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.media).toHaveLength(0);
      expect(data.pagination.hasNext).toBe(false);
    });
  });

  describe("validation", () => {
    it("should return 400 when albumId is missing", async () => {
      const event = createGetMediaEvent("");
      event.pathParameters = null;

      const result = await handler(event);

      expectBadRequestResponse(result, "Album ID is required");
      expect(mockGetAlbum).not.toHaveBeenCalled();
      expect(mockListAlbumMedia).not.toHaveBeenCalled();
    });

    it("should return 400 when albumId is empty string", async () => {
      const event = createGetMediaEvent("");

      const result = await handler(event);

      expectBadRequestResponse(result, "Album ID is required");
      expect(mockGetAlbum).not.toHaveBeenCalled();
      expect(mockListAlbumMedia).not.toHaveBeenCalled();
    });

    it("should return 400 when pathParameters is null", async () => {
      const event = createGetMediaEvent(mockAlbumId);
      event.pathParameters = null;

      const result = await handler(event);

      expectBadRequestResponse(result, "Album ID is required");
      expect(mockGetAlbum).not.toHaveBeenCalled();
      expect(mockListAlbumMedia).not.toHaveBeenCalled();
    });
  });

  describe("album verification", () => {
    it("should return 404 when album does not exist", async () => {
      mockGetAlbum.mockResolvedValue(null);

      const event = createGetMediaEvent("non-existent-album");
      const result = await handler(event);

      expectNotFoundResponse(result, "Album not found");
      expect(mockGetAlbum).toHaveBeenCalledWith("non-existent-album");
      expect(mockListAlbumMedia).not.toHaveBeenCalled();
    });
  });

  describe("query parameter handling", () => {
    it("should use default limit when limit is not provided", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mockMediaList,
      });

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      expectSuccessResponse(result);
      expect(mockListAlbumMedia).toHaveBeenCalledWith(
        mockAlbumId,
        50,
        undefined
      );
    });

    it("should parse limit from query parameters", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mockMediaList,
      });

      const event = createGetMediaEvent(mockAlbumId, { limit: "25" });
      const result = await handler(event);

      expectSuccessResponse(result);
      expect(mockListAlbumMedia).toHaveBeenCalledWith(
        mockAlbumId,
        25,
        undefined
      );
    });

    it("should handle invalid limit gracefully", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mockMediaList,
      });

      const event = createGetMediaEvent(mockAlbumId, { limit: "invalid" });
      const result = await handler(event);

      expectSuccessResponse(result);
      expect(mockListAlbumMedia).toHaveBeenCalledWith(
        mockAlbumId,
        NaN,
        undefined
      );
    });

    it("should handle invalid cursor gracefully", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);

      const event = createGetMediaEvent(mockAlbumId, {
        cursor: "invalid-base64",
      });

      // This should return a 500 error when trying to parse the cursor
      const result = await handler(event);
      expect(result.statusCode).toBe(500);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Failed to fetch media");
    });
  });

  describe("error handling", () => {
    it("should return 500 when album lookup fails", async () => {
      const error = new Error("DynamoDB connection failed");
      mockGetAlbum.mockRejectedValue(error);

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      expectInternalErrorResponse(result, "Failed to fetch media");
      expect(mockGetAlbum).toHaveBeenCalledWith(mockAlbumId);
    });

    it("should return 500 when media listing fails", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      const error = new Error("DynamoDB query failed");
      mockListAlbumMedia.mockRejectedValue(error);

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      expectInternalErrorResponse(result, "Failed to fetch media");
      expect(mockGetAlbum).toHaveBeenCalledWith(mockAlbumId);
      expect(mockListAlbumMedia).toHaveBeenCalled();
    });

    it("should log error to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Test error");
      mockGetAlbum.mockRejectedValue(error);

      const event = createGetMediaEvent(mockAlbumId);
      await handler(event);

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching media:", error);
      consoleSpy.mockRestore();
    });
  });

  describe("response format", () => {
    it("should return correct response structure", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mockMediaList,
        lastEvaluatedKey: mockMediaPaginationResponse.lastEvaluatedKey,
      });

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data).toHaveProperty("media");
      expect(data).toHaveProperty("pagination");
      expect(data.pagination).toHaveProperty("hasNext");
      expect(data.pagination).toHaveProperty("cursor");
      expect(Array.isArray(data.media)).toBe(true);
    });

    it("should include all required media fields", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: [mockMediaList[0]!],
      });

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      const media = data.media[0];

      expect(media).toHaveProperty("id");
      expect(media).toHaveProperty("albumId");
      expect(media).toHaveProperty("filename");
      expect(media).toHaveProperty("originalFilename");
      expect(media).toHaveProperty("mimeType");
      expect(media).toHaveProperty("size");
      expect(media).toHaveProperty("url");
      expect(media).toHaveProperty("createdAt");
      expect(media).toHaveProperty("updatedAt");

      // Optional fields should be present if they exist in the entity
      expect(media).toHaveProperty("width");
      expect(media).toHaveProperty("height");
      expect(media).toHaveProperty("thumbnailUrl");
      expect(media).toHaveProperty("metadata");
    });

    it("should not include DynamoDB-specific fields", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: [mockMediaList[0]!],
      });

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      const media = data.media[0];

      // Ensure DynamoDB-specific fields are not included
      expect(media).not.toHaveProperty("PK");
      expect(media).not.toHaveProperty("SK");
      expect(media).not.toHaveProperty("GSI1PK");
      expect(media).not.toHaveProperty("GSI1SK");
      expect(media).not.toHaveProperty("EntityType");
    });

    it("should have correct data types", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: [mockMediaList[0]!],
      });

      const event = createGetMediaEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      const media = data.media[0];

      expect(typeof media.id).toBe("string");
      expect(typeof media.albumId).toBe("string");
      expect(typeof media.filename).toBe("string");
      expect(typeof media.originalFilename).toBe("string");
      expect(typeof media.mimeType).toBe("string");
      expect(typeof media.size).toBe("number");
      expect(typeof media.url).toBe("string");
      expect(typeof media.createdAt).toBe("string");
      expect(typeof media.updatedAt).toBe("string");

      if (media.width !== undefined) {
        expect(typeof media.width).toBe("number");
      }
      if (media.height !== undefined) {
        expect(typeof media.height).toBe("number");
      }
      if (media.thumbnailUrl !== undefined) {
        expect(typeof media.thumbnailUrl).toBe("string");
      }
      if (media.metadata !== undefined) {
        expect(typeof media.metadata).toBe("object");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle very long album IDs", async () => {
      const longId = "a".repeat(1000);
      mockGetAlbum.mockResolvedValue(null);

      const event = createGetMediaEvent(longId);
      const result = await handler(event);

      expectNotFoundResponse(result, "Album not found");
      expect(mockGetAlbum).toHaveBeenCalledWith(longId);
    });

    it("should handle special characters in album ID", async () => {
      const specialId = "album-123_test@domain.com";
      mockGetAlbum.mockResolvedValue(null);

      const event = createGetMediaEvent(specialId);
      const result = await handler(event);

      expectNotFoundResponse(result, "Album not found");
      expect(mockGetAlbum).toHaveBeenCalledWith(specialId);
    });

    it("should handle large limit values", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);
      mockListAlbumMedia.mockResolvedValue({
        media: mockMediaList,
      });

      const event = createGetMediaEvent(mockAlbumId, { limit: "1000" });
      const result = await handler(event);

      expectSuccessResponse(result);
      expect(mockListAlbumMedia).toHaveBeenCalledWith(
        mockAlbumId,
        1000,
        undefined
      );
    });
  });
});
