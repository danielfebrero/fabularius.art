"use client";

import React from "react";
import { useAlbums } from "@/hooks/useAlbumsWithQuery"; // Drop-in replacement
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";
import { Heart, Bookmark, Plus, RefreshCw } from "lucide-react";

/**
 * Example component demonstrating TanStack Query integration
 *
 * This component shows:
 * 1. Drop-in replacement for useAlbums (same interface, better caching)
 * 2. Automatic background refetching and caching
 * 3. Optimistic mutations for album creation
 * 4. Infinite scroll with page-level caching
 */
export function TanStackQueryExample() {
  const { user } = useUser();

  // Drop-in replacement - same interface as before but with TanStack Query benefits
  const {
    albums,
    loading,
    loadingMore,
    error,
    pagination,
    loadMore,
    createAlbum,
    refresh,
  } = useAlbums({
    isPublic: true,
    limit: 12,
  });

  const handleCreateAlbum = async () => {
    if (!createAlbum) return;

    try {
      // This will:
      // 1. Immediately add the album to the UI
      // 2. Send the request to create it
      // 3. Update with server response
      await createAlbum({
        title: `New Album ${Date.now()}`,
        tags: ["example", "tanstack-query"],
        isPublic: true,
      });
    } catch (error) {
      console.error("Failed to create album:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Albums with TanStack Query</h2>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-500">Error: {error}</div>
        <Button onClick={refresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with benefits */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Albums with TanStack Query</h2>
          <div className="flex gap-2">
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {user && createAlbum && (
              <Button onClick={handleCreateAlbum} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Album
              </Button>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <div>✅ Automatic caching and background refetching</div>
          <div>✅ Optimistic updates for instant UI feedback</div>
          <div>✅ Request deduplication and smart error handling</div>
          <div>✅ Infinite scroll with page-level caching</div>
        </div>
      </div>

      {/* Albums grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => (
          <div
            key={album.id}
            className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Album cover */}
            <div className="aspect-square bg-muted relative">
              {album.coverImageUrl ? (
                <img
                  src={album.coverImageUrl}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Cover
                </div>
              )}

              {/* Overlay info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 text-white text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {album.likeCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="w-3 h-3" />
                      {album.bookmarkCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Album info */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold truncate">{album.title}</h3>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{album.mediaCount || 0} items</span>
                <span className="text-xs">
                  {album.createdByType === "admin" ? "Admin" : "User"}
                </span>
              </div>

              {/* Tags */}
              {album.tags && album.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {album.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-muted text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {album.tags.length > 3 && (
                    <span className="px-2 py-1 bg-muted text-xs rounded-full">
                      +{album.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Created date */}
              <div className="text-xs text-muted-foreground">
                Created {new Date(album.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {pagination?.hasNext && (
        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={loadingMore}
            variant="outline"
            size="lg"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Albums"
            )}
          </Button>
        </div>
      )}

      {/* TanStack Query benefits demo */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">TanStack Query in Action</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium">Cache Status:</div>
              <div>• Albums loaded: {albums.length}</div>
              <div>• Loading: {loading ? "Yes" : "No"}</div>
              <div>• Loading more: {loadingMore ? "Yes" : "No"}</div>
              <div>• Has more pages: {pagination?.hasNext ? "Yes" : "No"}</div>
            </div>

            <div className="space-y-2">
              <div className="font-medium">Try these features:</div>
              <div>• Navigate away and back - data persists!</div>
              <div>• Refresh button - smart background updates</div>
              <div>• Create album - optimistic UI updates</div>
              <div>• Open React Query DevTools (F12)</div>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-black/20 p-3 rounded text-xs space-y-1">
            <div className="font-medium">What TanStack Query is doing:</div>
            <div>🚀 Caching responses for 5 minutes</div>
            <div>🔄 Background refetching when data becomes stale</div>
            <div>⚡ Deduplicating identical requests</div>
            <div>🎯 Optimistic updates for better UX</div>
            <div>📄 Page-level caching for infinite scroll</div>
          </div>
        </div>
      </div>
    </div>
  );
}
