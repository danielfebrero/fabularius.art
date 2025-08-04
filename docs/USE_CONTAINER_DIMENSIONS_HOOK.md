# Container Dimensions Hook

## Overview

The `useContainerDimensions` hook provides efficient container dimension tracking using the ResizeObserver API. This hook is designed for responsive components that need to make intelligent decisions based on their actual rendered size.

## Usage

```tsx
import { useContainerDimensions } from "@/hooks/useContainerDimensions";

function MyComponent() {
  const { containerRef, dimensions } = useContainerDimensions();

  return (
    <div ref={containerRef}>
      Size: {dimensions.width} x {dimensions.height}
    </div>
  );
}
```

## Features

- **Efficient Tracking**: Uses ResizeObserver for performance-optimized dimension tracking
- **Responsive**: Updates dimensions automatically when container size changes
- **SSR Compatible**: Safely handles server-side rendering scenarios
- **TypeScript Support**: Fully typed with proper TypeScript definitions

## API

### Return Value

```tsx
{
  containerRef: React.RefObject<HTMLElement>;
  dimensions: {
    width: number;
    height: number;
  }
}
```

- `containerRef`: A ref that must be attached to the element you want to track
- `dimensions.width`: Current width in pixels (rounded to nearest integer)
- `dimensions.height`: Current height in pixels (rounded to nearest integer)

## Use Cases

### 1. ResponsivePicture Component

The ResponsivePicture component uses this hook to intelligently select the optimal thumbnail size based on the actual container dimensions:

```tsx
// Automatically selects best thumbnail based on container size
const { dimensions } = useContainerDimensions();
const optimalSize = selectOptimalThumbnailSize(
  dimensions.width,
  dimensions.height,
  media.thumbnails
);
```

### 2. Avatar Component

The Avatar component uses this hook to intelligently select avatar thumbnails based on container dimensions, providing optimal image quality and performance:

```tsx
export function Avatar({ user, size = "medium" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { dimensions } = useContainerDimensions();

  // Intelligent selection based on actual container size
  const getAvatarUrl = () => {
    if (
      dimensions.width > 0 &&
      dimensions.height > 0 &&
      user.avatarThumbnails
    ) {
      const optimalSize = selectOptimalAvatarSize(
        dimensions.width,
        dimensions.height,
        user.avatarThumbnails
      );
      if (optimalSize && user.avatarThumbnails[optimalSize]) {
        return user.avatarThumbnails[optimalSize];
      }
    }

    // Fallback to size-based selection
    return getFallbackAvatarUrl(size, user);
  };

  return (
    <div ref={containerRef}>
      <img src={getAvatarUrl()} alt="Avatar" />
    </div>
  );
}
```

The Avatar component's intelligent selection algorithm:

- **Device Pixel Ratio Aware**: Accounts for high-DPI displays (Retina, etc.)
- **Quality Scoring**: Prefers thumbnails that are close to but larger than needed
- **Fallback Strategy**: Falls back to size-based selection when container dimensions unavailable
- **Performance Optimized**: Avoids unnecessary re-selections when dimensions don't meaningfully change

### 2. Avatar Component (Potential Enhancement)

Could be used to dynamically select avatar thumbnail sizes:

```tsx
const { containerRef, dimensions } = useContainerDimensions();

// Select avatar size based on actual container dimensions
const avatarSize =
  dimensions.width < 40 ? "small" : dimensions.width < 60 ? "medium" : "large";
```

### 3. Dynamic Grid Layouts

Could be used for components that need to adjust their layout based on available space:

```tsx
const { containerRef, dimensions } = useContainerDimensions();

const columns = Math.floor(dimensions.width / 200); // 200px per column
```

## Performance Considerations

- **Efficient Updates**: Only triggers re-renders when dimensions actually change
- **Rounded Values**: Dimensions are rounded to integers to prevent excessive re-renders from sub-pixel changes
- **Automatic Cleanup**: ResizeObserver is properly disconnected when component unmounts
- **No Memory Leaks**: Proper cleanup prevents memory leaks in long-running applications

## Browser Support

- **Modern Browsers**: Full support in all modern browsers
- **ResizeObserver Polyfill**: Consider adding a polyfill for older browsers if needed

```bash
npm install resize-observer-polyfill
```

## Implementation Notes

### Why ResizeObserver?

1. **Performance**: More efficient than window resize listeners
2. **Precision**: Tracks the specific element, not just the window
3. **Timing**: Provides updates at the optimal time in the rendering cycle
4. **Multiple Elements**: Can efficiently track multiple elements simultaneously

### Initial Measurement

The hook performs an initial measurement using `getBoundingClientRect()` to ensure dimensions are available immediately, then relies on ResizeObserver for subsequent updates.

### Rounding Strategy

Dimensions are rounded to integers to:

- Prevent excessive re-renders from sub-pixel changes
- Provide consistent values across different browsers
- Simplify dimension-based calculations

## Examples

### Basic Usage

```tsx
import { useContainerDimensions } from "@/hooks/useContainerDimensions";

function ResponsiveComponent() {
  const { containerRef, dimensions } = useContainerDimensions();

  const isSmall = dimensions.width < 300;
  const isMedium = dimensions.width >= 300 && dimensions.width < 600;
  const isLarge = dimensions.width >= 600;

  return (
    <div ref={containerRef} className="responsive-container">
      {isSmall && <SmallLayout />}
      {isMedium && <MediumLayout />}
      {isLarge && <LargeLayout />}
    </div>
  );
}
```

### With Loading State

```tsx
function ComponentWithLoading() {
  const { containerRef, dimensions } = useContainerDimensions();

  if (dimensions.width === 0) {
    return <div ref={containerRef}>Loading...</div>;
  }

  return (
    <div ref={containerRef}>Content for {dimensions.width}px container</div>
  );
}
```

### Dynamic Grid Example

```tsx
function DynamicGrid({ items }) {
  const { containerRef, dimensions } = useContainerDimensions();

  const itemWidth = 200;
  const gap = 16;
  const columns = Math.max(
    1,
    Math.floor((dimensions.width + gap) / (itemWidth + gap))
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: gap,
      }}
    >
      {items.map((item) => (
        <GridItem key={item.id} item={item} />
      ))}
    </div>
  );
}
```

## Testing

When testing components that use this hook, mock the ResizeObserver:

```tsx
// test-utils.tsx
const mockResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.ResizeObserver = mockResizeObserver;
```

## Related Components

- **ResponsivePicture**: Uses this hook for intelligent thumbnail selection
- **Avatar**: Uses this hook for intelligent avatar thumbnail selection based on container dimensions
- **Grid Components**: Any component that needs to adapt to container size

---

This hook provides a foundational utility for building truly responsive components that adapt to their actual container dimensions rather than relying on viewport-based breakpoints alone.
