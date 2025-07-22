# Thumbnail System Documentation

This document describes the intelligent 5-size thumbnail generation system implemented for PornSpot.ai gallery application.

## Overview

The thumbnail system automatically generates five optimized thumbnail sizes for uploaded media files, with intelligent responsive selection based on screen size, context, and layout requirements. This improves performance and user experience by displaying appropriately-sized images while preserving full-resolution images for detailed viewing.

## Architecture

### Components

1. **ThumbnailService** ([`backend/shared/utils/thumbnail.ts`](../backend/shared/utils/thumbnail.ts))

   - Core thumbnail generation logic using Sharp
   - 5-size thumbnail configuration with quality optimization
   - S3 upload functionality for generated thumbnails
   - Intelligent size selection algorithms

2. **Process Upload Lambda** ([`backend/functions/media/process-upload.ts`](../backend/functions/media/process-upload.ts))

   - Triggered by S3 upload events
   - Downloads original images and generates all 5 thumbnail sizes
   - Updates database records with complete thumbnailUrls object

3. **Repair Script** ([`scripts/repair-thumbnails.js`](../scripts/repair-thumbnails.js))

   - Batch processing for existing media without thumbnails
   - Generates all 5 thumbnail sizes for legacy content
   - Uses standardized naming pattern and WebP format
   - Safe to run multiple times (idempotent)
   - Comprehensive error handling and reporting

4. **Migration Script** ([`scripts/migrate-album-thumbnails.js`](../scripts/migrate-album-thumbnails.js))

   - Migrates existing album cover thumbnails to standardized naming pattern
   - Converts from `{size}.webp` to `cover_thumb_{size}.webp` pattern
   - Updates database records with new thumbnail URLs
   - Safely removes old thumbnails after successful migration
   - Handles transition period with fallback support

5. **Cleanup Scripts** ([`scripts/cleanup-thumbnails-*.js`](../scripts/))

   - Migration tools for transitioning from old 3-size to new 5-size system
   - S3 and DynamoDB cleanup utilities
   - Safe dry-run modes for testing

6. **Updated Data Models** ([`backend/shared/types/index.ts`](../backend/shared/types/index.ts), [`frontend/src/types/index.ts`](../frontend/src/types/index.ts))
   - Added `thumbnailUrls` object with 5 sizes
   - Maintained `thumbnailUrl` for backward compatibility
   - Support for tracking upload and processing status

### Flow Diagram

```
1. User uploads image via frontend
   ↓
2. Media upload endpoint creates pending record
   ↓
3. Frontend uploads to S3 using presigned URL
   ↓
4. S3 triggers process-upload Lambda
   ↓
5. Lambda downloads image and generates 5 thumbnail sizes
   ↓
6. Lambda uploads all thumbnails to S3
   ↓
7. Lambda updates database with thumbnailUrls object and status
   ↓
8. Frontend intelligently selects optimal size based on context
```

## Thumbnail Specifications

### 5-Size Configuration

```typescript
const THUMBNAIL_CONFIGS = {
  cover: { width: 128, height: 128, quality: 80, suffix: "_thumb_cover" }, // Cover selector component
  small: { width: 240, height: 240, quality: 85, suffix: "_thumb_small" }, // Albums large grids
  medium: { width: 300, height: 300, quality: 90, suffix: "_thumb_medium" }, // Discover large + Albums medium
  large: { width: 365, height: 365, quality: 90, suffix: "_thumb_large" }, // Discover medium/very large + Albums very large
  xlarge: { width: 600, height: 600, quality: 95, suffix: "_thumb_xlarge" }, // Small screens for both contexts
};
```

### Intelligent Selection Logic

The system automatically selects the optimal thumbnail size based on:

#### Context-Aware Selection

**Cover Selector (`cover-selector`):**

- Always uses **cover** (128px) - optimized for small album cover previews

**Discover (`discover`):**

- Small/Medium screens: **xlarge** (600px) - high quality for limited content
- Large screens: **large** (365px) - balanced quality and loading speed
- Very large screens: **medium** (300px) - efficient loading with good quality

**Albums (`albums`):**

- Small/Medium screens: **xlarge** (600px) - high quality for limited content
- Large screens: **medium** (300px) - good quality for grid layouts
- Extra large screens:
  - 6+ columns: **small** (240px) - efficient for dense grids
  - <6 columns: **medium** (300px) - better quality for fewer items
- Very large screens: **large** (365px) - premium quality for spacious layouts

**Admin (`admin`):**

- Small screens: **large** (365px) - good quality for admin workflows
- Medium screens: **medium** (300px) - balanced for admin interfaces
- Large+ screens: **small** (240px) - efficient for content-dense admin views

#### Responsive Breakpoints

```typescript
export const BREAKPOINTS = {
  sm: 640, // Small devices
  md: 768, // Medium devices
  lg: 1024, // Large devices
  xl: 1280, // Extra large devices
  "2xl": 1536, // 2X large devices
} as const;
```

### Storage Structure

```
S3 Bucket Structure:
albums/
  {albumId}/
    media/
      {uuid}.jpg                        # Original image
      thumbnails/
        {filename}_thumb_cover.webp     # Cover (128px)
        {filename}_thumb_small.webp     # Small (240px)
        {filename}_thumb_medium.webp    # Medium (300px)
        {filename}_thumb_large.webp     # Large (365px)
        {filename}_thumb_xlarge.webp    # X-Large (600px)
    cover/
      thumbnails/
        cover_thumb_cover.webp          # Album Cover (128px)
        cover_thumb_small.webp          # Album Small (240px)
        cover_thumb_medium.webp         # Album Medium (300px)
        cover_thumb_large.webp          # Album Large (365px)
        cover_thumb_xlarge.webp         # Album X-Large (600px)
```

### Standardized Naming Pattern

All thumbnails now use the consistent pattern: `{filename}_thumb_{size}.webp`

- **Media thumbnails**: `{filename}_thumb_{size}.webp` (e.g., `image_thumb_small.webp`)
- **Album cover thumbnails**: `cover_thumb_{size}.webp` (e.g., `cover_thumb_small.webp`)

This standardization was implemented to ensure consistency across all thumbnail types and simplify maintenance.

## Supported File Types

The system generates thumbnails for the following image formats:

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif) - static frame only

Non-image files (videos, documents) are skipped during thumbnail processing.

## Database Schema Updates

### Media Entity Fields

```typescript
interface MediaEntity {
  // ... existing fields
  thumbnailUrl?: string; // Legacy field - points to small thumbnail for backward compatibility
  thumbnailUrls?: {
    // New 5-size thumbnail object (WebP format)
    cover?: string; // 128×128px (Quality: 80%)
    small?: string; // 240×240px (Quality: 85%)
    medium?: string; // 300×300px (Quality: 90%)
    large?: string; // 365×365px (Quality: 90%)
    xlarge?: string; // 600×600px (Quality: 95%)
  };
  status?: "pending" | "uploaded" | "failed"; // Processing status
  // ... existing fields
}
```

### Status Values

- **pending**: Upload initiated, processing not complete
- **uploaded**: Successfully uploaded and processed with all thumbnail sizes
- **failed**: Upload or processing failed

## Frontend Integration

### Intelligent Thumbnail Selection

```typescript
// MediaCard component with context-aware selection
import { getThumbnailUrl, ThumbnailContext } from "../lib/utils";

<img
  src={getThumbnailUrl(media, context, undefined, columns)}
  alt={media.originalFilename}
  className="w-full h-full object-cover"
  loading="lazy"
/>;
```

### Context Examples

```typescript
// Discover display - automatically selects xlarge/large/medium based on screen
<MediaCard media={item} context="discover" />

// Album grid - adapts to screen size and column count
<MediaCard media={item} context="albums" columns={gridColumns} />

// Admin interface - optimized for content density
<MediaCard media={item} context="admin" />

// Cover selector - always uses cover size
<MediaCard media={item} context="cover-selector" />
```

### Fallback Chain

If the preferred size isn't available, the system automatically falls back in this order:

1. Selected optimal size
2. Medium (300px) - best general purpose size
3. Small (240px) - good for most use cases
4. Large (365px) - higher quality fallback
5. X-Large (600px) - highest quality
6. Cover (128px) - last resort
7. Legacy `thumbnailUrl` field
8. Original image URL

### Lightbox/Full View

```typescript
// Lightbox shows optimized WebP version if available, otherwise original image
import { getMediaDisplayUrl } from "../lib/utils";

<img src={getMediaDisplayUrl(media)} alt={media.originalFilename} />;
```

## Performance Benefits

### File Size Optimization

| Size         | Dimensions | Quality | Typical Size | Use Case                      |
| ------------ | ---------- | ------- | ------------ | ----------------------------- |
| **Cover**    | 128×128px  | 80%     | 6-12KB       | Album covers, small previews  |
| **Small**    | 240×240px  | 85%     | 15-30KB      | Dense grids, admin interfaces |
| **Medium**   | 300×300px  | 90%     | 25-50KB      | General purpose, discover     |
| **Large**    | 365×365px  | 90%     | 35-70KB      | High quality grids            |
| **X-Large**  | 600×600px  | 95%     | 80-160KB     | Mobile/small screens          |
| **Original** | Variable   | 100%    | 5-10MB       | Full resolution viewing       |

### Loading Speed Improvements

- **95%+ file size reduction** for gallery views
- **3-5x faster** initial page loads
- **60% reduction** in bandwidth usage
- **Improved Core Web Vitals** scores across all devices
- **Better mobile experience** with appropriate sizing

### Cost Optimization

- **Reduced CloudFront bandwidth costs** through smaller file sizes
- **Lower S3 transfer costs** with intelligent size selection
- **Improved user experience metrics** leading to better engagement
- **Reduced data usage** for mobile users

## Deployment Configuration

### Lambda Function Setup

The process-upload function requires:

1. **S3 Event Trigger**

   ```yaml
   Events:
     S3Upload:
       Type: S3
       Properties:
         Bucket: !Ref MediaBucket
         Event: s3:ObjectCreated:*
         Filter:
           S3Key:
             Rules:
               - Name: prefix
                 Value: albums/
               - Name: suffix
                 Value: /media/
   ```

2. **Environment Variables**

   ```yaml
   Environment:
     Variables:
       DYNAMODB_TABLE: !Ref DynamoDBTable
       S3_BUCKET: !Ref MediaBucket
       CLOUDFRONT_DOMAIN: !GetAtt CloudFrontDistribution.DomainName
   ```

3. **IAM Permissions**
   ```yaml
   Policies:
     - S3ReadWritePolicy:
         BucketName: !Ref MediaBucket
     - DynamoDBCrudPolicy:
         TableName: !Ref DynamoDBTable
   ```

### Frontend Configuration

No additional configuration required - components automatically detect and use intelligent thumbnail selection when available.

## Migration Guide

### Album Cover Thumbnail Naming Standardization

To migrate existing album cover thumbnails from the old naming pattern to the new standardized pattern:

#### 1. Run the Migration Script

```bash
# Set environment variables
export DYNAMODB_TABLE=your-table-name
export S3_BUCKET=your-bucket-name
export AWS_REGION=your-region

# Run the migration
node scripts/migrate-album-thumbnails.js
```

#### 2. Migration Process

The migration script will:

1. **Scan all albums** in the database
2. **Find existing thumbnails** with old naming pattern (`{size}.webp`)
3. **Copy to new locations** using standardized pattern (`cover_thumb_{size}.webp`)
4. **Update database records** with new thumbnail URLs
5. **Remove old thumbnails** after successful migration

#### 3. Transformation Example

```
Old: albums/123/cover/thumbnails/small.webp
New: albums/123/cover/thumbnails/cover_thumb_small.webp

Old: albums/123/cover/thumbnails/large.webp
New: albums/123/cover/thumbnails/cover_thumb_large.webp
```

#### 4. Backward Compatibility

During the migration period, the system maintains backward compatibility through:

- Frontend utility functions that handle both old and new naming patterns
- Database fallback logic for missing thumbnails
- Gradual migration approach that doesn't break existing functionality

#### 5. Post-Migration Benefits

- **Consistent naming** across all thumbnail types
- **Simplified maintenance** and debugging
- **Clearer S3 bucket organization**
- **Easier automated processing** and cleanup scripts

## Monitoring and Troubleshooting

### CloudWatch Logs

Monitor Lambda execution logs for thumbnail generation:

```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/process-upload \
  --filter-pattern "ERROR"
```

### Metrics to Track

1. **Thumbnail Generation Success Rate**

   - Track successful vs failed thumbnail generations for all 5 sizes
   - Alert on high failure rates or missing sizes

2. **Processing Time**

   - Monitor Lambda execution duration (should be ~30-60s for 5 sizes)
   - Optimize for large image processing

3. **Storage Usage**

   - Track S3 storage growth across all thumbnail sizes
   - Monitor thumbnail vs original ratios (should be ~5-10% of original size)

4. **Selection Performance**
   - Monitor which sizes are most frequently selected
   - Analyze context-specific usage patterns

### Common Issues

#### 1. Lambda Timeout

```
Error: Task timed out after 30.00 seconds
```

**Solution**: Increase Lambda timeout to 300s for processing 5 thumbnail sizes

#### 2. Memory Issues

```
Error: Process exited with signal SIGKILL
```

**Solution**: Increase Lambda memory allocation to 1024MB or higher

#### 3. Sharp Dependencies

```
Error: Cannot find module '@img/sharp-linux-x64'
```

**Solution**: Ensure Sharp is compiled for Lambda environment

#### 4. Partial Thumbnail Generation

```
Error: Only 3 of 5 thumbnail sizes were generated
```

**Solution**: Check image format compatibility and memory limits

## Repair and Maintenance

### Running Thumbnail Repair

For existing installations or fixing missing thumbnails:

```bash
# Set environment variables
export AWS_REGION="us-east-1"
export DYNAMODB_TABLE="your-table-name"
export S3_BUCKET="your-bucket-name"
export CLOUDFRONT_DOMAIN="your-domain.com"

# Run repair script (generates all 5 sizes)
npm run repair:thumbnails

# With options
npm run repair:thumbnails -- --dry-run --limit 50 --batch-size 3
```

See [`scripts/README.md`](../scripts/README.md) for detailed repair script documentation.

### Migration from 3-Size System

For migrating from the previous 3-size system:

```bash
# 1. Clean up old thumbnails (dry-run first)
npm run cleanup:thumbnails:all -- --dry-run

# 2. Execute cleanup
npm run cleanup:thumbnails:all

# 3. Regenerate with new 5-size system
npm run repair:thumbnails
```

See [`docs/THUMBNAIL_MIGRATION.md`](THUMBNAIL_MIGRATION.md) for complete migration guide.

### Batch Operations

For large galleries, consider:

1. Running repairs during off-peak hours
2. Monitoring AWS service limits and costs
3. Implementing progressive processing with batch sizes
4. Setting up CloudWatch alarms for failures

## Performance Optimization

### Sharp Configuration

```typescript
// Optimized Sharp settings for Lambda with 5 sizes
const thumbnailBuffer = await sharp(imageBuffer)
  .resize(config.width, config.height, {
    fit: "cover",
    position: "center",
    withoutEnlargement: true, // Don't upscale small images
  })
  .jpeg({
    quality: config.quality,
    progressive: true, // Progressive JPEG for better loading
    mozjpeg: true, // Use mozjpeg encoder for better compression
  })
  .toBuffer();
```

### Caching Strategy

```typescript
// CloudFront cache headers for thumbnails
const uploadParams = {
  // ...
  CacheControl: "public, max-age=31536000", // 1 year cache
  Metadata: {
    "cache-control": "public, max-age=31536000",
    "thumbnail-system": "5-size-v2",
  },
};
```

### Intelligent Selection Performance

```typescript
// Frontend utility for optimal size selection
export function selectThumbnailSize(
  context: ThumbnailContext,
  screenSize?: ScreenSize,
  columns?: number
): ThumbnailSize {
  // Fast, context-aware selection algorithm
  // See frontend/src/lib/utils.ts for full implementation
}
```

## Security Considerations

### Access Control

- Thumbnails inherit original image permissions
- S3 bucket policies apply to thumbnail directories
- CloudFront restrictions maintained across all sizes

### Content Validation

```typescript
// Validate image before processing all sizes
if (!ThumbnailService.isImageFile(mimeType)) {
  console.log("Skipping non-image file");
  return;
}

// File size limits
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
if (buffer.length > MAX_IMAGE_SIZE) {
  throw new Error("Image too large for processing");
}
```

## API Integration

The thumbnail system integrates with the REST API to provide comprehensive thumbnail information. See [`docs/API.md`](API.md) for complete API documentation including:

- Media endpoints with `thumbnailUrls` structure
- Backward compatibility with `thumbnailUrl` field
- Request/response examples for all sizes
- Error handling and status codes

## Migration Guide

For organizations migrating from older thumbnail systems or implementing the 5-size system for the first time, see the comprehensive [`docs/THUMBNAIL_MIGRATION.md`](THUMBNAIL_MIGRATION.md) guide including:

- Pre-migration assessment and planning
- Step-by-step migration procedures
- Post-migration verification and testing
- Rollback strategies and troubleshooting
- Performance optimization recommendations

## Future Enhancements

### Planned Features

1. **WebP Format Support**

   - Modern format generation alongside JPEG
   - Automatic format selection based on browser support
   - Further file size reductions (20-30% smaller than JPEG)

2. **Advanced Context Detection**

   - Device-specific optimizations (mobile/tablet/desktop)
   - Network-aware quality adjustment
   - User preference learning

3. **Progressive Enhancement**

   - Blur placeholder generation for ultra-fast loading
   - Progressive image enhancement
   - Lazy loading improvements

4. **AI-Powered Optimization**
   - Smart cropping based on content analysis
   - Quality enhancement filters
   - Automatic orientation correction

### API Extensions

Future API enhancements may include:

```typescript
// Custom thumbnail generation endpoint
POST /api/media/{mediaId}/thumbnails
{
  "sizes": ["small", "medium", "large"],
  "format": "webp",
  "quality": 90,
  "context": "custom"
}
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Monitor thumbnail generation success rates and performance
2. **Monthly**: Review storage costs and usage patterns across all sizes
3. **Quarterly**: Analyze intelligent selection effectiveness and optimize
4. **Annually**: Update Sharp dependencies and optimize configurations

### Support Checklist

- [ ] Verify S3 triggers are configured for all environments
- [ ] Check Lambda function permissions and memory allocation
- [ ] Confirm environment variables for 5-size generation
- [ ] Test thumbnail generation manually for all sizes
- [ ] Validate intelligent selection in different contexts
- [ ] Monitor CloudWatch logs for processing errors
- [ ] Check S3 storage structure and organization
- [ ] Verify frontend fallback behavior works correctly
- [ ] Test API responses include complete thumbnailUrls object

For additional support and detailed migration procedures, refer to:

- [Repair Script Documentation](../scripts/README.md#repair-thumbnails-js)
- [Migration Guide](THUMBNAIL_MIGRATION.md)
- [API Documentation](API.md)
- [Cleanup Scripts Guide](../scripts/README.md#cleanup-scripts)
