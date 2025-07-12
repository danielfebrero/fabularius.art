import { handler } from "../../../../functions/albums/create";
import { DynamoDBService } from "../../../../shared/utils/dynamodb";
import {
  createCreateAlbumEvent,
  expectCreatedResponse,
  expectBadRequestResponse,
  expectInternalErrorResponse,
} from "../../../helpers/api-gateway";
import {
  mockCreateAlbumRequest,
  mockTimestamp,
} from "../../../fixtures/albums";

// Mock the DynamoDB service and uuid
jest.mock("../../../../shared/utils/dynamodb");
jest.mock("uuid");

const mockCreateAlbum = DynamoDBService.createAlbum as jest.MockedFunction<
  typeof DynamoDBService.createAlbum
>;

describe("Albums Create Handler", () => {
  beforeEach(() => {
    mockCreateAlbum.mockClear();
    // Mock Date.prototype.toISOString to return consistent timestamp
    jest.spyOn(Date.prototype, "toISOString").mockReturnValue(mockTimestamp);
    // Mock uuid to return consistent ID
    const { v4: uuidv4 } = require("uuid");
    (uuidv4 as jest.Mock).mockReturnValue("mock-uuid-123");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("successful requests", () => {
    it("should create album with all fields", async () => {
      mockCreateAlbum.mockResolvedValue();

      const event = createCreateAlbumEvent(mockCreateAlbumRequest);
      const result = await handler(event);

      const data = expectCreatedResponse(result);
      expect(data).toEqual({
        id: "mock-uuid-123",
        title: "Test Album",
        tags: ["test", "unit-testing", "photography"],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        mediaCount: 0,
        isPublic: true,
      });

      expect(mockCreateAlbum).toHaveBeenCalledWith({
        PK: "ALBUM#mock-uuid-123",
        SK: "METADATA",
        GSI1PK: "ALBUM",
        GSI1SK: `${mockTimestamp}#mock-uuid-123`,
        EntityType: "Album",
        id: "mock-uuid-123",
        title: "Test Album",
        tags: ["test", "unit-testing", "photography"],
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        mediaCount: 0,
        isPublic: true,
      });
    });

    it("should create album with minimal fields", async () => {
      mockCreateAlbum.mockResolvedValue();

      const minimalRequest = {
        title: "Minimal Album",
      };

      const event = createCreateAlbumEvent(minimalRequest);
      const result = await handler(event);

      const data = expectCreatedResponse(result);
      expect(data).toEqual({
        id: "mock-uuid-123",
        title: "Minimal Album",
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        mediaCount: 0,
        isPublic: false,
      });
      expect(data.tags).toBeUndefined();

      expect(mockCreateAlbum).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Minimal Album",
          tags: undefined,
          isPublic: false,
        })
      );
    });

    it("should create album with isPublic defaulting to false", async () => {
      mockCreateAlbum.mockResolvedValue();

      const requestWithoutIsPublic = {
        title: "Test Album",
        tags: ["test"],
      };

      const event = createCreateAlbumEvent(requestWithoutIsPublic);
      const result = await handler(event);

      const data = expectCreatedResponse(result);
      expect(data.isPublic).toBe(false);

      expect(mockCreateAlbum).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: false,
        })
      );
    });

    it("should trim whitespace from title and handle tags properly", async () => {
      mockCreateAlbum.mockResolvedValue();

      const requestWithWhitespace = {
        title: "  Test Album  ",
        tags: ["  test  ", "  album  "],
        isPublic: true,
      };

      const event = createCreateAlbumEvent(requestWithWhitespace);
      const result = await handler(event);

      const data = expectCreatedResponse(result);
      expect(data.title).toBe("Test Album");
      expect(data.tags).toEqual(["test", "album"]);

      expect(mockCreateAlbum).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Album",
          tags: ["test", "album"],
        })
      );
    });

    it("should handle empty tags array", async () => {
      mockCreateAlbum.mockResolvedValue();

      const requestWithEmptyTags = {
        title: "Test Album",
        tags: [],
        isPublic: true,
      };

      const event = createCreateAlbumEvent(requestWithEmptyTags);
      const result = await handler(event);

      const data = expectCreatedResponse(result);
      expect(data.tags).toEqual([]);

      expect(mockCreateAlbum).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [],
        })
      );
    });
  });

  describe("validation", () => {
    it("should return 400 when request body is missing", async () => {
      const event = createCreateAlbumEvent({});
      event.body = null;

      const result = await handler(event);

      expectBadRequestResponse(result, "Request body is required");
      expect(mockCreateAlbum).not.toHaveBeenCalled();
    });

    it("should return 400 when title is missing", async () => {
      const requestWithoutTitle = {
        tags: ["test"],
        isPublic: true,
      };

      const event = createCreateAlbumEvent(requestWithoutTitle);
      const result = await handler(event);

      expectBadRequestResponse(result, "Album title is required");
      expect(mockCreateAlbum).not.toHaveBeenCalled();
    });

    it("should return 400 when title is empty string", async () => {
      const requestWithEmptyTitle = {
        title: "",
        tags: ["test"],
      };

      const event = createCreateAlbumEvent(requestWithEmptyTitle);
      const result = await handler(event);

      expectBadRequestResponse(result, "Album title is required");
      expect(mockCreateAlbum).not.toHaveBeenCalled();
    });

    it("should return 400 when title is only whitespace", async () => {
      const requestWithWhitespaceTitle = {
        title: "   ",
        tags: ["test"],
      };

      const event = createCreateAlbumEvent(requestWithWhitespaceTitle);
      const result = await handler(event);

      expectBadRequestResponse(result, "Album title is required");
      expect(mockCreateAlbum).not.toHaveBeenCalled();
    });

    it("should return 500 when request body is invalid JSON", async () => {
      const event = createCreateAlbumEvent({});
      event.body = "invalid json";

      const result = await handler(event);
      expect(result.statusCode).toBe(500);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Failed to create album");
    });
  });

  describe("error handling", () => {
    it("should return 500 when DynamoDB service throws error", async () => {
      const error = new Error("DynamoDB connection failed");
      mockCreateAlbum.mockRejectedValue(error);

      const event = createCreateAlbumEvent(mockCreateAlbumRequest);
      const result = await handler(event);

      expectInternalErrorResponse(result, "Failed to create album");
      expect(mockCreateAlbum).toHaveBeenCalled();
    });

    it("should return 500 when DynamoDB service throws ConditionalCheckFailedException", async () => {
      const error = new Error("The conditional request failed");
      error.name = "ConditionalCheckFailedException";
      mockCreateAlbum.mockRejectedValue(error);

      const event = createCreateAlbumEvent(mockCreateAlbumRequest);
      const result = await handler(event);

      expectInternalErrorResponse(result, "Failed to create album");
    });

    it("should log error to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Test error");
      mockCreateAlbum.mockRejectedValue(error);

      const event = createCreateAlbumEvent(mockCreateAlbumRequest);
      await handler(event);

      expect(consoleSpy).toHaveBeenCalledWith("Error creating album:", error);
      consoleSpy.mockRestore();
    });
  });

  describe("response format", () => {
    it("should return correct response structure", async () => {
      mockCreateAlbum.mockResolvedValue();

      const event = createCreateAlbumEvent(mockCreateAlbumRequest);
      const result = await handler(event);

      const data = expectCreatedResponse(result);

      // Check all required fields are present
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("title");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");
      expect(data).toHaveProperty("mediaCount");
      expect(data).toHaveProperty("isPublic");

      // Check optional fields are included when present
      expect(data).toHaveProperty("tags");
    });

    it("should not include DynamoDB-specific fields", async () => {
      mockCreateAlbum.mockResolvedValue();

      const event = createCreateAlbumEvent(mockCreateAlbumRequest);
      const result = await handler(event);

      const data = expectCreatedResponse(result);

      // Ensure DynamoDB-specific fields are not included
      expect(data).not.toHaveProperty("PK");
      expect(data).not.toHaveProperty("SK");
      expect(data).not.toHaveProperty("GSI1PK");
      expect(data).not.toHaveProperty("GSI1SK");
      expect(data).not.toHaveProperty("EntityType");
    });

    it("should have correct data types", async () => {
      mockCreateAlbum.mockResolvedValue();

      const event = createCreateAlbumEvent(mockCreateAlbumRequest);
      const result = await handler(event);

      const data = expectCreatedResponse(result);

      expect(typeof data.id).toBe("string");
      expect(typeof data.title).toBe("string");
      expect(typeof data.createdAt).toBe("string");
      expect(typeof data.updatedAt).toBe("string");
      expect(typeof data.mediaCount).toBe("number");
      expect(typeof data.isPublic).toBe("boolean");

      if (data.tags !== undefined) {
        expect(Array.isArray(data.tags)).toBe(true);
      }
    });

    it("should set mediaCount to 0 for new albums", async () => {
      mockCreateAlbum.mockResolvedValue();

      const event = createCreateAlbumEvent(mockCreateAlbumRequest);
      const result = await handler(event);

      const data = expectCreatedResponse(result);
      expect(data.mediaCount).toBe(0);
    });

    it("should set createdAt and updatedAt to same timestamp", async () => {
      mockCreateAlbum.mockResolvedValue();

      const event = createCreateAlbumEvent(mockCreateAlbumRequest);
      const result = await handler(event);

      const data = expectCreatedResponse(result);
      expect(data.createdAt).toBe(data.updatedAt);
      expect(data.createdAt).toBe(mockTimestamp);
    });
  });

  describe("edge cases", () => {
    it("should handle very long titles", async () => {
      mockCreateAlbum.mockResolvedValue();

      const longTitle = "a".repeat(1000);
      const requestWithLongTitle = {
        title: longTitle,
      };

      const event = createCreateAlbumEvent(requestWithLongTitle);
      const result = await handler(event);

      const data = expectCreatedResponse(result);
      expect(data.title).toBe(longTitle);
    });

    it("should handle special characters in title and description", async () => {
      mockCreateAlbum.mockResolvedValue();

      const specialRequest = {
        title: "Album with émojis 🎨 & symbols!",
        tags: ['tag with <html> & "quotes"', "中文", "émojis 🎨"],
        isPublic: true,
      };

      const event = createCreateAlbumEvent(specialRequest);
      const result = await handler(event);

      const data = expectCreatedResponse(result);
      expect(data.title).toBe(specialRequest.title);
      expect(data.tags).toEqual(specialRequest.tags);
    });
  });
});
