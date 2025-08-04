# TanStack Query Implementation Testing Guide

## Overview

This guide provides step-by-step instructions for testing the TanStack Query implementation in the PornSpot.ai frontend.

## What We've Implemented

### 1. Core Infrastructure

- ✅ **Query Client**: Centralized configuration with smart defaults
- ✅ **Query Provider**: Integrated into app layout with dev tools
- ✅ **Query Key Factory**: Organized key management system
- ✅ **Cache Utilities**: Invalidation and update helpers

### 2. Query Hooks

- ✅ **useAlbumsQuery**: Infinite scroll albums with mutations
- ✅ **useInteractionsQuery**: Optimistic likes/bookmarks
- ✅ **useUserQuery**: User profile management
- ✅ **useAlbumsWithQuery**: Backward-compatible wrapper

### 3. Example Components

- ✅ **TanStackQueryExample**: Demonstration component
- ✅ **Migration Documentation**: Complete implementation guide

## Testing Instructions

### Phase 1: Basic Functionality Test

1. **Start the development server**:

   ```bash
   cd frontend && npm run dev
   ```

2. **Open React Query DevTools**:

   - Press F12 to open browser dev tools
   - Look for "React Query" tab
   - This shows cache status, queries, and mutations in real-time

3. **Test the example component**:
   - Navigate to where you want to test the TanStackQueryExample component
   - Or temporarily add it to an existing page for testing

### Phase 2: Cache Behavior Testing

1. **Test Data Persistence**:

   ```javascript
   // Navigate to albums page
   // Load some albums
   // Navigate away to another page
   // Navigate back - data should appear instantly from cache
   ```

2. **Test Background Refetching**:

   ```javascript
   // Load albums
   // Wait 5+ minutes (or adjust staleTime in queryClient.ts for faster testing)
   // Navigate back to albums - should see background refetch in DevTools
   ```

3. **Test Request Deduplication**:
   ```javascript
   // Open multiple tabs with the same page
   // Should see only one network request in DevTools
   ```

### Phase 3: Optimistic Updates Testing

1. **Test Album Creation**:

   ```javascript
   // Click "Create Album" button
   // Album should appear immediately in UI
   // Check DevTools network tab - API call happens after UI update
   ```

2. **Test Like/Bookmark Mutations** (when integrated):
   ```javascript
   // Click like/bookmark buttons
   // UI should update immediately
   // If network fails, UI should revert
   ```

### Phase 4: Migration Testing

1. **Test Backward Compatibility**:

   ```javascript
   // Existing components using useAlbums should work unchanged
   // Gradually replace useAlbums with useAlbumsWithQuery
   // Verify same behavior but better performance
   ```

2. **Test Incremental Migration**:
   ```javascript
   // New components: Use direct query hooks (useAlbumsQuery)
   // Existing components: Keep using wrapper (useAlbumsWithQuery)
   // Both should work simultaneously
   ```

## Performance Verification

### 1. Network Tab Analysis

- **Before TanStack Query**: Multiple identical requests
- **After TanStack Query**: Deduplicated requests, cache hits

### 2. React Query DevTools Analysis

- **Query Status**: Fresh, Stale, Fetching, Error states
- **Cache Size**: Monitor memory usage
- **Refetch Patterns**: Background updates vs manual refetches

### 3. User Experience Metrics

- **Time to Interactive**: Faster with cached data
- **Perceived Performance**: Instant navigation with cache
- **Error Resilience**: Better error boundaries and retries

## Debugging Common Issues

### 1. TypeScript Errors

```typescript
// Ensure proper types in query hooks
// Check API method names match
// Verify import paths are correct
```

### 2. Cache Invalidation Issues

```javascript
// Use queryClient.invalidateQueries() for manual invalidation
// Check query key factory consistency
// Verify mutation success handlers
```

### 3. Infinite Query Problems

```javascript
// Check getNextPageParam function
// Verify pagination response structure
// Ensure proper page merging
```

## Development Tools

### 1. React Query DevTools

- **Location**: Browser F12 → React Query tab
- **Features**: Query inspection, cache management, performance metrics
- **Usage**: Monitor real-time query states and cache behavior

### 2. Network Tab

- **Purpose**: Verify request deduplication and caching
- **Look For**: Reduced network calls, faster response times

### 3. Console Logging

```javascript
// Enable in query hooks for debugging
console.log("Query data:", data);
console.log("Cache status:", queryStatus);
```

## Migration Checklist

### Immediate (Phase 1)

- [ ] Test TanStackQueryExample component
- [ ] Verify React Query DevTools functionality
- [ ] Confirm no TypeScript errors
- [ ] Test basic album loading and infinite scroll

### Short Term (Phase 2)

- [ ] Migrate high-traffic components to use query hooks
- [ ] Update LikeButton and BookmarkButton to use optimistic mutations
- [ ] Test interaction optimistic updates
- [ ] Verify cache invalidation works correctly

### Long Term (Phase 3)

- [ ] Replace all useAlbums usages with useAlbumsWithQuery
- [ ] Migrate user profile components to useUserQuery
- [ ] Add error boundaries for query errors
- [ ] Optimize cache configuration based on usage patterns

## Success Metrics

### Performance Improvements

- **Cache Hit Rate**: >80% for repeated requests
- **Time to Interactive**: 50%+ improvement on cached pages
- **Network Requests**: 60%+ reduction in duplicate calls

### Developer Experience

- **Error Handling**: Centralized and consistent
- **State Management**: Simplified with automatic loading/error states
- **Code Maintainability**: Reduced boilerplate, better separation of concerns

### User Experience

- **Instant Navigation**: Cached data loads immediately
- **Optimistic Updates**: UI responds instantly to user actions
- **Better Error Recovery**: Automatic retries and graceful degradation

## Troubleshooting

### If queries don't update:

1. Check query key consistency
2. Verify cache invalidation calls
3. Ensure proper mutation success handlers

### If optimistic updates don't work:

1. Check mutation optimistic update functions
2. Verify rollback logic in error handlers
3. Ensure proper query key targeting

### If infinite scroll breaks:

1. Check getNextPageParam function
2. Verify pagination response structure
3. Ensure pages array merging is correct

## Next Steps

1. **Test the example component** thoroughly
2. **Monitor performance** with DevTools
3. **Gradually migrate** existing components
4. **Gather feedback** from team members
5. **Optimize configuration** based on real usage

The TanStack Query implementation is now ready for testing and gradual rollout!
