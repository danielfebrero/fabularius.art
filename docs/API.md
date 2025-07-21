# API Documentation

This document provides comprehensive API documentation for the PornSpot.ai gallery application, with detailed information about the new 5-size thumbnail system and intelligent responsive image selection.

## Overview

The API follows REST principles and returns JSON responses. All endpoints support the new 5-size thumbnail system while maintaining backward compatibility with legacy clients.

### Base URLs

- **Production**: `https://api.pornspot.ai`
- **Staging**: `https://staging-api.pornspot.ai`
- **Development**: `https://dev-api.pornspot.ai`

### Authentication

Currently uses AWS IAM authentication. Future versions may support API keys or OAuth.

```bash
# Example with AWS CLI credentials
curl -H "Authorization: AWS4-HMAC-SHA256 ..." \
     https://api.pornspot.ai/albums
```

## Data Models

### Media Entity

```typescript
interface Media {
  id: string; // Unique media identifier
  albumId: string; // Parent album ID
  filename: string; // Stored filename
  originalName?: string; // Original upload filename (legacy)
  originalFilename?: string; // Original upload filename
  mimeType: string; // MIME type (image/jpeg, image/png, etc.)
  size: number; // File size in bytes
  width?: number; // Image width in pixels
  height?: number; // Image height in pixels
  url: string; // Original file URL

  // Legacy thumbnail support (backward compatibility)
  thumbnailUrl?: string; // Points to 'small' size for compatibility

  // New 5-size thumbnail system
  thumbnailUrls?: {
    cover?: string; // 128×128px (75% quality) - Album covers
    small?: string; // 240×240px (80% quality) - Dense grids
    medium?: string; // 300×300px (85% quality) - General purpose
    large?: string; // 365×365px (85% quality) - High quality
    xlarge?: string; // 600×600px (90% quality) - Small screens
  };

  status?: "pending" | "uploaded" | "failed"; // Processing status
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  metadata?: Record<string, any>; // Additional metadata
}
```

### Album Entity

```typescript
interface Album {
  id: string; // Unique album identifier
  title: string; // Album title
  tags?: string[]; // Optional tags
  coverImageUrl?: string; // Cover image URL (from media)
  isPublic: boolean; // Public visibility
  mediaCount: number; // Number of media items
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  media?: Media[]; // Populated media (when requested)
}
```

---

## Albums Endpoint (`/albums`)

Retrieves a paginated list of albums. Supports server-side filtering by public/private status, DynamoDB-native pagination, and returns a new, simplified response shape.

### Request

- **GET** `/albums`
- **Query Parameters**:
  - `isPublic` (optional, boolean): Filter albums by public visibility.
  - `limit` (optional, integer): Maximum number of results to return per page (default: 20, max: 100).
  - `nextCursor` (optional, string): Opaque cursor from the previous response for DynamoDB pagination.

#### Example

```
GET /albums?isPublic=true&limit=20
```

### Response

```json
{
  "albums": [
    {
      "id": "abc123",
      "title": "Example Album",
      "tags": ["summer", "beach"],
      "coverImageUrl": "...",
      "isPublic": true,
      "mediaCount": 15,
      "createdAt": "2025-06-01T12:05:47.400Z",
      "updatedAt": "2025-06-01T12:05:47.400Z"
      // ...additional album fields
    }
  ],
  "pagination": {
    "nextCursor": "eyJpYXQiOjE2...",
    "hasNextPage": true
  }
}
```

- **albums**: List of album objects (see schema above).
- **pagination.nextCursor**: Pass this token to retrieve the next page. Omit or set to null to fetch the first page.
- **pagination.hasNextPage**: Boolean indicating if additional pages are available.

**Notes:**

- Filtering by `isPublic` is implemented entirely server-side for efficiency.
- Pagination is native to DynamoDB (no traditional offset/limit; always use `nextCursor`).
- The response shape is always `{ albums, pagination }`.

---

### API Response Wrapper

```typescript
interface ApiResponse<T = any> {
  success: boolean; // Operation success status
  data?: T; // Response data
  error?: string; // Error message (if success: false)
  message?: string; // Additional information
}

interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number; // Current page (1-based)
    limit: number; // Items per page
    total: number; // Total items
    hasNext: boolean; // Has next page
    hasPrev: boolean; // Has previous page
  };
}
```

## Albums API

### List Albums

Get all albums with optional filtering and pagination.

```http
GET /albums?page=1&limit=20&public=true
```

**Query Parameters:**

| Parameter | Type    | Default | Description                 |
| --------- | ------- | ------- | --------------------------- |
| `page`    | number  | 1       | Page number (1-based)       |
| `limit`   | number  | 20      | Items per page (max 100)    |
| `public`  | boolean | -       | Filter by public visibility |
| `tags`    | string  | -       | Comma-separated tags filter |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "album-123",
      "title": "Nature Photography",
      "tags": ["nature", "landscape"],
      "coverImageUrl": "https://cdn.example.com/covers/album-123.jpg",
      "isPublic": true,
      "mediaCount": 25,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T15:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Album

Get a specific album by ID with optional media inclusion.

```http
GET /albums/{albumId}?includeMedia=true
```

**Path Parameters:**

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `albumId` | string | Yes      | Album identifier |

**Query Parameters:**

| Parameter      | Type    | Default | Description                     |
| -------------- | ------- | ------- | ------------------------------- |
| `includeMedia` | boolean | false   | Include media items in response |
| `mediaLimit`   | number  | 50      | Max media items to include      |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "album-123",
    "title": "Nature Photography",
    "tags": ["nature", "landscape"],
    "coverImageUrl": "https://cdn.example.com/covers/album-123.jpg",
    "isPublic": true,
    "mediaCount": 25,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T15:45:00.000Z",
    "media": [
      {
        "id": "media-456",
        "albumId": "album-123",
        "filename": "sunset-mountain.jpg",
        "originalFilename": "IMG_2024_sunset.jpg",
        "mimeType": "image/jpeg",
        "size": 2847392,
        "width": 3840,
        "height": 2160,
        "url": "https://cdn.example.com/albums/album-123/media/sunset-mountain.jpg",

        // Legacy compatibility
        "thumbnailUrl": "https://cdn.example.com/albums/album-123/thumbnails/sunset-mountain_thumb_small.jpg",

        // New 5-size system
        "thumbnailUrls": {
          "cover": "https://cdn.example.com/albums/album-123/thumbnails/sunset-mountain_thumb_cover.jpg",
          "small": "https://cdn.example.com/albums/album-123/thumbnails/sunset-mountain_thumb_small.jpg",
          "medium": "https://cdn.example.com/albums/album-123/thumbnails/sunset-mountain_thumb_medium.jpg",
          "large": "https://cdn.example.com/albums/album-123/thumbnails/sunset-mountain_thumb_large.jpg",
          "xlarge": "https://cdn.example.com/albums/album-123/thumbnails/sunset-mountain_thumb_xlarge.jpg"
        },

        "status": "uploaded",
        "createdAt": "2024-01-15T11:00:00.000Z",
        "updatedAt": "2024-01-15T11:05:00.000Z"
      }
    ]
  }
}
```

### Create Album

Create a new album.

```http
POST /albums
Content-Type: application/json

{
  "title": "My New Album",
  "tags": ["vacation", "summer"],
  "isPublic": true
}
```

**Request Body:**

| Field      | Type     | Required | Description                        |
| ---------- | -------- | -------- | ---------------------------------- |
| `title`    | string   | Yes      | Album title                        |
| `tags`     | string[] | No       | Optional tags                      |
| `isPublic` | boolean  | No       | Public visibility (default: false) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "album-789",
    "title": "My New Album",
    "tags": ["vacation", "summer"],
    "coverImageUrl": null,
    "isPublic": true,
    "mediaCount": 0,
    "createdAt": "2024-01-15T16:00:00.000Z",
    "updatedAt": "2024-01-15T16:00:00.000Z"
  }
}
```

## Media API

### List Media

Get media items for a specific album.

```http
GET /albums/{albumId}/media?page=1&limit=50
```

**Path Parameters:**

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `albumId` | string | Yes      | Album identifier |

**Query Parameters:**

| Parameter  | Type   | Default | Description              |
| ---------- | ------ | ------- | ------------------------ |
| `page`     | number | 1       | Page number (1-based)    |
| `limit`    | number | 50      | Items per page (max 100) |
| `mimeType` | string | -       | Filter by MIME type      |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "media-456",
      "albumId": "album-123",
      "filename": "beach-sunset.jpg",
      "originalFilename": "vacation_beach_2024.jpg",
      "mimeType": "image/jpeg",
      "size": 1923840,
      "width": 2560,
      "height": 1440,
      "url": "https://cdn.example.com/albums/album-123/media/beach-sunset.jpg",

      // Legacy thumbnail (points to small size)
      "thumbnailUrl": "https://cdn.example.com/albums/album-123/thumbnails/beach-sunset_thumb_small.jpg",

      // Complete 5-size thumbnail set
      "thumbnailUrls": {
        "cover": "https://cdn.example.com/albums/album-123/thumbnails/beach-sunset_thumb_cover.jpg",
        "small": "https://cdn.example.com/albums/album-123/thumbnails/beach-sunset_thumb_small.jpg",
        "medium": "https://cdn.example.com/albums/album-123/thumbnails/beach-sunset_thumb_medium.jpg",
        "large": "https://cdn.example.com/albums/album-123/thumbnails/beach-sunset_thumb_large.jpg",
        "xlarge": "https://cdn.example.com/albums/album-123/thumbnails/beach-sunset_thumb_xlarge.jpg"
      },

      "status": "uploaded",
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:03:00.000Z",
      "metadata": {
        "camera": "Canon EOS R5",
        "lens": "RF 24-70mm F2.8L IS USM",
        "settings": "1/250s f/8.0 ISO 100"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Get Media Item

Get a specific media item by ID.

```http
GET /media/{mediaId}
```

**Path Parameters:**

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `mediaId` | string | Yes      | Media identifier |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "media-456",
    "albumId": "album-123",
    "filename": "portrait-session.jpg",
    "originalFilename": "portrait_final_edit.jpg",
    "mimeType": "image/jpeg",
    "size": 3547392,
    "width": 4000,
    "height": 6000,
    "url": "https://cdn.example.com/albums/album-123/media/portrait-session.jpg",

    // Backward compatibility
    "thumbnailUrl": "https://cdn.example.com/albums/album-123/thumbnails/portrait-session_thumb_small.jpg",

    // Full thumbnail set with all 5 sizes
    "thumbnailUrls": {
      "cover": "https://cdn.example.com/albums/album-123/thumbnails/portrait-session_thumb_cover.jpg",
      "small": "https://cdn.example.com/albums/album-123/thumbnails/portrait-session_thumb_small.jpg",
      "medium": "https://cdn.example.com/albums/album-123/thumbnails/portrait-session_thumb_medium.jpg",
      "large": "https://cdn.example.com/albums/album-123/thumbnails/portrait-session_thumb_large.jpg",
      "xlarge": "https://cdn.example.com/albums/album-123/thumbnails/portrait-session_thumb_xlarge.jpg"
    },

    "status": "uploaded",
    "createdAt": "2024-01-15T14:00:00.000Z",
    "updatedAt": "2024-01-15T14:05:00.000Z"
  }
}
```

### Upload Media

Upload a new media file to an album.

```http
POST /albums/{albumId}/media/upload
Content-Type: application/json

{
  "filename": "new-photo.jpg",
  "mimeType": "image/jpeg",
  "size": 2048000
}
```

**Path Parameters:**

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `albumId` | string | Yes      | Album identifier |

**Request Body:**

| Field      | Type   | Required | Description        |
| ---------- | ------ | -------- | ------------------ |
| `filename` | string | Yes      | Original filename  |
| `mimeType` | string | Yes      | File MIME type     |
| `size`     | number | Yes      | File size in bytes |

**Response:**

```json
{
  "success": true,
  "data": {
    "mediaId": "media-789",
    "uploadUrl": "https://s3.amazonaws.com/bucket/presigned-upload-url",
    "expiresAt": "2024-01-15T17:00:00.000Z"
  }
}
```

**Upload Flow:**

1. **Request upload URL** - POST to `/albums/{albumId}/media/upload`
2. **Upload file** - PUT to the returned `uploadUrl`
3. **Automatic processing** - S3 triggers Lambda to generate 5 thumbnail sizes
4. **Database update** - Media record updated with complete `thumbnailUrls` object

### Delete Media

Delete a media item and all associated thumbnails.

```http
DELETE /media/{mediaId}
```

**Path Parameters:**

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `mediaId` | string | Yes      | Media identifier |

**Response:**

```json
{
  "success": true,
  "message": "Media item and all thumbnails deleted successfully"
}
```

## Thumbnail System API

### Thumbnail Size Reference

| Size       | Dimensions | Quality | File Size | Primary Use Case              |
| ---------- | ---------- | ------- | --------- | ----------------------------- |
| **cover**  | 128×128px  | 75%     | 8-15KB    | Album covers, small previews  |
| **small**  | 240×240px  | 80%     | 20-40KB   | Dense grids, admin interfaces |
| **medium** | 300×300px  | 85%     | 35-70KB   | General purpose, discover     |
| **large**  | 365×365px  | 85%     | 50-100KB  | High quality grids            |
| **xlarge** | 600×600px  | 90%     | 120-250KB | Mobile/small screens          |

### Intelligent Selection

The frontend automatically selects optimal thumbnail sizes based on:

- **Screen size** - Responsive breakpoints (sm/md/lg/xl/2xl)
- **Context** - Homepage, albums, admin, cover-selector
- **Layout** - Number of columns in grid displays

**Selection Logic Examples:**

```typescript
// Homepage on large screen → medium (300px)
// Albums with 6+ columns on xl screen → small (240px)
// Cover selector always → cover (128px)
// Mobile devices → xlarge (600px) for quality
```

### Backward Compatibility

**Legacy Field Support:**

- `thumbnailUrl` field maintained for backward compatibility
- Points to `small` size (240px) when available
- Falls back to original URL if no thumbnails exist

**Migration Support:**

- New clients should use `thumbnailUrls` object
- Legacy clients continue working with `thumbnailUrl`
- Gradual migration path supported

## Admin API

### Get Media Statistics

Get thumbnail generation statistics and health metrics.

```http
GET /admin/stats/thumbnails
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalMedia": 1234,
    "withThumbnails": 1189,
    "withComplete5Sizes": 1150,
    "withLegacyOnly": 39,
    "processingFailed": 45,
    "sizesGenerated": {
      "cover": 1150,
      "small": 1189,
      "medium": 1175,
      "large": 1160,
      "xlarge": 1155
    },
    "storageUsage": {
      "originals": "12.4 GB",
      "thumbnails": "2.1 GB",
      "compressionRatio": "83%"
    }
  }
}
```

### Regenerate Thumbnails

Trigger thumbnail regeneration for specific media or albums.

```http
POST /admin/thumbnails/regenerate
Content-Type: application/json

{
  "mediaIds": ["media-123", "media-456"],
  "sizes": ["cover", "small", "medium", "large", "xlarge"]
}
```

**Request Body:**

| Field      | Type     | Required | Description                       |
| ---------- | -------- | -------- | --------------------------------- |
| `mediaIds` | string[] | No       | Specific media IDs (omit for all) |
| `albumIds` | string[] | No       | Specific album IDs                |
| `sizes`    | string[] | No       | Sizes to generate (default: all)  |
| `force`    | boolean  | No       | Regenerate existing thumbnails    |

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "regen-job-789",
    "itemsQueued": 234,
    "estimatedTime": "15-20 minutes"
  }
}
```

## Error Handling

### HTTP Status Codes

| Status | Description           | Usage                         |
| ------ | --------------------- | ----------------------------- |
| 200    | OK                    | Successful operation          |
| 201    | Created               | Resource created successfully |
| 400    | Bad Request           | Invalid request parameters    |
| 401    | Unauthorized          | Authentication required       |
| 403    | Forbidden             | Insufficient permissions      |
| 404    | Not Found             | Resource not found            |
| 409    | Conflict              | Resource already exists       |
| 422    | Unprocessable Entity  | Validation errors             |
| 500    | Internal Server Error | Server error                  |

### Error Response Format

```json
{
  "success": false,
  "error": "MEDIA_NOT_FOUND",
  "message": "Media item with ID 'media-123' not found",
  "details": {
    "mediaId": "media-123",
    "timestamp": "2024-01-15T16:30:00.000Z"
  }
}
```

### Common Error Codes

| Code                          | Description                | HTTP Status |
| ----------------------------- | -------------------------- | ----------- |
| `ALBUM_NOT_FOUND`             | Album does not exist       | 404         |
| `MEDIA_NOT_FOUND`             | Media item does not exist  | 404         |
| `INVALID_MIME_TYPE`           | Unsupported file type      | 400         |
| `FILE_TOO_LARGE`              | File exceeds size limit    | 413         |
| `THUMBNAIL_GENERATION_FAILED` | Thumbnail processing error | 500         |
| `UPLOAD_EXPIRED`              | Upload URL expired         | 410         |
| `VALIDATION_ERROR`            | Request validation failed  | 422         |

## Rate Limiting

### Current Limits

| Endpoint Type | Rate Limit    | Window   |
| ------------- | ------------- | -------- |
| Public API    | 100 requests  | 1 minute |
| Upload API    | 10 uploads    | 1 minute |
| Admin API     | 1000 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

## Client SDKs and Examples

### JavaScript/TypeScript

```typescript
// Example using fetch API
const response = await fetch("https://api.pornspot.ai/albums/album-123", {
  headers: {
    Authorization: "AWS4-HMAC-SHA256 ...",
    "Content-Type": "application/json",
  },
});

const { success, data } = await response.json();

if (success && data.media) {
  data.media.forEach((media) => {
    // Use new thumbnail system
    const thumbnailUrl =
      media.thumbnailUrls?.medium || media.thumbnailUrl || media.url;

    console.log(`Displaying ${media.originalFilename} at ${thumbnailUrl}`);
  });
}
```

### cURL Examples

```bash
# List albums
curl -H "Authorization: AWS4-HMAC-SHA256 ..." \
     "https://api.pornspot.ai/albums?page=1&limit=10"

# Get album with media
curl -H "Authorization: AWS4-HMAC-SHA256 ..." \
     "https://api.pornspot.ai/albums/album-123?includeMedia=true"

# Upload media
curl -X POST \
     -H "Authorization: AWS4-HMAC-SHA256 ..." \
     -H "Content-Type: application/json" \
     -d '{"filename":"photo.jpg","mimeType":"image/jpeg","size":2048000}' \
     "https://api.pornspot.ai/albums/album-123/media/upload"
```

## Migration Notes

### From Legacy API

**Changes in v2.0:**

1. **New Field**: `thumbnailUrls` object with 5 sizes
2. **Maintained**: `thumbnailUrl` for backward compatibility
3. **Enhanced**: Intelligent size selection on frontend
4. **Added**: Complete thumbnail regeneration capabilities

**Migration Checklist:**

- [ ] Update clients to use `thumbnailUrls` when available
- [ ] Implement fallback to `thumbnailUrl` for compatibility
- [ ] Test responsive thumbnail selection
- [ ] Verify performance improvements
- [ ] Monitor thumbnail generation success rates

### Best Practices

1. **Always check** `thumbnailUrls` first, fallback to `thumbnailUrl`
2. **Use appropriate sizes** based on display context
3. **Implement lazy loading** for thumbnail images
4. **Cache thumbnails** on client side for performance
5. **Monitor API usage** and respect rate limits
6. **Handle errors gracefully** with fallback to original images

## Support

For API support and integration assistance:

- **Documentation**: [Thumbnail System Guide](THUMBNAIL_SYSTEM.md)
- **Migration Guide**: [Thumbnail Migration](THUMBNAIL_MIGRATION.md)
- **Scripts**: [Repair and Cleanup Tools](../scripts/README.md)

---

**Last Updated**: January 2024  
**API Version**: 2.0 (5-Size Thumbnail System)  
**Compatibility**: Maintains backward compatibility with v1.x clients
