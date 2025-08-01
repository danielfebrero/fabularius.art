import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../../../../functions/admin/albums/bulk-delete";

// Mock dependencies
jest.mock("../../../../../shared/utils/dynamodb");
jest.mock("../../../../../shared/utils/response");
jest.mock("../../../../../shared/utils/revalidation");

import { DynamoDBService } from "../../../../../shared/utils/dynamodb";
import { ResponseUtil } from "../../../../../shared/utils/response";
import { RevalidationService } from "../../../../../shared/utils/revalidation";

// Create typed mocks
const mockDynamoDBService = DynamoDBService as jest.Mocked<typeof DynamoDBService>;
const mockResponseUtil = ResponseUtil as jest.Mocked<typeof ResponseUtil>;
const mockRevalidationService = RevalidationService as jest.Mocked<typeof RevalidationService>;

describe("Admin Bulk Delete Albums Function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockEvent = (body?: object): Partial<APIGatewayProxyEvent> => ({
    httpMethod: "DELETE",
    body: body ? JSON.stringify(body) : null,
    pathParameters: {},
    queryStringParameters: {},
    requestContext: {
      authorizer: {
        userId: "admin-user-id",
        role: "admin",
      },
    } as any,
  });

  it("should handle OPTIONS requests", async () => {
    const event = {
      httpMethod: "OPTIONS",
    } as APIGatewayProxyEvent;

    mockResponseUtil.noContent.mockReturnValue({
      statusCode: 204,
      body: "",
      headers: {},
    });

    const result = await handler(event);

    expect(mockResponseUtil.noContent).toHaveBeenCalledWith(event);
    expect(result.statusCode).toBe(204);
  });

  it("should require request body", async () => {
    const event = createMockEvent() as APIGatewayProxyEvent;

    mockResponseUtil.badRequest.mockReturnValue({
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is required" }),
      headers: {},
    });

    await handler(event);

    expect(mockResponseUtil.badRequest).toHaveBeenCalledWith(
      event,
      "Request body is required"
    );
  });

  it("should require albumIds array", async () => {
    const event = createMockEvent({}) as APIGatewayProxyEvent;

    mockResponseUtil.badRequest.mockReturnValue({
      statusCode: 400,
      body: JSON.stringify({ error: "Album IDs array is required and must not be empty" }),
      headers: {},
    });

    await handler(event);

    expect(mockResponseUtil.badRequest).toHaveBeenCalledWith(
      event,
      "Album IDs array is required and must not be empty"
    );
  });

  it("should validate albumIds array is not empty", async () => {
    const event = createMockEvent({ albumIds: [] }) as APIGatewayProxyEvent;

    mockResponseUtil.badRequest.mockReturnValue({
      statusCode: 400,
      body: JSON.stringify({ error: "Album IDs array is required and must not be empty" }),
      headers: {},
    });

    await handler(event);

    expect(mockResponseUtil.badRequest).toHaveBeenCalledWith(
      event,
      "Album IDs array is required and must not be empty"
    );
  });

  it("should validate albumIds are strings", async () => {
    const event = createMockEvent({ albumIds: ["valid-id", "", null] }) as APIGatewayProxyEvent;

    mockResponseUtil.badRequest.mockReturnValue({
      statusCode: 400,
      body: JSON.stringify({ error: "All album IDs must be non-empty strings" }),
      headers: {},
    });

    await handler(event);

    expect(mockResponseUtil.badRequest).toHaveBeenCalledWith(
      event,
      "All album IDs must be non-empty strings"
    );
  });

  it("should enforce maximum bulk delete size", async () => {
    const largeAlbumIds = Array.from({ length: 51 }, (_, i) => `album-${i}`);
    const event = createMockEvent({ albumIds: largeAlbumIds }) as APIGatewayProxyEvent;

    mockResponseUtil.badRequest.mockReturnValue({
      statusCode: 400,
      body: JSON.stringify({ error: "Cannot delete more than 50 albums at once" }),
      headers: {},
    });

    await handler(event);

    expect(mockResponseUtil.badRequest).toHaveBeenCalledWith(
      event,
      "Cannot delete more than 50 albums at once. Please split into smaller batches."
    );
  });

  it("should successfully delete multiple albums", async () => {
    const albumIds = ["album-1", "album-2"];
    const event = createMockEvent({ albumIds }) as APIGatewayProxyEvent;

    // Mock album exists
    mockDynamoDBService.getAlbum
      .mockResolvedValueOnce({ id: "album-1", title: "Album 1" } as any)
      .mockResolvedValueOnce({ id: "album-2", title: "Album 2" } as any);

    // Mock media list
    mockDynamoDBService.listAlbumMedia
      .mockResolvedValueOnce({ media: [{ id: "media-1" }, { id: "media-2" }] } as any)
      .mockResolvedValueOnce({ media: [{ id: "media-3" }] } as any);

    // Mock removal operations
    mockDynamoDBService.removeMediaFromAlbum.mockResolvedValue();
    mockDynamoDBService.deleteAllCommentsForTarget.mockResolvedValue();
    mockDynamoDBService.deleteAllInteractionsForTarget.mockResolvedValue();
    mockDynamoDBService.deleteAlbum.mockResolvedValue();

    // Mock revalidation
    mockRevalidationService.revalidateAlbums.mockResolvedValue();

    mockResponseUtil.success.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {},
    });

    await handler(event);

    expect(mockDynamoDBService.getAlbum).toHaveBeenCalledTimes(2);
    expect(mockDynamoDBService.listAlbumMedia).toHaveBeenCalledTimes(2);
    expect(mockDynamoDBService.removeMediaFromAlbum).toHaveBeenCalledTimes(3); // 2 + 1 media items
    expect(mockDynamoDBService.deleteAllCommentsForTarget).toHaveBeenCalledTimes(2);
    expect(mockDynamoDBService.deleteAllInteractionsForTarget).toHaveBeenCalledTimes(2);
    expect(mockDynamoDBService.deleteAlbum).toHaveBeenCalledTimes(2);
    expect(mockRevalidationService.revalidateAlbums).toHaveBeenCalledTimes(1);
    expect(mockResponseUtil.success).toHaveBeenCalled();
  });

  it("should handle partial failures gracefully", async () => {
    const albumIds = ["album-1", "album-2", "album-3"];
    const event = createMockEvent({ albumIds }) as APIGatewayProxyEvent;

    // First album exists
    mockDynamoDBService.getAlbum
      .mockResolvedValueOnce({ id: "album-1", title: "Album 1" } as any)
      .mockResolvedValueOnce(null) // Second album doesn't exist
      .mockRejectedValueOnce(new Error("Database error")); // Third album causes error

    // Mock for successful album
    mockDynamoDBService.listAlbumMedia.mockResolvedValueOnce({ media: [] } as any);
    mockDynamoDBService.deleteAllCommentsForTarget.mockResolvedValue();
    mockDynamoDBService.deleteAllInteractionsForTarget.mockResolvedValue();
    mockDynamoDBService.deleteAlbum.mockResolvedValue();

    // Mock revalidation
    mockRevalidationService.revalidateAlbums.mockResolvedValue();

    mockResponseUtil.success.mockReturnValue({
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {},
    });

    await handler(event);

    expect(mockDynamoDBService.getAlbum).toHaveBeenCalledTimes(3);
    expect(mockDynamoDBService.deleteAlbum).toHaveBeenCalledTimes(1); // Only successful album
    expect(mockRevalidationService.revalidateAlbums).toHaveBeenCalledTimes(1);
    expect(mockResponseUtil.success).toHaveBeenCalled();
  });

  it("should return error when all deletions fail", async () => {
    const albumIds = ["album-1", "album-2"];
    const event = createMockEvent({ albumIds }) as APIGatewayProxyEvent;

    // Mock all albums not found
    mockDynamoDBService.getAlbum.mockResolvedValue(null);

    mockResponseUtil.internalError.mockReturnValue({
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete any albums" }),
      headers: {},
    });

    await handler(event);

    expect(mockDynamoDBService.getAlbum).toHaveBeenCalledTimes(2);
    expect(mockDynamoDBService.deleteAlbum).not.toHaveBeenCalled();
    expect(mockRevalidationService.revalidateAlbums).not.toHaveBeenCalled();
    expect(mockResponseUtil.internalError).toHaveBeenCalledWith(
      event,
      "Failed to delete any albums"
    );
  });

  it("should handle unexpected errors", async () => {
    const event = createMockEvent({ albumIds: ["album-1"] }) as APIGatewayProxyEvent;

    // Simulate unexpected error during JSON parsing
    const eventWithBadJSON = {
      ...event,
      body: "invalid json",
    } as APIGatewayProxyEvent;

    mockResponseUtil.internalError.mockReturnValue({
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process bulk delete request" }),
      headers: {},
    });

    await handler(eventWithBadJSON);

    expect(mockResponseUtil.internalError).toHaveBeenCalledWith(
      eventWithBadJSON,
      "Failed to process bulk delete request"
    );
  });
});
