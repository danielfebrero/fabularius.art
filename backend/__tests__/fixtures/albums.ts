import { Album, AlbumEntity, CreateAlbumRequest } from "../../shared/types";

export const mockAlbumId = "test-album-123";
export const mockTimestamp = "2023-01-01T00:00:00.000Z";

export const mockCreateAlbumRequest: CreateAlbumRequest = {
  title: "Test Album",
  tags: ["test", "unit-testing", "photography"],
  isPublic: true,
};

export const mockAlbumEntity: AlbumEntity = {
  PK: `ALBUM#${mockAlbumId}`,
  SK: "METADATA",
  GSI1PK: "ALBUM",
  GSI1SK: `${mockTimestamp}#${mockAlbumId}`,
  EntityType: "Album",
  id: mockAlbumId,
  title: "Test Album",
  tags: ["test", "unit-testing", "photography"],
  coverImageUrl: "https://test.cloudfront.net/albums/test-album-123/cover.jpg",
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
  mediaCount: 5,
  isPublic: "true",
};

export const mockAlbum: Album = {
  id: mockAlbumId,
  title: "Test Album",
  tags: ["test", "unit-testing", "photography"],
  coverImageUrl: "https://test.cloudfront.net/albums/test-album-123/cover.jpg",
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
  mediaCount: 5,
  isPublic: true,
};

export const mockAlbumEntityMinimal: AlbumEntity = {
  PK: `ALBUM#${mockAlbumId}`,
  SK: "METADATA",
  GSI1PK: "ALBUM",
  GSI1SK: `${mockTimestamp}#${mockAlbumId}`,
  EntityType: "Album",
  id: mockAlbumId,
  title: "Minimal Album",
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
  mediaCount: 0,
  isPublic: "false",
};

export const mockAlbumMinimal: Album = {
  id: mockAlbumId,
  title: "Minimal Album",
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
  mediaCount: 0,
  isPublic: false,
};

export const mockAlbumsList: AlbumEntity[] = [
  mockAlbumEntity,
  {
    ...mockAlbumEntity,
    id: "album-2",
    PK: "ALBUM#album-2",
    GSI1SK: "2023-01-02T00:00:00.000Z#album-2",
    title: "Second Album",
    tags: ["test", "second"],
    mediaCount: 3,
  },
  {
    ...mockAlbumEntity,
    id: "album-3",
    PK: "ALBUM#album-3",
    GSI1SK: "2023-01-03T00:00:00.000Z#album-3",
    title: "Third Album",
    mediaCount: 0,
    isPublic: "false",
    tags: undefined,
    coverImageUrl: undefined,
  },
];

export const mockPaginationResponse = {
  albums: mockAlbumsList,
  lastEvaluatedKey: {
    PK: "ALBUM#album-3",
    SK: "METADATA",
    GSI1PK: "ALBUM",
    GSI1SK: "2023-01-03T00:00:00.000Z#album-3",
  },
};
