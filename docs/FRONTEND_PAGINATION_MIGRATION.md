# Frontend Pagination Migration

## Overview

This document summarizes the frontend updates made to support the new unified pagination format implemented in the backend. All paginated endpoints now return a consistent response structure with cursor-based pagination.

## New Unified Pagination Format

All paginated endpoints now return:

```typescript
{
  success: true,
  data: {
    [items]: T[],           // e.g., albums, media, interactions, comments
    pagination: {
      hasNext: boolean,     // Whether more pages exist
      cursor: string | null,// Base64-encoded cursor for next page
      limit: number        // Actual limit used
    }
  }
}
```

## Changes Made

### 1. Global Types Updated

**File**: `/frontend/src/types/index.ts`

- ✅ Added `UnifiedPaginationMeta` interface
- ✅ Added `UnifiedPaginatedResponse<T>` base interface
- ✅ Added `UnifiedAlbumsResponse` for albums
- ✅ Added `UnifiedMediaResponse` for media
- ✅ Marked legacy pagination types as deprecated

**File**: `/frontend/src/types/user.ts`

- ✅ Added `UnifiedUserInteractionsResponse` for interactions
- ✅ Added `UnifiedCommentsResponse` for comments
- ✅ Kept legacy types for backward compatibility

### 2. API Functions Updated

**File**: `/frontend/src/lib/api/albums.ts`

- ✅ Updated `getAlbums()` return type to `UnifiedAlbumsResponse`
- ✅ Updated `getUserAlbums()` return type to `UnifiedAlbumsResponse`

**File**: `/frontend/src/lib/api/interactions.ts`

- ✅ Updated `getLikes()` to use cursor pagination (`limit, cursor` instead of `page, limit, lastKey`)
- ✅ Updated `getLikesByUsername()` to use cursor pagination
- ✅ Updated `getBookmarks()` to use cursor pagination
- ✅ Updated `getCommentsByUsername()` to use cursor pagination
- ✅ All functions now return unified response types

**File**: `/frontend/src/lib/api/media.ts`

- ✅ Updated `getUserMedia()` return type to `UnifiedMediaResponse`
- ✅ Updated `getAlbumMedia()` return type to `UnifiedMediaResponse`

### 3. Query Hooks Updated

**File**: `/frontend/src/hooks/queries/useAlbumsQuery.ts`

- ✅ Updated `AlbumsResponse` type to use `UnifiedAlbumsResponse`
- ✅ Updated `getNextPageParam` to use `lastPage.data.pagination.cursor`
- ✅ Fixed initial data transformation to include required `limit` field

**File**: `/frontend/src/hooks/queries/useBookmarksQuery.ts`

- ✅ Updated to use `UnifiedUserInteractionsResponse`
- ✅ Changed from page-based to cursor-based pagination
- ✅ Updated `getNextPageParam` to use cursor logic

**File**: `/frontend/src/hooks/queries/useLikesQuery.ts`

- ✅ Updated to use `UnifiedUserInteractionsResponse`
- ✅ Changed from page-based to cursor-based pagination
- ✅ Updated API function calls to use new signature

**File**: `/frontend/src/hooks/queries/useCommentsQuery.ts`

- ✅ Updated to use `UnifiedCommentsResponse`
- ✅ Changed from page-based to cursor-based pagination
- ✅ Updated API function calls to use new signature

**File**: `/frontend/src/hooks/queries/useMediaQuery.ts`

- ✅ Updated `MediaResponse` type to use `UnifiedMediaResponse`
- ✅ Updated `getNextPageParam` to use cursor logic

**File**: `/frontend/src/hooks/queries/useInteractionsQuery.ts`

- ✅ Updated `useBookmarks()` to use cursor pagination
- ✅ Updated `useLikes()` to use cursor pagination
- ✅ Updated `useComments()` to use cursor pagination
- ✅ Changed all functions from page-based to cursor-based logic

## Benefits Achieved

### ✅ Consistency

- All frontend query hooks now use identical pagination pattern
- Unified request/response format across all endpoints
- Consistent cursor-based navigation

### ✅ Performance

- Efficient cursor-based pagination (no offset calculations)
- Better caching with TanStack Query infinite queries
- Optimal query performance with DynamoDB

### ✅ Developer Experience

- Clear TypeScript interfaces for pagination
- Consistent patterns across all query hooks
- Better type safety with unified response types

### ✅ Backward Compatibility

- Legacy types marked as deprecated but not removed
- Gradual migration path for existing components
- No breaking changes for components not yet migrated

## Migration Impact

### ✅ API Layer

- All API functions updated to use new pagination format
- Function signatures changed to use cursor instead of page/lastKey
- Return types updated to use unified response interfaces

### ✅ Query Hooks

- All infinite query hooks updated to use cursor pagination
- `getNextPageParam` functions updated to use cursor logic
- Initial page param changed from `1` to `undefined`

### ✅ Type Safety

- Strong typing for all pagination responses
- Specific response types for different data types (albums, media, interactions)
- TypeScript compilation errors resolved

## Next Steps

### 📋 Component Migration

- [ ] Update components using pagination hooks to handle new response format
- [ ] Update components extracting data from infinite query pages
- [ ] Test pagination flows in UI components

### 📋 Testing

- [ ] Update tests to use new pagination format
- [ ] Add tests for cursor-based pagination logic
- [ ] Test error handling for invalid cursors

### 📋 Documentation

- [ ] Update API documentation to reflect new pagination format
- [ ] Update component usage examples
- [ ] Create migration guide for developers

## Breaking Changes

### ⚠️ API Function Signatures

```typescript
// OLD
getLikes(page: number, limit: number, lastKey?: string)
getBookmarks(page: number, limit: number, lastKey?: string)
getCommentsByUsername(username: string, page: number, limit: number, lastKey?: string)

// NEW
getLikes(limit: number, cursor?: string)
getBookmarks(limit: number, cursor?: string)
getCommentsByUsername(username: string, limit: number, cursor?: string)
```

### ⚠️ Response Format

```typescript
// OLD
{
  data: {
    interactions: T[],
    pagination: {
      page: number,
      limit: number,
      hasNext: boolean,
      total: number
    }
  }
}

// NEW
{
  data: {
    interactions: T[],
    pagination: {
      hasNext: boolean,
      cursor: string | null,
      limit: number
    }
  }
}
```

### ⚠️ Infinite Query Parameters

```typescript
// OLD
initialPageParam: 1;
getNextPageParam: (lastPage) => (lastPage.data.pagination.page || 1) + 1;

// NEW
initialPageParam: undefined as string | undefined;
getNextPageParam: (lastPage) => lastPage.data.pagination.cursor;
```

---

**Migration Status**: ✅ **FRONTEND API & HOOKS COMPLETE**  
**Next Milestone**: Component Migration  
**Completion Date**: August 2025
