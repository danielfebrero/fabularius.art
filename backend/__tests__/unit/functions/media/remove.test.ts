import { handler } from "../../../../functions/media/remove";
import { DynamoDBService } from "../../../../shared/utils/dynamodb";
import { UserAuthMiddleware } from "../../../../shared/auth/user-middleware";
import { APIGatewayProxyEvent } from "aws-lambda";

// Mock dependencies
jest.mock("../../../../shared/utils/dynamodb");
jest.mock("../../../../shared/auth/user-middleware");

const mockDynamoDBService = DynamoDBService as jest.Mocked<
  typeof DynamoDBService
>;
const mockUserAuthMiddleware = UserAuthMiddleware as jest.Mocked<
  typeof UserAuthMiddleware
>;

describe("Remove Media from Album Handler", () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    httpMethod: "DELETE",
    pathParameters: {
      albumId: "test-album-id",
      mediaId: "test-media-id",
    },
    headers: {},
    requestContext: {} as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 204 for OPTIONS request", async () => {
    const optionsEvent = { ...mockEvent, httpMethod: "OPTIONS" };
    const result = await handler(optionsEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(204);
  });

  it("should return 400 if albumId is missing", async () => {
    const eventWithoutAlbumId = {
      ...mockEvent,
      pathParameters: { mediaId: "test-media-id" },
    };

    const result = await handler(eventWithoutAlbumId as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Album ID is required");
  });

  it("should return 400 if mediaId is missing", async () => {
    const eventWithoutMediaId = {
      ...mockEvent,
      pathParameters: { albumId: "test-album-id" },
    };

    const result = await handler(eventWithoutMediaId as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Media ID is required");
  });

  it("should return 401 if user session is invalid", async () => {
    mockUserAuthMiddleware.validateSession.mockResolvedValue({
      isValid: false,
      user: null,
    });

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body).error).toBe("Invalid session");
  });

  it("should return 404 if album does not exist", async () => {
    mockUserAuthMiddleware.validateSession.mockResolvedValue({
      isValid: true,
      user: { userId: "test-user-id", email: "test@example.com" },
    });
    mockDynamoDBService.getAlbum.mockResolvedValue(null);

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Album not found");
  });

  it("should return 403 if user does not own the album", async () => {
    mockUserAuthMiddleware.validateSession.mockResolvedValue({
      isValid: true,
      user: { userId: "test-user-id", email: "test@example.com" },
    });
    mockDynamoDBService.getAlbum.mockResolvedValue({
      id: "test-album-id",
      createdBy: "other-user-id", // Different user
      title: "Test Album",
    } as any);

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body).error).toBe(
      "You can only edit your own albums"
    );
  });

  it("should return 404 if media does not exist", async () => {
    mockUserAuthMiddleware.validateSession.mockResolvedValue({
      isValid: true,
      user: { userId: "test-user-id", email: "test@example.com" },
    });
    mockDynamoDBService.getAlbum.mockResolvedValue({
      id: "test-album-id",
      createdBy: "test-user-id",
      title: "Test Album",
    } as any);
    mockDynamoDBService.getMedia.mockResolvedValue(null);

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Media not found");
  });

  it("should successfully remove media from album", async () => {
    mockUserAuthMiddleware.validateSession.mockResolvedValue({
      isValid: true,
      user: { userId: "test-user-id", email: "test@example.com" },
    });
    mockDynamoDBService.getAlbum.mockResolvedValue({
      id: "test-album-id",
      createdBy: "test-user-id",
      title: "Test Album",
    } as any);
    mockDynamoDBService.getMedia.mockResolvedValue({
      id: "test-media-id",
      filename: "test.jpg",
      url: "/test.jpg",
    } as any);
    mockDynamoDBService.removeMediaFromAlbum.mockResolvedValue();

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(mockDynamoDBService.removeMediaFromAlbum).toHaveBeenCalledWith(
      "test-album-id",
      "test-media-id"
    );

    const responseBody = JSON.parse(result.body);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.message).toBe(
      "Media removed from album successfully"
    );
    expect(responseBody.data.albumId).toBe("test-album-id");
    expect(responseBody.data.mediaId).toBe("test-media-id");
  });

  it("should handle errors gracefully", async () => {
    mockUserAuthMiddleware.validateSession.mockRejectedValue(
      new Error("Database error")
    );

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe(
      "Failed to remove media from album"
    );
  });
});
