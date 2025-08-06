# TanStack Query Implementation Guide

## Overview

This guide demonstrates how to migrate from the existing custom hooks to TanStack Query for improved caching, background refetching, and optimistic updates.

## Installation Complete ✅

- ✅ `@tanstack/react-query` and `@tanstack/react-query-devtools` installed
- ✅ `QueryProvider` added to the app layout
- ✅ Query configuration with smart defaults created
- ✅ Consistent query key factory implemented

## New Query Hooks Created

### Albums

- `useAlbumsQuery` - TanStack Query version with infinite scroll
- `useAlbums` - Backward-compatible wrapper (in `useAlbumsWithQuery.ts`)
- `useCreateAlbum`, `useUpdateAlbum`, `useDeleteAlbum` - Optimistic mutations

### Admin Albums

- `useAdminAlbumsQuery` - Admin album management with infinite scroll pagination
- `useAdminAlbumsData` - Helper to extract all albums from paginated data
- `useCreateAdminAlbum`, `useUpdateAdminAlbum`, `useDeleteAdminAlbum` - Admin mutations
- `useBulkDeleteAdminAlbums` - Bulk delete operations with optimistic updates

### Admin Authentication

- `useAdminProfile` - Admin profile data with smart caching and session management
- `useAdminLogin` - Admin login mutation with cache pre-population
- `useAdminLogout` - Admin logout mutation with comprehensive cache clearing
- `useCheckAdminAuth` - Manual admin authentication validation
- `useRefreshAdminProfile` - Manual admin profile cache invalidation

### User Interactions

- `useInteractionStatus` - Efficient batch loading of like/bookmark status
- `useBookmarks`, `useLikes`, `useComments` - Infinite scroll with caching
- `useToggleLike`, `useToggleBookmark` - Optimistic mutations
- `useUserInsights` - User statistics with smart caching

### User Profile

- `useUserProfile` - User data with optimized authentication caching
- `useUpdateUserProfile` - Optimistic profile updates
- `useLogin` - Login with automatic cache invalidation
- `useLogout` - Logout with cache clearing
- `useRefreshUserProfile` - Manual cache invalidation for auth attempts

## Migration Strategies

### 1. Drop-in Replacement (Recommended for quick migration)

**Before:**

```typescript
import { useAlbums } from "@/hooks/useAlbums";

function AlbumList() {
  const { albums, loading, error, loadMore, createAlbum } = useAlbums({
    isPublic: true,
    limit: 12,
  });

  // ... component logic
}
```

**After:**

```typescript
import { useAlbums } from "@/hooks/useAlbumsWithQuery"; // Drop-in replacement

function AlbumList() {
  const { albums, loading, error, loadMore, createAlbum } = useAlbums({
    isPublic: true,
    limit: 12,
  });

  // Same interface, enhanced with TanStack Query features!
}
```

### 2. Full TanStack Query Integration (Recommended for new components)

```typescript
import { useAlbums, useCreateAlbum } from "@/hooks/queries/useAlbumsQuery";

function AlbumList() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAlbums({ isPublic: true, limit: 12 });

  const createMutation = useCreateAlbum();

  const albums = data?.pages.flatMap((page) => page.albums) || [];

  const handleCreateAlbum = async (albumData) => {
    try {
      await createMutation.mutateAsync(albumData);
      // Automatic cache updates and optimistic UI!
    } catch (error) {
      // Error handling
    }
  };

  // ... rest of component
}
```

### 3. Admin Albums Example (Infinite Scroll + Mutations)

```typescript
import {
  useAdminAlbumsData,
  useDeleteAdminAlbum,
  useBulkDeleteAdminAlbums,
} from "@/hooks/queries/useAdminAlbumsQuery";

function AdminAlbumsPage() {
  const {
    albums,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminAlbumsData({ limit: 20 });

  const deleteAlbumMutation = useDeleteAdminAlbum();
  const bulkDeleteMutation = useBulkDeleteAdminAlbums();

  const handleDelete = async (albumId: string) => {
    try {
      await deleteAlbumMutation.mutateAsync(albumId);
      // Optimistic updates handle UI changes automatically
    } catch (error) {
      // Error handling
    }
  };

  const handleBulkDelete = async (albumIds: string[]) => {
    try {
      await bulkDeleteMutation.mutateAsync(albumIds);
      // Bulk operations with optimistic updates
    } catch (error) {
      // Error handling
    }
  };

  return (
    <div>
      {albums.map((album) => (
        <div key={album.id}>
          {album.title}
          <button onClick={() => handleDelete(album.id)}>Delete</button>
        </div>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

## Key Benefits Implemented

### 🚀 **Performance Improvements**

- **Automatic caching**: Queries are cached by default with smart expiration
- **Background refetching**: Data stays fresh without blocking UI
- **Request deduplication**: Multiple components requesting same data = single request
- **Infinite scroll optimization**: Pages are cached individually

### 🔄 **Enhanced User Experience**

- **Optimistic updates**: UI updates immediately, then syncs with server
- **Stale-while-revalidate**: Show cached data while fetching fresh data
- **Error recovery**: Automatic retries with exponential backoff
- **Smart refetching**: Refetch on window focus, reconnection
- **Authentication caching**: Optimized caching for unauthenticated users to prevent excessive API calls

### 🔐 **Authentication Optimization**

- **Smart cache invalidation**: Authentication errors are cached longer (15 minutes) to prevent repeated failed requests
- **Selective refetching**: Window focus refetching is disabled when user is unauthenticated
- **Login-aware caching**: Cache is invalidated when users successfully log in
- **Manual refresh capability**: Developers can trigger authentication retry when needed

### 🛠 **Developer Experience**

- **Query DevTools**: Available in development for debugging
- **Type safety**: Full TypeScript support with inferred types
- **Consistent patterns**: Standardized query keys and cache management
- **Error boundaries**: Better error handling integration

## Configuration Details

### Query Client Settings

```typescript
// Default settings in queryClient.ts
{
  staleTime: 5 * 60 * 1000,      // Data fresh for 5 minutes
  gcTime: 30 * 60 * 1000,        // Cache for 30 minutes when unused
  retry: (failureCount, error) => {
    // Don't retry 4xx errors, retry others up to 3 times
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    return failureCount < 3;
  },
  refetchOnWindowFocus: true,     // Refetch when user returns to tab
  refetchOnReconnect: true,       // Refetch when connection restored
}
```

### Query Keys Strategy

```typescript
// Hierarchical query keys for easy invalidation
queryKeys.albums.list({ isPublic: true, tag: "amateur" });
// → ["albums", "list", { isPublic: true, tag: "amateur" }]

queryKeys.user.interactions.bookmarks({ limit: 20 });
// → ["user", "interactions", "bookmarks", { limit: 20 }]
```

## Cache Invalidation Examples

```typescript
// After creating an album
invalidateQueries.albumsLists(); // Refresh all album lists
invalidateQueries.user(); // Refresh user data

// After liking content
invalidateQueries.userInteractions(); // Refresh like/bookmark status
```

## Optimistic Updates Examples

### Album Creation

```typescript
const createMutation = useCreateAlbum();

// This will:
// 1. Immediately add album to UI
// 2. Send request to server
// 3. Update cache with server response
// 4. If error, revert and show error
await createMutation.mutateAsync(albumData);
```

### Like/Bookmark Toggle

```typescript
const toggleLike = useToggleLike();

// This will:
// 1. Immediately update like status and count
// 2. Send request to server
// 3. If error, revert changes and show error
await toggleLike.mutateAsync({
  targetType: "album",
  targetId: "123",
  isCurrentlyLiked: false,
});
```

### Media Album Operations (Add/Remove)

The `useAddMediaToAlbum` and `useRemoveMediaFromAlbum` mutations use optimistic updates to provide immediate feedback:

```typescript
const addToAlbum = useAddMediaToAlbum();
const removeFromAlbum = useRemoveMediaFromAlbum();

// Add media to album - UI updates immediately
await addToAlbum.mutateAsync({ albumId: "123", mediaId: "456" });

// Remove media from album - UI updates immediately
await removeFromAlbum.mutateAsync({ albumId: "123", mediaId: "456" });
```

**Key Optimization**: These mutations avoid unnecessary refetches by relying on optimistic updates in `onMutate`. The `onSuccess` callback only invalidates related data (user media, album counts) but not the album media list itself, preventing redundant API calls while maintaining data consistency.

## Migration Timeline

### Phase 1: Foundation (✅ Complete)

- [x] Install TanStack Query
- [x] Set up QueryProvider
- [x] Create query configuration
- [x] Implement query keys factory

### Phase 2: Core Hooks (✅ Complete)

- [x] Migrate `useAlbums` with backward compatibility
- [x] Implement user interaction hooks
- [x] Create optimistic mutations

### Phase 3: Component Migration (Next Steps)

- [ ] Update `DiscoverClient` to use new hooks
- [ ] Update `BookmarkButton` and `LikeButton` for optimistic updates
- [ ] Update album management components
- [ ] Update user profile components

### Phase 4: Advanced Features (Future)

- [ ] Implement real-time updates with WebSockets
- [ ] Add offline support with background sync
- [ ] Implement advanced caching strategies
- [ ] Add query analytics and monitoring

## Testing Strategy

The new hooks are fully compatible with the existing test suite. The `useAlbumsWithQuery` wrapper ensures that:

1. All existing tests continue to pass
2. Mock functions work the same way
3. Component behavior remains identical
4. Error handling is preserved

## Monitoring and Debugging

### Development Tools

- **React Query DevTools**: Press `Ctrl+Shift+I` and look for the TanStack Query tab
- **Network tab**: See reduced API calls due to caching
- **Console**: Query cache status and invalidations logged

### Production Monitoring

The query client can be extended with:

- Analytics for cache hit rates
- Error tracking for failed queries
- Performance metrics for data fetching

## Next Steps

1. **Test the implementation**: Run the app and check the React Query DevTools
2. **Gradual migration**: Start using the new hooks in new components
3. **Update existing components**: Replace hooks one by one, testing thoroughly
4. **Monitor performance**: Use DevTools to verify caching is working
5. **Collect feedback**: Gather developer and user feedback on the improvements

## Need Help?

- Check the TanStack Query DevTools for cache status
- Review query keys in `queryClient.ts` for debugging
- Use the `invalidateQueries` utilities for manual cache management
- Check the error boundaries for better error handling
