import { handler } from "../../../../functions/albums/get";
import { DynamoDBService } from "../../../../shared/utils/dynamodb";
import {
  createGetAlbumsEvent,
  expectSuccessResponse,
  expectInternalErrorResponse,
  createCursor,
} from "../../../helpers/api-gateway";
import {
  mockAlbumsList,
  mockPaginationResponse,
} from "../../../fixtures/albums";

// Mock the DynamoDB service
jest.mock("../../../../shared/utils/dynamodb");

const mockListAlbums = DynamoDBService.listAlbums as jest.MockedFunction<
  typeof DynamoDBService.listAlbums
>;

describe("Albums Get Handler", () => {
  beforeEach(() => {
    mockListAlbums.mockClear();
  });

  describe("successful requests", () => {
    it("should return albums with default pagination", async () => {
      mockListAlbums.mockResolvedValue({
        albums: mockAlbumsList,
      });

      const event = createGetAlbumsEvent();
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.albums).toHaveLength(3);
      expect(data.albums[0]).toEqual({
        id: mockAlbumsList[0]!.id,
        title: mockAlbumsList[0]!.title,
        tags: mockAlbumsList[0]!.tags,
        coverImageUrl: mockAlbumsList[0]!.coverImageUrl,
        createdAt: mockAlbumsList[0]!.createdAt,
        updatedAt: mockAlbumsList[0]!.updatedAt,
        mediaCount: mockAlbumsList[0]!.mediaCount,
        isPublic: mockAlbumsList[0]!.isPublic,
      });
      expect(data.pagination.hasNext).toBe(false);
      expect(data.pagination.cursor).toBeNull();

      expect(mockListAlbums).toHaveBeenCalledWith(20, undefined);
    });

    it("should return albums with custom limit", async () => {
      mockListAlbums.mockResolvedValue({
        albums: mockAlbumsList.slice(0, 2),
      });

      const event = createGetAlbumsEvent({ limit: "2" });
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.albums).toHaveLength(2);
      expect(mockListAlbums).toHaveBeenCalledWith(2, undefined);
    });

    it("should return albums with pagination cursor", async () => {
      const lastEvaluatedKey = mockPaginationResponse.lastEvaluatedKey;
      mockListAlbums.mockResolvedValue({
        albums: mockAlbumsList,
        lastEvaluatedKey,
      });

      const event = createGetAlbumsEvent();
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.pagination.hasNext).toBe(true);
      expect(data.pagination.cursor).toBe(createCursor(lastEvaluatedKey));
    });

    it("should handle cursor from query parameters", async () => {
      const lastEvaluatedKey = mockPaginationResponse.lastEvaluatedKey;
      const cursor = createCursor(lastEvaluatedKey);

      mockListAlbums.mockResolvedValue({
        albums: mockAlbumsList,
      });

      const event = createGetAlbumsEvent({ cursor, limit: "10" });
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.pagination.hasNext).toBe(false);
      expect(mockListAlbums).toHaveBeenCalledWith(10, lastEvaluatedKey);
    });

    it("should handle albums without optional fields", async () => {
      const minimalAlbums = [
        {
          ...mockAlbumsList[2]!,
          tags: undefined,
          coverImageUrl: undefined,
        },
      ];

      mockListAlbums.mockResolvedValue({
        albums: minimalAlbums,
      });

      const event = createGetAlbumsEvent();
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.albums).toHaveLength(1);
      expect(data.albums[0].tags).toBeUndefined();
      expect(data.albums[0].coverImageUrl).toBeUndefined();
      expect(data.albums[0].title).toBe(minimalAlbums[0]!.title);
    });

    it("should handle empty albums list", async () => {
      mockListAlbums.mockResolvedValue({
        albums: [],
      });

      const event = createGetAlbumsEvent();
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.albums).toHaveLength(0);
      expect(data.pagination.hasNext).toBe(false);
    });
  });

  describe("query parameter handling", () => {
    it("should use default limit when limit is not provided", async () => {
      mockListAlbums.mockResolvedValue({
        albums: mockAlbumsList,
      });

      const event = createGetAlbumsEvent();
      const result = await handler(event);

      expectSuccessResponse(result);
      expect(mockListAlbums).toHaveBeenCalledWith(20, undefined);
    });

    it("should parse limit from query parameters", async () => {
      mockListAlbums.mockResolvedValue({
        albums: mockAlbumsList,
      });

      const event = createGetAlbumsEvent({ limit: "5" });
      const result = await handler(event);

      expectSuccessResponse(result);
      expect(mockListAlbums).toHaveBeenCalledWith(5, undefined);
    });

    it("should handle invalid limit gracefully", async () => {
      mockListAlbums.mockResolvedValue({
        albums: mockAlbumsList,
      });

      const event = createGetAlbumsEvent({ limit: "invalid" });
      const result = await handler(event);

      expectSuccessResponse(result);
      expect(mockListAlbums).toHaveBeenCalledWith(NaN, undefined);
    });

    it("should handle invalid cursor gracefully", async () => {
      mockListAlbums.mockResolvedValue({
        albums: mockAlbumsList,
      });

      const event = createGetAlbumsEvent({ cursor: "invalid-base64" });

      // This should return a 500 error when trying to parse the cursor
      const result = await handler(event);
      expect(result.statusCode).toBe(500);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Failed to fetch albums");
    });
  });

  describe("error handling", () => {
    it("should return 500 when DynamoDB service throws error", async () => {
      const error = new Error("DynamoDB connection failed");
      mockListAlbums.mockRejectedValue(error);

      const event = createGetAlbumsEvent();
      const result = await handler(event);

      expectInternalErrorResponse(result, "Failed to fetch albums");
      expect(mockListAlbums).toHaveBeenCalled();
    });

    it("should return 500 when DynamoDB service throws unknown error", async () => {
      mockListAlbums.mockRejectedValue(new Error("Unknown error"));

      const event = createGetAlbumsEvent();
      const result = await handler(event);

      expectInternalErrorResponse(result, "Failed to fetch albums");
    });

    it("should log error to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Test error");
      mockListAlbums.mockRejectedValue(error);

      const event = createGetAlbumsEvent();
      await handler(event);

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching albums:", error);
      consoleSpy.mockRestore();
    });
  });

  describe("response format", () => {
    it("should return correct response structure", async () => {
      mockListAlbums.mockResolvedValue({
        albums: mockAlbumsList,
        lastEvaluatedKey: mockPaginationResponse.lastEvaluatedKey,
      });

      const event = createGetAlbumsEvent();
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data).toHaveProperty("albums");
      expect(data).toHaveProperty("pagination");
      expect(data.pagination).toHaveProperty("hasNext");
      expect(data.pagination).toHaveProperty("cursor");
      expect(Array.isArray(data.albums)).toBe(true);
    });

    it("should include all required album fields", async () => {
      mockListAlbums.mockResolvedValue({
        albums: [mockAlbumsList[0]!],
      });

      const event = createGetAlbumsEvent();
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      const album = data.albums[0];

      expect(album).toHaveProperty("id");
      expect(album).toHaveProperty("title");
      expect(album).toHaveProperty("createdAt");
      expect(album).toHaveProperty("updatedAt");
      expect(album).toHaveProperty("mediaCount");
      expect(album).toHaveProperty("isPublic");

      // Optional fields should be present if they exist in the entity
      expect(album).toHaveProperty("tags");
      expect(album).toHaveProperty("coverImageUrl");
    });
  });
});
