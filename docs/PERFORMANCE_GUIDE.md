# Performance Guide

This document provides a detailed overview of the performance optimization strategies implemented in the PornSpot.ai application.

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

- **Description**: The frontend uses a custom logic to intelligently select the optimal thumbnail size based on the screen size, context (e.g., homepage, album grid), and layout.
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
