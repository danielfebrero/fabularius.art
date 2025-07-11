import { handler } from "../../../../functions/albums/getById";
import { DynamoDBService } from "../../../../shared/utils/dynamodb";
import {
  createGetAlbumByIdEvent,
  expectSuccessResponse,
  expectBadRequestResponse,
  expectNotFoundResponse,
  expectInternalErrorResponse,
} from "../../../helpers/api-gateway";
import {
  mockAlbumEntity,
  mockAlbumId,
  mockAlbumEntityMinimal,
} from "../../../fixtures/albums";

// Mock the DynamoDB service
jest.mock("../../../../shared/utils/dynamodb");

const mockGetAlbum = DynamoDBService.getAlbum as jest.MockedFunction<
  typeof DynamoDBService.getAlbum
>;

describe("Albums GetById Handler", () => {
  beforeEach(() => {
    mockGetAlbum.mockClear();
  });

  describe("successful requests", () => {
    it("should return album when it exists", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);

      const event = createGetAlbumByIdEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data).toEqual({
        id: mockAlbumEntity.id,
        title: mockAlbumEntity.title,
        description: mockAlbumEntity.description,
        coverImageUrl: mockAlbumEntity.coverImageUrl,
        createdAt: mockAlbumEntity.createdAt,
        updatedAt: mockAlbumEntity.updatedAt,
        mediaCount: mockAlbumEntity.mediaCount,
        isPublic: mockAlbumEntity.isPublic,
      });

      expect(mockGetAlbum).toHaveBeenCalledWith(mockAlbumId);
    });

    it("should return album without optional fields", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntityMinimal);

      const event = createGetAlbumByIdEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data).toEqual({
        id: mockAlbumEntityMinimal.id,
        title: mockAlbumEntityMinimal.title,
        createdAt: mockAlbumEntityMinimal.createdAt,
        updatedAt: mockAlbumEntityMinimal.updatedAt,
        mediaCount: mockAlbumEntityMinimal.mediaCount,
        isPublic: mockAlbumEntityMinimal.isPublic,
      });
      expect(data.description).toBeUndefined();
      expect(data.coverImageUrl).toBeUndefined();
    });

    it("should handle album with undefined optional fields", async () => {
      const albumWithUndefinedFields = {
        ...mockAlbumEntity,
        description: undefined,
        coverImageUrl: undefined,
      };
      mockGetAlbum.mockResolvedValue(albumWithUndefinedFields);

      const event = createGetAlbumByIdEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);
      expect(data.description).toBeUndefined();
      expect(data.coverImageUrl).toBeUndefined();
      expect(data.title).toBe(albumWithUndefinedFields.title);
    });
  });

  describe("validation", () => {
    it("should return 400 when albumId is missing", async () => {
      const event = createGetAlbumByIdEvent("");
      event.pathParameters = null;

      const result = await handler(event);

      expectBadRequestResponse(result, "Album ID is required");
      expect(mockGetAlbum).not.toHaveBeenCalled();
    });

    it("should return 400 when albumId is empty string", async () => {
      const event = createGetAlbumByIdEvent("");

      const result = await handler(event);

      expectBadRequestResponse(result, "Album ID is required");
      expect(mockGetAlbum).not.toHaveBeenCalled();
    });

    it("should return 400 when pathParameters is null", async () => {
      const event = createGetAlbumByIdEvent(mockAlbumId);
      event.pathParameters = null;

      const result = await handler(event);

      expectBadRequestResponse(result, "Album ID is required");
      expect(mockGetAlbum).not.toHaveBeenCalled();
    });

    it("should return 400 when pathParameters is empty object", async () => {
      const event = createGetAlbumByIdEvent(mockAlbumId);
      event.pathParameters = {};

      const result = await handler(event);

      expectBadRequestResponse(result, "Album ID is required");
      expect(mockGetAlbum).not.toHaveBeenCalled();
    });
  });

  describe("not found scenarios", () => {
    it("should return 404 when album does not exist", async () => {
      mockGetAlbum.mockResolvedValue(null);

      const event = createGetAlbumByIdEvent("non-existent-id");
      const result = await handler(event);

      expectNotFoundResponse(result, "Album not found");
      expect(mockGetAlbum).toHaveBeenCalledWith("non-existent-id");
    });
  });

  describe("error handling", () => {
    it("should return 500 when DynamoDB service throws error", async () => {
      const error = new Error("DynamoDB connection failed");
      mockGetAlbum.mockRejectedValue(error);

      const event = createGetAlbumByIdEvent(mockAlbumId);
      const result = await handler(event);

      expectInternalErrorResponse(result, "Failed to fetch album");
      expect(mockGetAlbum).toHaveBeenCalledWith(mockAlbumId);
    });

    it("should return 500 when DynamoDB service throws unknown error", async () => {
      mockGetAlbum.mockRejectedValue(new Error("Unknown error"));

      const event = createGetAlbumByIdEvent(mockAlbumId);
      const result = await handler(event);

      expectInternalErrorResponse(result, "Failed to fetch album");
    });

    it("should log error to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Test error");
      mockGetAlbum.mockRejectedValue(error);

      const event = createGetAlbumByIdEvent(mockAlbumId);
      await handler(event);

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching album:", error);
      consoleSpy.mockRestore();
    });
  });

  describe("response format", () => {
    it("should return correct response structure", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);

      const event = createGetAlbumByIdEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);

      // Check all required fields are present
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("title");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");
      expect(data).toHaveProperty("mediaCount");
      expect(data).toHaveProperty("isPublic");

      // Check optional fields are included when present
      expect(data).toHaveProperty("description");
      expect(data).toHaveProperty("coverImageUrl");
    });

    it("should not include DynamoDB-specific fields", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);

      const event = createGetAlbumByIdEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);

      // Ensure DynamoDB-specific fields are not included
      expect(data).not.toHaveProperty("PK");
      expect(data).not.toHaveProperty("SK");
      expect(data).not.toHaveProperty("GSI1PK");
      expect(data).not.toHaveProperty("GSI1SK");
      expect(data).not.toHaveProperty("EntityType");
    });

    it("should have correct data types", async () => {
      mockGetAlbum.mockResolvedValue(mockAlbumEntity);

      const event = createGetAlbumByIdEvent(mockAlbumId);
      const result = await handler(event);

      const data = expectSuccessResponse(result);

      expect(typeof data.id).toBe("string");
      expect(typeof data.title).toBe("string");
      expect(typeof data.createdAt).toBe("string");
      expect(typeof data.updatedAt).toBe("string");
      expect(typeof data.mediaCount).toBe("number");
      expect(typeof data.isPublic).toBe("boolean");

      if (data.description !== undefined) {
        expect(typeof data.description).toBe("string");
      }
      if (data.coverImageUrl !== undefined) {
        expect(typeof data.coverImageUrl).toBe("string");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle very long album IDs", async () => {
      const longId = "a".repeat(1000);
      mockGetAlbum.mockResolvedValue(null);

      const event = createGetAlbumByIdEvent(longId);
      const result = await handler(event);

      expectNotFoundResponse(result, "Album not found");
      expect(mockGetAlbum).toHaveBeenCalledWith(longId);
    });

    it("should handle special characters in album ID", async () => {
      const specialId = "album-123_test@domain.com";
      mockGetAlbum.mockResolvedValue(null);

      const event = createGetAlbumByIdEvent(specialId);
      const result = await handler(event);

      expectNotFoundResponse(result, "Album not found");
      expect(mockGetAlbum).toHaveBeenCalledWith(specialId);
    });
  });
});
