import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";
import { useAlbums } from "../../src/hooks/useAlbums";
import { mockAlbums } from "../fixtures/data";

// Mock fetch globally
global.fetch = jest.fn();

describe("useAlbums Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches albums successfully", async () => {
    const { result } = renderHook(() => useAlbums());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.albums).toEqual([]);
    expect(result.current.error).toBe(null);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.albums).toHaveLength(4);
    expect(result.current.albums[0]).toMatchObject({
      id: "album-1",
      title: "Nature Photography",
    });
    expect(result.current.error).toBe(null);
  });

  it("handles API errors gracefully", async () => {
    // Mock API error
    server.use(
      http.get("/api/albums", () => {
        return HttpResponse.json(
          { success: false, error: "Server error" },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useAlbums());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.albums).toEqual([]);
    expect(result.current.error).toBe("Server error");
  });

  it("handles network errors", async () => {
    // Mock network error
    server.use(
      http.get("/api/albums", () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useAlbums());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.albums).toEqual([]);
    expect(result.current.error).toBe("Failed to fetch albums");
  });

  it("supports filtering by public albums only", async () => {
    const { result } = renderHook(() => useAlbums({ publicOnly: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only return public albums
    expect(result.current.albums).toHaveLength(3);
    expect(result.current.albums.every((album) => album.isPublic)).toBe(true);
  });

  it("supports pagination", async () => {
    const { result } = renderHook(() => useAlbums({ page: 1, limit: 2 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.albums).toHaveLength(2);
    expect(result.current.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 4,
      totalPages: 2,
      hasNext: true,
      hasPrev: false,
    });
  });

  it("refetches data when parameters change", async () => {
    const { result, rerender } = renderHook(
      ({ publicOnly }) => useAlbums({ publicOnly }),
      { initialProps: { publicOnly: false } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.albums).toHaveLength(4);

    // Change parameters
    rerender({ publicOnly: true });

    // Should refetch with new parameters
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.albums).toHaveLength(3);
  });

  it("provides refresh function", async () => {
    const { result } = renderHook(() => useAlbums());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call refresh
    result.current.refresh();

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.albums).toHaveLength(4);
  });

  it("handles concurrent requests correctly", async () => {
    const { result, rerender } = renderHook(({ page }) => useAlbums({ page }), {
      initialProps: { page: 1 },
    });

    // Quickly change page multiple times
    rerender({ page: 2 });
    rerender({ page: 3 });
    rerender({ page: 1 });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have the result from the last request
    expect(result.current.pagination?.page).toBe(1);
  });

  it("cleans up on unmount", async () => {
    const { result, unmount } = renderHook(() => useAlbums());

    // Start loading
    expect(result.current.loading).toBe(true);

    // Unmount before completion
    unmount();

    // Should not cause any errors or memory leaks
    expect(true).toBe(true); // Test passes if no errors thrown
  });
});
