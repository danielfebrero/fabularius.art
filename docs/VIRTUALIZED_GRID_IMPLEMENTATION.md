# VirtualizedGrid Component

A reusable, performant virtualized grid component for rendering large lists of media or albums with infinite scrolling capabilities.

## Features

- **Virtual Scrolling**: Uses `react-virtuoso` for efficient rendering of large datasets
- **Responsive Design**: Container-based responsive grid with customizable column configurations
- **Infinite Loading**: Automatic loading trigger as users approach the end
- **Dual View Modes**: Supports both grid and list view modes
- **Type Safety**: Full TypeScript support with generic types for different item types
- **Error Handling**: Built-in error states with retry functionality
- **Loading States**: Comprehensive loading and empty state handling
- **Interaction Prefetching**: Compatible with existing interaction status prefetching patterns
- **Lightbox Integration**: Seamless media navigation support

## API Reference

### Props

```typescript
interface VirtualizedGridProps<T extends GridItem> {
  // Core data
  items: T[];
  itemType: "media" | "album";

  // Layout configuration
  className?: string;
  viewMode?: "grid" | "list";
  aspectRatio?: "square" | "auto";

  // Grid responsiveness
  gridColumns?: {
    mobile?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  defaultColumns?: number;

  // Loading states
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;

  // Content Card configuration
  contentCardProps?: {
    canLike?: boolean;
    canBookmark?: boolean;
    canFullscreen?: boolean;
    canAddToAlbum?: boolean;
    canDownload?: boolean;
    canDelete?: boolean;
    canRemoveFromAlbum?: boolean;
    showCounts?: boolean;
    showTags?: boolean;
    preferredThumbnailSize?: ThumbnailSize;
    customActions?: Array<{
      label: string;
      icon: React.ReactNode;
      onClick: () => void;
      variant?: "default" | "destructive";
    }>;
    currentAlbumId?: string;
  };

  // Media-specific
  mediaList?: Media[];

  // Custom states
  emptyState?: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    action?: React.ReactNode;
  };

  loadingState?: {
    skeletonCount?: number;
    loadingText?: string;
    noMoreText?: string;
  };

  // Error handling
  error?: string | null;
  onRetry?: () => void;
}
```

## Usage Examples

### Basic Media Grid

```tsx
import { VirtualizedGrid } from "@/components/ui/VirtualizedGrid";

function MediaPage() {
  const { data, isLoading, hasNextPage, fetchNextPage } =
    useInfiniteQuery(/*...*/);

  return (
    <VirtualizedGrid
      items={medias}
      itemType="media"
      viewMode="grid"
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      contentCardProps={{
        canLike: true,
        canBookmark: true,
        canFullscreen: true,
      }}
      mediaList={medias}
    />
  );
}
```

### Album Discovery Grid

```tsx
function DiscoverPage() {
  return (
    <VirtualizedGrid
      items={albums}
      itemType="album"
      hasNextPage={hasMore}
      onLoadMore={loadMore}
      contentCardProps={{
        canLike: true,
        canBookmark: true,
        canFullscreen: false,
      }}
      emptyState={{
        title: "No albums found",
        description: "Try adjusting your search criteria",
        action: <Button>Create Album</Button>,
      }}
    />
  );
}
```

### Custom Grid Configuration

```tsx
<VirtualizedGrid
  items={items}
  itemType="media"
  viewMode="grid"
  gridColumns={{
    mobile: 1,
    sm: 2,
    md: 3,
    lg: 5,
    xl: 6,
  }}
  aspectRatio="square"
  contentCardProps={{
    preferredThumbnailSize: "medium",
    showCounts: true,
    customActions: [
      {
        label: "Edit",
        icon: <Edit />,
        onClick: () => handleEdit(),
      },
    ],
  }}
/>
```

### List View Mode

```tsx
<VirtualizedGrid
  items={medias}
  itemType="media"
  viewMode="list"
  contentCardProps={{
    aspectRatio: "auto",
    preferredThumbnailSize: "originalSize",
    showTags: true,
  }}
/>
```

## Migration Guide

### From User Media Page

**Before:**

```tsx
// Complex virtualization logic with Virtuoso directly
const gridRows = useMemo(() => {
  if (viewMode === "list") {
    return medias.map((media, index) => ({
      items: [media],
      startIndex: index,
    }));
  }
  // ... complex row calculation
}, [medias, gridColumns, viewMode]);

const renderRow = useCallback(
  (index: number) => {
    // ... complex row rendering logic
  },
  [gridRows, gridColumns, viewMode, medias, loadMore]
);

return (
  <div ref={containerRef}>
    <Virtuoso
      useWindowScroll
      data={gridRows}
      totalCount={gridRows.length}
      itemContent={renderRow}
      endReached={loadMore}
      // ... more config
    />
  </div>
);
```

**After:**

```tsx
// Simple, declarative configuration
<VirtualizedGrid
  items={medias}
  itemType="media"
  viewMode={viewMode}
  hasNextPage={hasNextPage}
  onLoadMore={loadMore}
  contentCardProps={{
    canLike: true,
    canBookmark: true,
    canFullscreen: true,
  }}
  mediaList={medias}
/>
```

### From AlbumGrid Component

**Before:**

```tsx
// Manual intersection observer setup
const { ref, inView } = useInView({
  threshold: 0,
  rootMargin: "200px 0px",
});

useEffect(() => {
  if (inView && hasMore && !loading && loadMore) {
    loadMore();
  }
}, [inView, hasMore, loading, loadMore]);

// Manual grid rendering
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {albums.map((album) => (
    <ContentCard key={album.id} item={album} type="album" />
  ))}
</div>;
```

**After:**

```tsx
// Automatic infinite loading and responsive grid
<VirtualizedGrid
  items={albums}
  itemType="album"
  hasNextPage={hasMore}
  onLoadMore={loadMore}
  contentCardProps={{
    canLike: true,
    canBookmark: true,
  }}
/>
```

### From MediaGallery Component

**Before:**

```tsx
// Manual grid layout with custom loading states
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {allMedia.map((mediaItem, index) => (
    <ContentCard
      key={mediaItem.id}
      item={mediaItem}
      type="media"
      // ... many props
    />
  ))}
</div>;

{
  hasNextPage && <Button onClick={handleLoadMore}>Load More Media</Button>;
}
```

**After:**

```tsx
// Automatic virtualization with infinite loading
<VirtualizedGrid
  items={allMedia}
  itemType="media"
  hasNextPage={hasNextPage}
  onLoadMore={handleLoadMore}
  contentCardProps={{
    canRemoveFromAlbum: canRemoveFromAlbum,
    currentAlbumId: albumId,
  }}
  mediaList={allMedia}
/>
```

## Performance Benefits

1. **Virtual Scrolling**: Only renders visible items, dramatically improving performance with large datasets
2. **Container-based Responsiveness**: Efficient responsive calculations using container dimensions
3. **Automatic Load Triggering**: Smart prefetching as users approach the end
4. **Interaction Prefetching**: Compatible with existing bulk prefetching patterns
5. **Error Boundary Integration**: Isolated error handling for each grid item

## Responsive Behavior

The component automatically calculates grid columns based on container width:

- **Mobile (< 640px)**: 1 column by default
- **Small (640px - 768px)**: 2 columns by default
- **Medium (768px - 1024px)**: 3 columns by default
- **Large (1024px - 1280px)**: 4 columns by default
- **Extra Large (> 1280px)**: 4 columns by default

These can be customized via the `gridColumns` prop.

## Loading States

The component provides three loading states:

1. **Initial Loading**: Shows skeleton grid when `isLoading=true` and `items.length === 0`
2. **Pagination Loading**: Shows loading indicator when `isFetchingNextPage=true`
3. **End of Data**: Shows "no more items" message when `hasNextPage=false`

## Error Handling

- **Error Display**: Shows error message and retry button when `error` prop is provided
- **Retry Functionality**: Calls `onRetry` callback when retry button is clicked
- **Graceful Degradation**: Continues to show existing items even when new page fails

## Dependencies

- `react-virtuoso`: For virtual scrolling implementation
- `@/components/ui/ContentCard`: For rendering individual items
- `@/components/ErrorBoundaries`: For error isolation
- `@/types`: For type definitions

## File Structure

```
src/
├── components/
│   └── ui/
│       └── VirtualizedGrid.tsx    # Main component
├── app/
│   └── [locale]/
│       └── user/
│           ├── medias/
│           │   └── page.tsx        # Updated to use VirtualizedGrid
│           ├── likes/
│           │   └── page.tsx        # Uses VirtualizedGrid with mixed content
│           ├── bookmarks/
│           │   └── page.tsx        # Uses VirtualizedGrid with mixed content
│           └── albums/
│               └── page.tsx        # Uses VirtualizedGrid with custom actions
└── components/
    ├── AlbumGrid.tsx              # Updated to use VirtualizedGrid
    └── MediaGallery.tsx           # Updated to use VirtualizedGrid
```

## Advanced Usage

### Mixed Content Types (Likes & Bookmarks)

For pages that display both media and albums (like user likes/bookmarks), VirtualizedGrid supports dynamic type resolution:

```tsx
// Transform mixed content with type information
const allLikeItems = useMemo(() => {
  return likes
    .map((like: any) => {
      const media = createMediaFromLike(like);
      const album = createAlbumFromLike(like);
      const item = media || album;

      if (item) {
        return {
          ...item,
          _contentType: like.targetType === "media" ? "media" : "album",
        };
      }
      return null;
    })
    .filter(Boolean);
}, [likes, createMediaFromLike, createAlbumFromLike]);

// VirtualizedGrid will use _contentType to render correctly
<VirtualizedGrid
  items={allLikeItems}
  itemType="media" // Default type, overridden by _contentType
  // ... other props
/>;
```

### Custom Actions per Item

VirtualizedGrid supports dynamic custom actions that can be different for each item:

```tsx
<VirtualizedGrid
  items={albums}
  itemType="album"
  contentCardProps={{
    customActions: (item) => [
      {
        label: "Edit Album",
        icon: <Edit2 className="h-4 w-4" />,
        onClick: () => handleEditAlbum(item as Album),
        variant: "default",
      },
      {
        label: "Delete Album",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleDeleteAlbum(item as Album),
        variant: "destructive",
      },
    ],
  }}
/>
```

## Performance Optimizations

### Implemented Pages

| Page           | Status      | Features                                              |
| -------------- | ----------- | ----------------------------------------------------- |
| User Medias    | ✅ Complete | Virtual scroll, infinite loading, lightbox            |
| User Albums    | ✅ Complete | Virtual scroll, custom actions (edit/delete)          |
| User Likes     | ✅ Complete | Virtual scroll, infinite loading, mixed content types |
| User Bookmarks | ✅ Complete | Virtual scroll, infinite loading, mixed content types |
| Media Gallery  | ✅ Complete | Virtual scroll, lightbox integration                  |
| Album Grid     | ✅ Complete | Virtual scroll, infinite loading, prefetching         |

### Performance Features

- **Memoization**: All transformation functions use `useMemo` and `useCallback`
- **Virtual Rendering**: Only visible items are rendered in DOM
- **Infinite Loading**: Automatic pagination with distance-based triggering
- **Interaction Prefetching**: Bulk prefetching of interaction status
- **Container Responsive**: Efficient responsive calculations without media queries
