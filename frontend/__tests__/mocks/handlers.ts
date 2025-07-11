import { http, HttpResponse } from "msw";
import {
  Album,
  Media,
  ApiResponse,
  PaginatedResponse,
} from "../fixtures/types";
import { mockAlbums, mockMedia } from "../fixtures/data";

const API_BASE_URL =
  process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api";

export const handlers = [
  // Albums endpoints
  http.get(`${API_BASE_URL}/albums`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const isPublic = url.searchParams.get("isPublic");

    let filteredAlbums = mockAlbums;
    if (isPublic !== null) {
      filteredAlbums = mockAlbums.filter(
        (album) => album.isPublic === (isPublic === "true")
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAlbums = filteredAlbums.slice(startIndex, endIndex);

    const response: PaginatedResponse<Album> = {
      success: true,
      data: paginatedAlbums,
      pagination: {
        page,
        limit,
        total: filteredAlbums.length,
        hasNext: endIndex < filteredAlbums.length,
        hasPrev: page > 1,
      },
    };

    return HttpResponse.json(response);
  }),

  http.get(`${API_BASE_URL}/albums/:id`, ({ params }) => {
    const album = mockAlbums.find((a) => a.id === params["id"]);

    if (!album) {
      const response: ApiResponse = {
        success: false,
        error: "Album not found",
      };
      return HttpResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Album> = {
      success: true,
      data: album,
    };

    return HttpResponse.json(response);
  }),

  http.post(`${API_BASE_URL}/albums`, async ({ request }) => {
    const body = (await request.json()) as any;

    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      title: body.title,
      description: body.description,
      isPublic: body.isPublic ?? true,
      mediaCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockAlbums.push(newAlbum);

    const response: ApiResponse<Album> = {
      success: true,
      data: newAlbum,
      message: "Album created successfully",
    };

    return HttpResponse.json(response, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/albums/:id`, async ({ params, request }) => {
    const albumIndex = mockAlbums.findIndex((a) => a.id === params["id"]);

    if (albumIndex === -1) {
      const response: ApiResponse = {
        success: false,
        error: "Album not found",
      };
      return HttpResponse.json(response, { status: 404 });
    }

    const body = (await request.json()) as any;
    const updatedAlbum = {
      ...mockAlbums[albumIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    mockAlbums[albumIndex] = updatedAlbum;

    const response: ApiResponse<Album> = {
      success: true,
      data: updatedAlbum,
      message: "Album updated successfully",
    };

    return HttpResponse.json(response);
  }),

  http.delete(`${API_BASE_URL}/albums/:id`, ({ params }) => {
    const albumIndex = mockAlbums.findIndex((a) => a.id === params["id"]);

    if (albumIndex === -1) {
      const response: ApiResponse = {
        success: false,
        error: "Album not found",
      };
      return HttpResponse.json(response, { status: 404 });
    }

    mockAlbums.splice(albumIndex, 1);

    const response: ApiResponse = {
      success: true,
      message: "Album deleted successfully",
    };

    return HttpResponse.json(response);
  }),

  // Media endpoints
  http.get(`${API_BASE_URL}/albums/:albumId/media`, ({ params, request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const albumMedia = mockMedia.filter((m) => m.albumId === params["albumId"]);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMedia = albumMedia.slice(startIndex, endIndex);

    const response: PaginatedResponse<Media> = {
      success: true,
      data: paginatedMedia,
      pagination: {
        page,
        limit,
        total: albumMedia.length,
        hasNext: endIndex < albumMedia.length,
        hasPrev: page > 1,
      },
    };

    return HttpResponse.json(response);
  }),

  http.post(
    `${API_BASE_URL}/albums/:albumId/media/upload`,
    async ({ params, request }) => {
      const body = (await request.json()) as any;

      const newMedia: Media = {
        id: `media-${Date.now()}`,
        albumId: params["albumId"] as string,
        filename: body.filename,
        originalName: body.originalFilename || body.filename,
        originalFilename: body.originalFilename || body.filename,
        mimeType: body.mimeType,
        size: body.size,
        width: body.width,
        height: body.height,
        url: `https://example.com/media/${body.filename}`,
        thumbnailUrl: `https://example.com/thumbnails/${body.filename}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: body.metadata,
      };

      mockMedia.push(newMedia as any);

      // Update album media count
      const album = mockAlbums.find((a) => a.id === params["albumId"]);
      if (album) {
        album.mediaCount += 1;
        album.updatedAt = new Date().toISOString();
      }

      const response: ApiResponse<Media> = {
        success: true,
        data: newMedia,
        message: "Media uploaded successfully",
      };

      return HttpResponse.json(response, { status: 201 });
    }
  ),

  http.delete(`${API_BASE_URL}/media/:id`, ({ params }) => {
    const mediaIndex = mockMedia.findIndex((m) => m.id === params["id"]);

    if (mediaIndex === -1) {
      const response: ApiResponse = {
        success: false,
        error: "Media not found",
      };
      return HttpResponse.json(response, { status: 404 });
    }

    const media = mockMedia[mediaIndex];
    mockMedia.splice(mediaIndex, 1);

    // Update album media count
    const album = mockAlbums.find((a) => a.id === media?.albumId);
    if (album) {
      album.mediaCount = Math.max(0, album.mediaCount - 1);
      album.updatedAt = new Date().toISOString();
    }

    const response: ApiResponse = {
      success: true,
      message: "Media deleted successfully",
    };

    return HttpResponse.json(response);
  }),

  // Error simulation endpoints for testing
  http.get(`${API_BASE_URL}/albums/error-test`, () => {
    return HttpResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }),

  http.get(`${API_BASE_URL}/albums/timeout-test`, () => {
    return new Promise(() => {
      // Never resolves to simulate timeout
    });
  }),
];
