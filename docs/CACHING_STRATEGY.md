# Caching Strategy

This document provides a detailed overview of the caching strategies implemented in the PornSpot.ai application.

## CDN Caching

The primary caching mechanism for the application is the Content Delivery Network (CDN), which is AWS CloudFront. The CDN is used to cache static assets, including images, thumbnails, and frontend JavaScript bundles.

### Image and Thumbnail Caching

- **Description**: All media files, including the original images and the generated thumbnails, are served through the CDN.
- **Cache-Control Headers**: The `Cache-Control` header is set to a long duration (e.g., one year) for the thumbnails, as they are immutable. This ensures that the user's browser and the CDN edge locations cache the images for a long time, which reduces the number of requests to the S3 origin.
- **Cache Invalidation**: When an image is updated or deleted, the CDN cache can be invalidated for that specific object. However, given the immutable nature of the thumbnails, invalidation is rarely needed.

### Frontend Asset Caching

- **Description**: The Next.js build output, which includes the JavaScript bundles, CSS files, and other static assets, is deployed to Vercel, which has its own CDN.
- **Cache-Control Headers**: Vercel automatically sets appropriate `Cache-Control` headers for the frontend assets, ensuring they are cached efficiently.

## Frontend Caching

### Browser Caching

- **Description**: The application leverages the standard browser cache for client-side caching of assets.
- **Implementation**: The `Cache-Control` headers set by the CDN and the frontend server instruct the browser on how long to cache the assets.

### Data Caching

- **Description**: The application uses custom React hooks (`useAlbums`, `useUser`, etc.) to fetch data from the API. Currently, these hooks do not implement any advanced data caching strategy beyond what the browser provides for the API requests.
- **Future Enhancements**: A library like **React Query** or **SWR** could be implemented in the future to provide more advanced data caching features, such as:
  - Stale-while-revalidate
  - Automatic refetching
  - Query cancellation
  - Local cache updates after mutations

## API Caching

Currently, the backend API does not implement any specific caching strategy. All requests are handled directly by the Lambda functions, which fetch the data from DynamoDB.

### Future Enhancements

- **API Gateway Caching**: AWS API Gateway provides a feature to cache responses from the backend. This could be enabled for endpoints that serve data that doesn't change frequently.
- **ElastiCache**: For more advanced caching needs, an in-memory data store like Redis or Memcached (available as AWS ElastiCache) could be used to cache frequently accessed data.

## Summary

The current caching strategy is heavily focused on the CDN for serving static assets, which is the most effective way to improve the performance of a media-heavy application. The frontend leverages browser caching, and there are opportunities to implement more advanced data caching strategies in the future.
