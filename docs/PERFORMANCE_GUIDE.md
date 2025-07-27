# Performance Guide

This document provides a detailed overview of the performance optimization strategies implemented in the PornSpot.ai application.

## API Call Optimization

### Lazy Loading of Albums in Add to Album Dialog

- **Issue**: Previously, the `AddToAlbumDialog` component was using the `useAlbums()` hook, which would fetch albums data immediately when the component was mounted. Since multiple ContentCard components render on album detail pages (one per media item), this caused the `/albums` API to be called multiple times simultaneously (50+ times), creating unnecessary server load.

- **Solution**: Refactored the `AddToAlbumDialog` to use local state management and only fetch albums when the dialog is actually opened. This ensures:

  - Albums are fetched only when needed (dialog opens)
  - Each dialog instance doesn't create its own hook
  - API calls are eliminated for unused dialog instances
  - Performance is significantly improved on pages with many media items

- **Implementation**: The component now manages its own `albums` state and uses `useEffect` to trigger `fetchAlbums()` only when `isOpen` becomes `true` and no albums are cached.

### API Call Centralization

- **Issue**: Previously, many components and hooks were making direct `fetch()` calls, leading to inconsistent error handling, duplicate code, and maintenance challenges.

- **Solution**: Centralized all API calls into `/frontend/src/lib/api.ts` with dedicated objects for different domains:

  - `albumsApi` - Regular user album operations
  - `adminAlbumsApi` - Admin album management
  - `userApi` - User profile and interaction operations
  - `mediaApi` - Media upload and management operations

- **Benefits**:

  - Consistent error handling across the application
  - Centralized request/response formatting
  - Easier testing and debugging
  - Better type safety and IntelliSense
  - Reduces code duplication and maintenance burden

- **Implementation**: Updated `AddToAlbumDialog` and `useAdminAlbums` hook to use centralized API methods. Additional hooks should be migrated to this pattern over time.

## Image Optimization

Image optimization is a critical aspect of the application's performance. Instead of relying on Next.js's built-in image optimization, the application uses a powerful custom thumbnail generation system.

### 5-Size Thumbnail System

- **Description**: The system generates five different sizes of thumbnails for each uploaded image. This allows the frontend to select the most appropriate image size based on the user's screen size and the context in which the image is displayed.
- **Benefits**:
  - Reduces the file size of images, leading to faster page loads.
  - Improves the user experience by displaying crisp, clear images on all devices.
  - Reduces bandwidth usage and costs.
- **Implementation**: The thumbnail generation is handled by a Lambda function that is triggered when a new image is uploaded to S3. The Sharp library is used for image processing.
- **Further Reading**: For more details, see the [Thumbnail System Documentation](THUMBNAIL_SYSTEM.md).

### Intelligent Responsive Image Selection

- **Description**: The frontend uses a custom logic to intelligently select the optimal thumbnail size based on the screen size, context (e.g., discover, album grid), and layout.
- **Implementation**: A `getThumbnailUrl` utility function is used in components to select the best thumbnail URL.

## Caching

### CDN Caching

- **Description**: All media files, including the original images and thumbnails, are served through a Content Delivery Network (CDN) (AWS CloudFront). The CDN caches the files at edge locations around the world, which reduces latency and improves load times for users.
- **Cache-Control Headers**: The `Cache-Control` header is set to a long duration (e.g., one year) for the thumbnails, as they are immutable.

### Frontend Caching

- The application uses the standard browser cache for client-side caching of assets.
- React Query or a similar library could be implemented in the future for more advanced client-side data caching.

## Code Optimization

### Code-Splitting

- **Description**: Next.js automatically performs code-splitting, which means that each page only loads the JavaScript it needs to render. This reduces the initial bundle size and improves the Time to Interactive (TTI).

### Lazy Loading

- **Description**: Images in the application are lazy-loaded, which means they are only loaded when they are about to enter the viewport. This improves the initial page load performance, especially on pages with many images.
- **Implementation**: The `loading="lazy"` attribute is used on `<img>` tags.

### Webpack Configuration

- The `next.config.js` file includes a Webpack configuration that optimizes the build process.
- The `optimizePackageImports` experimental feature is used to optimize the import of the `lucide-react` library.

## Next.js Performance Features

The application leverages several built-in Next.js performance features:

- **Automatic Static Optimization**: Next.js automatically determines if a page can be pre-rendered to static HTML, which is incredibly fast.
- **Server-Side Rendering (SSR)**: For dynamic pages, Next.js uses SSR to pre-render the page on the server, which improves the initial load time and SEO.
- **Prefetching**: The `<Link>` component in Next.js automatically prefetches the assets for linked pages in the background, making navigation between pages feel instant.
