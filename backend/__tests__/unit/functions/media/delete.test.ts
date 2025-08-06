import { handler } from "../../../../functions/media/delete";
import { DynamoDBService } from "../../../../shared/utils/dynamodb";
import { S3Service } from "../../../../shared/utils/s3";
import { RevalidationService } from "../../../../shared/utils/revalidation";
import { UserAuthUtil } from "../../../../shared/utils/user-auth";
import { APIGatewayProxyEvent } from "aws-lambda";

// Mock dependencies
jest.mock("../../../../shared/utils/dynamodb");
jest.mock("../../../../shared/utils/s3");
jest.mock("../../../../shared/utils/revalidation");
jest.mock("../../../../shared/utils/user-auth");

const mockDynamoDBService = DynamoDBService as jest.Mocked<
  typeof DynamoDBService
>;
const mockS3Service = S3Service as jest.Mocked<typeof S3Service>;
const mockRevalidationService = RevalidationService as jest.Mocked<
  typeof RevalidationService
>;
const mockUserAuthUtil = UserAuthUtil as jest.Mocked<typeof UserAuthUtil>;

describe("Delete Media Handler", () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    httpMethod: "DELETE",
    pathParameters: {
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

  it("should return 400 if mediaId is missing", async () => {
    const eventWithoutMediaId = {
      ...mockEvent,
      pathParameters: {},
    };

    const result = await handler(eventWithoutMediaId as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Media ID is required");
  });

  it("should return authentication error if user not authenticated", async () => {
    mockUserAuthUtil.requireAuth.mockResolvedValue({
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    });
    mockUserAuthUtil.isErrorResponse.mockReturnValue(true);

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(401);
  });

  it("should return 404 if media not found", async () => {
    mockUserAuthUtil.requireAuth.mockResolvedValue({
      userId: "test-user-id",
      authSource: "authorizer",
    });
    mockUserAuthUtil.isErrorResponse.mockReturnValue(false);
    mockDynamoDBService.getMedia.mockResolvedValue(null);

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Media not found");
  });

  it("should return 403 if user doesn't own the media", async () => {
    mockUserAuthUtil.requireAuth.mockResolvedValue({
      userId: "test-user-id",
      authSource: "authorizer",
    });
    mockUserAuthUtil.isErrorResponse.mockReturnValue(false);
    mockDynamoDBService.getMedia.mockResolvedValue({
      id: "test-media-id",
      filename: "test.jpg",
      url: "/test.jpg",
      createdBy: "other-user-id",
    } as any);

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body).error).toBe(
      "You can only delete your own media"
    );
  });

  it("should successfully delete media", async () => {
    mockUserAuthUtil.requireAuth.mockResolvedValue({
      userId: "test-user-id",
      authSource: "authorizer",
    });
    mockUserAuthUtil.isErrorResponse.mockReturnValue(false);
    mockDynamoDBService.getMedia.mockResolvedValue({
      id: "test-media-id",
      filename: "test.jpg",
      url: "/test.jpg",
      createdBy: "test-user-id",
    } as any);
    mockDynamoDBService.getAlbumMediaRelations.mockResolvedValue([
      {
        albumId: "test-album-1",
        mediaId: "test-media-id",
      } as any,
      {
        albumId: "test-album-2",
        mediaId: "test-media-id",
      } as any,
    ]);
    mockS3Service.deleteObject.mockResolvedValue();
    mockDynamoDBService.deleteAllCommentsForTarget.mockResolvedValue();
    mockDynamoDBService.deleteAllInteractionsForTarget.mockResolvedValue();
    mockDynamoDBService.deleteMedia.mockResolvedValue();
    mockRevalidationService.revalidateAlbum.mockResolvedValue();

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(mockS3Service.deleteObject).toHaveBeenCalledWith("test.jpg");
    expect(mockDynamoDBService.deleteAllCommentsForTarget).toHaveBeenCalledWith(
      "test-media-id"
    );
    expect(
      mockDynamoDBService.deleteAllInteractionsForTarget
    ).toHaveBeenCalledWith("test-media-id");
    expect(mockDynamoDBService.deleteMedia).toHaveBeenCalledWith(
      "test-media-id"
    );
    expect(mockRevalidationService.revalidateAlbum).toHaveBeenCalledWith(
      "test-album-1"
    );
    expect(mockRevalidationService.revalidateAlbum).toHaveBeenCalledWith(
      "test-album-2"
    );

    const responseBody = JSON.parse(result.body);
    expect(responseBody.success).toBe(true);
    expect(responseBody.data.message).toBe("Media deleted successfully");
    expect(responseBody.data.deletedMediaId).toBe("test-media-id");
    expect(responseBody.data.affectedAlbums).toEqual([
      "test-album-1",
      "test-album-2",
    ]);
  });

  it("should handle errors gracefully", async () => {
    mockUserAuthUtil.requireAuth.mockRejectedValue(new Error("Database error"));

    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe("Failed to delete media");
  });
});
