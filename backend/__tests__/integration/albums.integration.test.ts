import { handler as getAlbumsHandler } from "../../functions/albums/get";
import { handler as getAlbumByIdHandler } from "../../functions/albums/getById";
import { handler as createAlbumHandler } from "../../functions/albums/create";
import { DynamoDBService } from "../../shared/utils/dynamodb";
import {
  createGetAlbumsEvent,
  createGetAlbumByIdEvent,
  createCreateAlbumEvent,
  expectSuccessResponse,
  expectCreatedResponse,
  expectNotFoundResponse,
} from "../helpers/api-gateway";
import { mockCreateAlbumRequest } from "../fixtures/albums";

// Mock the DynamoDB service for integration tests
jest.mock("../../shared/utils/dynamodb");
jest.mock("uuid");

const mockCreateAlbum = DynamoDBService.createAlbum as jest.MockedFunction<
  typeof DynamoDBService.createAlbum
>;
const mockGetAlbum = DynamoDBService.getAlbum as jest.MockedFunction<
  typeof DynamoDBService.getAlbum
>;
const mockListAlbums = DynamoDBService.listAlbums as jest.MockedFunction<
  typeof DynamoDBService.listAlbums
>;

describe("Albums Integration Tests", () => {
  const testTimestamp = "2023-01-01T00:00:00.000Z";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date.prototype, "toISOString").mockReturnValue(testTimestamp);

    // Mock UUID generation
    const { v4: uuidv4 } = require("uuid");
    (uuidv4 as jest.Mock).mockReturnValue("integration-test-album-id");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Album Creation and Retrieval Workflow", () => {
    it("should create an album and then retrieve it by ID", async () => {
      // Step 1: Create an album
      mockCreateAlbum.mockResolvedValue();

      const createEvent = createCreateAlbumEvent(mockCreateAlbumRequest);
      const createResult = await createAlbumHandler(createEvent);

      const createdAlbum = expectCreatedResponse(createResult);
      expect(createdAlbum.id).toBe("integration-test-album-id");
      expect(createdAlbum.title).toBe(mockCreateAlbumRequest.title);

      // Verify the album entity was created correctly
      expect(mockCreateAlbum).toHaveBeenCalledWith({
        PK: "ALBUM#integration-test-album-id",
        SK: "METADATA",
        GSI1PK: "ALBUM",
        GSI1SK: `${testTimestamp}#integration-test-album-id`,
        EntityType: "Album",
        id: "integration-test-album-id",
        title: mockCreateAlbumRequest.title,
        tags: mockCreateAlbumRequest.tags,
        createdAt: testTimestamp,
        updatedAt: testTimestamp,
        mediaCount: 0,
        isPublic: mockCreateAlbumRequest.isPublic,
      });

      // Step 2: Retrieve the created album by ID
      const albumEntity = {
        PK: "ALBUM#integration-test-album-id",
        SK: "METADATA",
        GSI1PK: "ALBUM",
        GSI1SK: `${testTimestamp}#integration-test-album-id`,
        EntityType: "Album" as const,
        id: "integration-test-album-id",
        title: mockCreateAlbumRequest.title,
        tags: mockCreateAlbumRequest.tags,
        createdAt: testTimestamp,
        updatedAt: testTimestamp,
        mediaCount: 0,
        isPublic: mockCreateAlbumRequest.isPublic ?? false,
      };

      mockGetAlbum.mockResolvedValue(albumEntity);

      const getEvent = createGetAlbumByIdEvent("integration-test-album-id");
      const getResult = await getAlbumByIdHandler(getEvent);

      const retrievedAlbum = expectSuccessResponse(getResult);
      expect(retrievedAlbum).toEqual(createdAlbum);
      expect(mockGetAlbum).toHaveBeenCalledWith("integration-test-album-id");
    });

    it("should create multiple albums and list them", async () => {
      // Step 1: Create first album
      mockCreateAlbum.mockResolvedValue();

      const firstAlbumRequest = {
        title: "First Album",
        tags: ["first", "test"],
        isPublic: true,
      };

      const createFirstEvent = createCreateAlbumEvent(firstAlbumRequest);
      const firstResult = await createAlbumHandler(createFirstEvent);

      expectCreatedResponse(firstResult);

      // Step 2: Create second album (simulate different UUID)
      (require("uuid").v4 as jest.Mock).mockReturnValueOnce("second-album-id");

      const secondAlbumRequest = {
        title: "Second Album",
        tags: ["second", "test"],
        isPublic: false,
      };

      const createSecondEvent = createCreateAlbumEvent(secondAlbumRequest);
      const secondResult = await createAlbumHandler(createSecondEvent);

      const secondAlbum = expectCreatedResponse(secondResult);
      expect(secondAlbum.id).toBe("second-album-id");

      // Step 3: List albums
      const albumEntities = [
        {
          PK: "ALBUM#integration-test-album-id",
          SK: "METADATA",
          GSI1PK: "ALBUM",
          GSI1SK: `${testTimestamp}#integration-test-album-id`,
          EntityType: "Album" as const,
          id: "integration-test-album-id",
          title: firstAlbumRequest.title,
          tags: firstAlbumRequest.tags,
          createdAt: testTimestamp,
          updatedAt: testTimestamp,
          mediaCount: 0,
          isPublic: firstAlbumRequest.isPublic,
        },
        {
          PK: "ALBUM#second-album-id",
          SK: "METADATA",
          GSI1PK: "ALBUM",
          GSI1SK: `${testTimestamp}#second-album-id`,
          EntityType: "Album" as const,
          id: "second-album-id",
          title: secondAlbumRequest.title,
          tags: secondAlbumRequest.tags,
          createdAt: testTimestamp,
          updatedAt: testTimestamp,
          mediaCount: 0,
          isPublic: secondAlbumRequest.isPublic,
        },
      ];

      mockListAlbums.mockResolvedValue({
        albums: albumEntities,
      });

      const listEvent = createGetAlbumsEvent();
      const listResult = await getAlbumsHandler(listEvent);

      const albumsList = expectSuccessResponse(listResult);
      expect(albumsList.albums).toHaveLength(2);
      expect(albumsList.albums[0].id).toBe("integration-test-album-id");
      expect(albumsList.albums[1].id).toBe("second-album-id");
      expect(albumsList.pagination.hasNext).toBe(false);
    });
  });

  describe("Error Scenarios Integration", () => {
    it("should handle album not found in get by ID after failed creation", async () => {
      // Step 1: Attempt to create album (simulate failure)
      const error = new Error("DynamoDB write failed");
      mockCreateAlbum.mockRejectedValue(error);

      const createEvent = createCreateAlbumEvent(mockCreateAlbumRequest);
      const createResult = await createAlbumHandler(createEvent);

      expect(createResult.statusCode).toBe(500);

      // Step 2: Try to retrieve the album that wasn't created
      mockGetAlbum.mockResolvedValue(null);

      const getEvent = createGetAlbumByIdEvent("non-existent-id");
      const getResult = await getAlbumByIdHandler(getEvent);

      expectNotFoundResponse(getResult, "Album not found");
    });

    it("should handle empty album list when no albums exist", async () => {
      mockListAlbums.mockResolvedValue({
        albums: [],
      });

      const listEvent = createGetAlbumsEvent();
      const listResult = await getAlbumsHandler(listEvent);

      const albumsList = expectSuccessResponse(listResult);
      expect(albumsList.albums).toHaveLength(0);
      expect(albumsList.pagination.hasNext).toBe(false);
    });
  });

  describe("Data Consistency Integration", () => {
    it("should maintain data consistency between create and retrieve operations", async () => {
      // Create album with specific data
      mockCreateAlbum.mockResolvedValue();

      const albumData = {
        title: "Consistency Test Album",
        tags: ["consistency", "test"],
        isPublic: true,
      };

      const createEvent = createCreateAlbumEvent(albumData);
      const createResult = await createAlbumHandler(createEvent);

      const createdAlbum = expectCreatedResponse(createResult);

      // Simulate retrieving the same album
      const albumEntity = {
        PK: `ALBUM#${createdAlbum.id}`,
        SK: "METADATA",
        GSI1PK: "ALBUM",
        GSI1SK: `${testTimestamp}#${createdAlbum.id}`,
        EntityType: "Album" as const,
        id: createdAlbum.id,
        title: albumData.title,
        tags: albumData.tags,
        createdAt: testTimestamp,
        updatedAt: testTimestamp,
        mediaCount: 0,
        isPublic: albumData.isPublic,
      };

      mockGetAlbum.mockResolvedValue(albumEntity);

      const getEvent = createGetAlbumByIdEvent(createdAlbum.id);
      const getResult = await getAlbumByIdHandler(getEvent);

      const retrievedAlbum = expectSuccessResponse(getResult);

      // Verify all fields match
      expect(retrievedAlbum.id).toBe(createdAlbum.id);
      expect(retrievedAlbum.title).toBe(createdAlbum.title);
      expect(retrievedAlbum.tags).toEqual(createdAlbum.tags);
      expect(retrievedAlbum.isPublic).toBe(createdAlbum.isPublic);
      expect(retrievedAlbum.mediaCount).toBe(createdAlbum.mediaCount);
      expect(retrievedAlbum.createdAt).toBe(createdAlbum.createdAt);
      expect(retrievedAlbum.updatedAt).toBe(createdAlbum.updatedAt);
    });

    it("should handle optional fields consistently", async () => {
      // Create album without optional fields
      mockCreateAlbum.mockResolvedValue();

      const minimalAlbumData = {
        title: "Minimal Album",
      };

      const createEvent = createCreateAlbumEvent(minimalAlbumData);
      const createResult = await createAlbumHandler(createEvent);

      const createdAlbum = expectCreatedResponse(createResult);
      expect(createdAlbum.tags).toBeUndefined();
      expect(createdAlbum.isPublic).toBe(false); // Default value

      // Simulate retrieving the same album
      const albumEntity = {
        PK: `ALBUM#${createdAlbum.id}`,
        SK: "METADATA",
        GSI1PK: "ALBUM",
        GSI1SK: `${testTimestamp}#${createdAlbum.id}`,
        EntityType: "Album" as const,
        id: createdAlbum.id,
        title: minimalAlbumData.title,
        tags: undefined,
        createdAt: testTimestamp,
        updatedAt: testTimestamp,
        mediaCount: 0,
        isPublic: false,
      };

      mockGetAlbum.mockResolvedValue(albumEntity);

      const getEvent = createGetAlbumByIdEvent(createdAlbum.id);
      const getResult = await getAlbumByIdHandler(getEvent);

      const retrievedAlbum = expectSuccessResponse(getResult);
      expect(retrievedAlbum.tags).toBeUndefined();
      expect(retrievedAlbum.isPublic).toBe(false);
    });
  });

  describe("Pagination Integration", () => {
    it("should handle pagination correctly across list operations", async () => {
      const albumEntities = Array.from({ length: 3 }, (_, i) => ({
        PK: `ALBUM#album-${i}`,
        SK: "METADATA",
        GSI1PK: "ALBUM",
        GSI1SK: `${testTimestamp}#album-${i}`,
        EntityType: "Album" as const,
        id: `album-${i}`,
        title: `Album ${i}`,
        tags: [`tag-${i}`, "test"],
        createdAt: testTimestamp,
        updatedAt: testTimestamp,
        mediaCount: 0,
        isPublic: i % 2 === 0,
      }));

      // First page
      mockListAlbums.mockResolvedValueOnce({
        albums: albumEntities.slice(0, 2),
        lastEvaluatedKey: { PK: "ALBUM#album-1", SK: "METADATA" },
      });

      const firstPageEvent = createGetAlbumsEvent({ limit: "2" });
      const firstPageResult = await getAlbumsHandler(firstPageEvent);

      const firstPage = expectSuccessResponse(firstPageResult);
      expect(firstPage.albums).toHaveLength(2);
      expect(firstPage.pagination.hasNext).toBe(true);
      expect(firstPage.pagination.cursor).toBeTruthy();

      // Second page
      mockListAlbums.mockResolvedValueOnce({
        albums: albumEntities.slice(2),
      });

      const secondPageEvent = createGetAlbumsEvent({
        limit: "2",
        cursor: firstPage.pagination.cursor,
      });
      const secondPageResult = await getAlbumsHandler(secondPageEvent);

      const secondPage = expectSuccessResponse(secondPageResult);
      expect(secondPage.albums).toHaveLength(1);
      expect(secondPage.pagination.hasNext).toBe(false);
      expect(secondPage.pagination.cursor).toBeNull();
    });
  });
});
