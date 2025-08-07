# Lightbox Infinite Navigation Implementation

## Overview

The Lightbox component now supports infinite navigation, allowing users to seamlessly browse through content without reaching hard limits. When users approach the end of the currently loaded content, the system automatically fetches more items, providing a continuous browsing experience.

## Features

### ✅ Implemented Features

1. **Automatic Content Loading**

   - Triggers loading when user is 3 items from the end
   - Non-blocking background loading
   - Seamless navigation continues after loading completes

2. **Visual Feedback**

   - Loading indicator in media counter
   - Dynamic counter showing "X of Y+" when more content is available
   - Disabled state for navigation when no more content exists

3. **Enhanced Navigation**

   - Keyboard arrow keys support infinite navigation
   - Swipe gestures support infinite navigation
   - Navigation buttons support infinite navigation

4. **Smart Preloading**
   - Continues to preload images around current position
   - Maintains optimal performance during infinite navigation

## Technical Implementation

### Enhanced Lightbox Interface

```typescript
interface LightboxProps {
  media: Media[];
  currentIndex: number;
  isOpen: boolean;

  // Infinite navigation support
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;

  // Standard props
  canDelete?: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}
```

### Key Components Updated

1. **Lightbox.tsx** - Core infinite navigation logic
2. **MediaGallery.tsx** - Album media browsing
3. **UserMediasPage.tsx** - User's media collection
4. **UserBookmarksPage.tsx** - User's bookmarked content

### Implementation Pattern

```typescript
// In parent component
const handleLoadMore = async () => {
  if (hasNextPage && !isFetchingNextPage) {
    try {
      await fetchNextPage();
    } catch (error) {
      console.error("Failed to load more:", error);
    }
  }
};

// Lightbox usage
<Lightbox
  media={allMedia}
  currentIndex={currentMediaIndex}
  isOpen={lightboxOpen}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
  onLoadMore={handleLoadMore}
  onClose={handleClose}
  onNext={handleNext}
  onPrevious={handlePrevious}
/>;
```

## User Experience

### Navigation Behavior

1. **Forward Navigation**: Users can continue navigating even when approaching the end of loaded content
2. **Automatic Loading**: Content loads automatically when user is 3 items from the end
3. **Loading States**: Visual indicators show when content is being fetched
4. **Seamless Transition**: No interruption in navigation flow

### Visual Indicators

- **Media Counter**: Shows "5 of 20+" when more content is available
- **Loading Spinner**: Appears in counter during fetch operations
- **Button States**: Navigation buttons remain enabled when more content exists

## Performance Considerations

### Optimizations

1. **Smart Triggering**: Only loads when user is actually navigating near the end
2. **Debounced Loading**: Prevents multiple simultaneous load requests
3. **Memory Management**: Maintains reasonable item limits per page
4. **Preloading**: Continues optimized image preloading during infinite navigation

### Monitoring

- Loading operations are logged for debugging
- Error handling for failed load operations
- Graceful degradation when no more content exists

## Troubleshooting

### Common Issues

1. **Navigation stops at last item**: Ensure parent navigation functions use `|| hasNextPage` logic:
   ```typescript
   const handleNext = () => {
     // ✅ Correct - matches Lightbox internal logic
     if (currentIndex < items.length - 1 || hasNextPage) {
       setCurrentIndex(currentIndex + 1);
     }
   };
   
   // ❌ Incorrect - blocks navigation when more content available
   const handleNext = () => {
     if (currentIndex < items.length - 1) {
       setCurrentIndex(currentIndex + 1);
     }
   };
   ```

2. **Lightbox doesn't render**: If `currentIndex` exceeds array bounds temporarily, this is expected. The loading should complete quickly and make the content available.

3. **Loading not triggered**: Verify that:
   - `hasNextPage` is correctly passed and true
   - `onLoadMore` function is provided and working
   - Loading trigger distance (3 items from end) is sufficient for your use case

### Debugging

Add logging to verify infinite navigation flow:

```typescript
const handleNext = () => {
  console.log('Navigation state:', {
    currentIndex,
    arrayLength: items.length,
    hasNextPage,
    isFetchingNextPage
  });
  
  if (currentIndex < items.length - 1 || hasNextPage) {
    setCurrentIndex(currentIndex + 1);
  }
};
```

## Components Using Infinite Navigation

### Fully Implemented

- ✅ **MediaGallery** - Album content browsing
- ✅ **UserMediasPage** - User's media collection
- ✅ **UserBookmarksPage** - User's bookmarked content
- ✅ **UserLikesPage** - User's liked content collection

### Standard Implementation (Static Lists)

- **GenerateClient** - Generated images (local array)
- **MediaDetailClient** - Single media view
- **ContentCard** - Individual media items

## Future Enhancements

### Potential Improvements

1. **Bidirectional Loading**: Load content when navigating backwards to beginning
2. **Cache Optimization**: Implement LRU cache for previously loaded pages
3. **Prefetch Strategies**: More aggressive preloading based on user behavior
4. **Analytics**: Track navigation patterns to optimize loading triggers

### API Considerations

The infinite navigation relies on TanStack Query's `useInfiniteQuery` pattern:

```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: ["media", filters],
    queryFn: ({ pageParam }) => fetchMediaPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
```

## Testing Recommendations

### Manual Testing

1. Navigate to end of media list in Lightbox
2. Verify automatic loading triggers
3. Confirm navigation continues seamlessly
4. Test with slow network connections

### Edge Cases

- No more content available
- Network failures during loading
- Very large datasets
- Rapid navigation near boundaries

## Migration Notes

### Breaking Changes

- None - implementation is backward compatible
- Components without infinite scroll props continue to work normally

### Optional Updates

Components can be enhanced by adding the new props:

- `hasNextPage`
- `isFetchingNextPage`
- `onLoadMore`

## Related Documentation

- [TanStack Query Implementation](./TANSTACK_QUERY_IMPLEMENTATION.md)
- [Virtualized Grid Implementation](./VIRTUALIZED_GRID_IMPLEMENTATION.md)
- [Performance Guide](./PERFORMANCE_GUIDE.md)
