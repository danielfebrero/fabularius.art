# Interaction Buttons Cache Optimization

## 📋 Overview

This document summarizes the cache optimization improvements made to `LikeButton` and `BookmarkButton` components to prevent unnecessary API calls and improve performance.

## 🎯 Problem

Previously, both `LikeButton` and `BookmarkButton` components were calling `useInteractionStatus(targets)` with `enabled: true`, which meant:

- Every button rendered would trigger an API call to fetch interaction status
- Multiple buttons on the same page would create duplicate requests
- No leveraging of the existing TanStack Query cache system
- Poor performance on pages with many interactive elements

## ✅ Solution

### 1. **Enhanced `useInteractionStatus` Hook**

Added optional `enabled` parameter to control when the hook fetches data:

```typescript
export function useInteractionStatus(
  targets: InteractionTarget[],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  // ... existing logic
  return useQuery<InteractionStatusResponse>({
    queryKey: queryKeys.user.interactions.status(targets),
    queryFn: async () => {
      /* ... */
    },
    enabled: enabled && targets.length > 0, // ✅ Now controllable
    // ... other options
  });
}
```

### 2. **New Cache-Only Hook**

Created `useInteractionStatusFromCache` that only reads from cache:

```typescript
// Hook for reading interaction status from cache only (for buttons)
export function useInteractionStatusFromCache(targets: InteractionTarget[]) {
  return useInteractionStatus(targets, { enabled: false });
}
```

### 3. **Updated Button Components**

Both `LikeButton` and `BookmarkButton` now use the cache-only version:

```typescript
// ❌ Before: Always fetched from API
const { data: interactionData, isLoading } = useInteractionStatus(targets);

// ✅ After: Only reads from cache
const { data: interactionData, isLoading } =
  useInteractionStatusFromCache(targets);
```

## 🚀 Benefits

### **Performance Improvements**

- **Zero API calls** from button components themselves
- **Instant button state** when data is cached
- **Reduced server load** by eliminating duplicate requests
- **Faster page rendering** with cached interaction status

### **Better Caching Strategy**

- Buttons **rely on cache** populated by:
  - Page-level prefetching (e.g., album lists)
  - Previous user interactions
  - Background refetching by TanStack Query
- **Optimistic updates** from mutations still work perfectly
- **Cache invalidation** ensures data consistency

### **Improved User Experience**

- **Faster button responses** with cached data
- **No loading states** when data is already available
- **Consistent behavior** across all interaction components
- **Reduced network usage** for mobile users

## 🔧 How It Works

### **Data Flow**

```
1. Page Load → Prefetch interaction status → Cache populated
2. Buttons render → Read from cache only → Instant display
3. User clicks → Optimistic update → API call → Cache updated
4. Other buttons → Read updated cache → Instant state change
```

### **Cache Population Sources**

- **Album lists**: Prefetch interaction status for all visible albums
- **Media galleries**: Bulk load status for media items
- **Previous interactions**: Cache persists across page navigation
- **Mutation responses**: Updates cache with latest server state

### **Fallback Behavior**

- If no cache data exists, buttons show default state (not liked/bookmarked)
- User can still interact, which will populate cache through mutations
- Background refetching ensures eventual consistency

## 📊 Impact

### **Before Optimization**

- 🔴 Every button = 1 API call
- 🔴 Album page with 20 items = 20 API calls
- 🔴 Duplicate requests for same targets
- 🔴 Loading states on every button

### **After Optimization**

- 🟢 Buttons = 0 API calls (cache-only)
- 🟢 Album page with 20 items = 1 bulk prefetch call
- 🟢 No duplicate requests
- 🟢 Instant button states when cached

## 🛠️ Implementation Details

### **Files Modified**

- `useInteractionsQuery.ts`: Added `enabled` option and cache-only hook
- `LikeButton.tsx`: Updated to use `useInteractionStatusFromCache`
- `BookmarkButton.tsx`: Updated to use `useInteractionStatusFromCache`

### **Backward Compatibility**

- Regular `useInteractionStatus` still works for components that need fresh data
- Existing prefetching and caching strategies remain unchanged
- All optimistic updates and mutations continue to work

## 🎉 Result

**Smart interaction buttons that leverage caching for optimal performance while maintaining full functionality and user experience.**

The buttons now:

- ⚡ Load instantly when data is cached
- 🔄 Update optimistically on user interaction
- 🌐 Respect the global caching strategy
- 📱 Reduce network usage and battery drain
- 🚀 Provide a snappier user experience

This optimization demonstrates how TanStack Query's caching capabilities can be leveraged to build performant, user-friendly interfaces that minimize unnecessary network requests while maintaining data consistency.
