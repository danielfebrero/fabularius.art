# Thumbnail System Documentation

This document describes the automatic thumbnail generation system implemented for PornSpot.ai gallery application.

## Overview

The thumbnail system automatically generates optimized thumbnail images for uploaded media files, improving performance and user experience by displaying smaller, faster-loading images in gallery views while preserving the full-resolution images for detailed viewing.

## Architecture

### Components

1. **ThumbnailService** (`backend/shared/utils/thumbnail.ts`)

   - Core thumbnail generation logic using Sharp
   - Configurable thumbnail sizes and quality
   - S3 upload functionality for generated thumbnails

2. **Process Upload Lambda** (`backend/functions/media/process-upload.ts`)

   - Triggered by S3 upload events
   - Downloads original images and generates thumbnails
   - Updates database records with thumbnail URLs

3. **Repair Script** (`scripts/repair-thumbnails.js`)

   - Batch processing for existing media without thumbnails
   - Safe to run multiple times (idempotent)
   - Comprehensive error handling and reporting

4. **Updated Data Models** (`backend/shared/types/index.ts`)
   - Added `thumbnailUrl` and `status` fields to Media interfaces
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
5. Lambda downloads image and generates thumbnail
   ↓
6. Lambda uploads thumbnail to S3
   ↓
7. Lambda updates database with thumbnail URL and status
   ↓
8. Frontend displays thumbnail in gallery views
```

## Thumbnail Specifications

### Default Configuration

- **Size**: 600x600 pixels (medium thumbnail)
- **Quality**: 85% JPEG compression
- **Fit**: Cover (maintains aspect ratio, crops if necessary)
- **Position**: Center crop
- **Format**: JPEG (regardless of original format)

### Multiple Sizes Available

```typescript
const THUMBNAIL_CONFIGS = {
  small: { width: 300, height: 300, quality: 80, suffix: "_thumb_small" },
  medium: { width: 600, height: 600, quality: 85, suffix: "_thumb_medium" },
  large: { width: 1200, height: 1200, quality: 90, suffix: "_thumb_large" },
};
```

### Storage Structure

```
S3 Bucket Structure:
albums/
  {albumId}/
    media/
      {uuid}.jpg                    # Original image
    thumbnails/
      {filename}_thumb_medium.jpg   # Medium thumbnail
      {filename}_thumb_small.jpg    # Small thumbnail (if generated)
      {filename}_thumb_large.jpg    # Large thumbnail (if generated)
```

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
  thumbnailUrl?: string; // URL to generated thumbnail
  status?: "pending" | "uploaded" | "failed"; // Processing status
  // ... existing fields
}
```

### Status Values

- **pending**: Upload initiated, processing not complete
- **uploaded**: Successfully uploaded and processed
- **failed**: Upload or processing failed

## Frontend Integration

### Gallery Display

```typescript
// MediaCard component automatically uses thumbnails
<img
  src={media.thumbnailUrl || media.url} // Fallback to original
  alt={media.originalFilename}
  className="w-full h-full object-cover"
  loading="lazy"
/>
```

### Lightbox/Full View

```typescript
// Lightbox shows original full-resolution image
<img src={media.url} alt={media.originalFilename} />
```

## Performance Benefits

### File Size Reduction

- Original: 5-10MB high-resolution images
- Thumbnail: 50-200KB optimized images
- **95%+ file size reduction** for gallery views

### Loading Speed

- Faster initial page loads
- Reduced bandwidth usage
- Better mobile experience
- Improved Core Web Vitals scores

### Cost Optimization

- Reduced CloudFront bandwidth costs
- Lower S3 transfer costs
- Improved user experience metrics

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

No additional configuration required - components automatically detect and use thumbnails when available.

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

   - Track successful vs failed thumbnail generations
   - Alert on high failure rates

2. **Processing Time**

   - Monitor Lambda execution duration
   - Optimize for large image processing

3. **Storage Usage**
   - Track S3 storage growth
   - Monitor thumbnail vs original ratios

### Common Issues

#### 1. Lambda Timeout

```
Error: Task timed out after 30.00 seconds
```

**Solution**: Increase Lambda timeout for large image processing

#### 2. Memory Issues

```
Error: Process exited with signal SIGKILL
```

**Solution**: Increase Lambda memory allocation

#### 3. Sharp Dependencies

```
Error: Cannot find module '@img/sharp-linux-x64'
```

**Solution**: Ensure Sharp is compiled for Lambda environment

## Repair and Maintenance

### Running Thumbnail Repair

For existing installations without thumbnails:

```bash
# Set environment variables
export AWS_REGION="us-east-1"
export DYNAMODB_TABLE="your-table-name"
export S3_BUCKET="your-bucket-name"
export CLOUDFRONT_DOMAIN="your-domain.com"

# Run repair script
npm run repair:thumbnails
```

### Batch Operations

For large galleries, consider:

1. Running repairs during off-peak hours
2. Monitoring AWS service limits
3. Implementing progressive processing
4. Setting up CloudWatch alarms

## Performance Optimization

### Sharp Configuration

```typescript
// Optimized Sharp settings for Lambda
const thumbnailBuffer = await sharp(imageBuffer)
  .resize(600, 600, {
    fit: "cover",
    position: "center",
    withoutEnlargement: true, // Don't upscale small images
  })
  .jpeg({
    quality: 85,
    progressive: true, // Progressive JPEG for better loading
    mozjpeg: true, // Use mozjpeg encoder for better compression
  })
  .toBuffer();
```

### Caching Strategy

```typescript
// CloudFront cache headers
const uploadParams = {
  // ...
  CacheControl: "public, max-age=31536000", // 1 year cache
  Metadata: {
    "cache-control": "public, max-age=31536000",
  },
};
```

## Security Considerations

### Access Control

- Thumbnails inherit original image permissions
- S3 bucket policies apply to thumbnail directories
- CloudFront restrictions maintained

### Content Validation

```typescript
// Validate image before processing
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

## Future Enhancements

### Planned Features

1. **Multiple Thumbnail Sizes**

   - Responsive image loading
   - Device-specific optimizations

2. **WebP Support**

   - Modern format for better compression
   - Fallback to JPEG for compatibility

3. **Progressive Enhancement**

   - Lazy loading improvements
   - Blur placeholder generation

4. **Advanced Processing**
   - Auto-rotation based on EXIF
   - Quality enhancement filters
   - Watermark application

### API Extensions

```typescript
// Future API for custom thumbnail requests
POST /api/media/{mediaId}/thumbnails
{
  "sizes": ["small", "medium", "large"],
  "format": "webp",
  "quality": 90
}
```

## Migration Guide

### From Existing Installation

1. **Deploy Updated Backend**

   - Update Lambda functions
   - Deploy new process-upload function
   - Update DynamoDB schema

2. **Run Thumbnail Repair**

   - Execute repair script for existing media
   - Monitor progress and errors
   - Verify thumbnail generation

3. **Update Frontend**

   - Deploy updated components
   - Test thumbnail display
   - Verify fallback behavior

4. **Performance Testing**
   - Measure loading improvements
   - Validate user experience
   - Monitor error rates

## Support and Maintenance

### Regular Maintenance Tasks

1. **Monthly**: Review thumbnail generation metrics
2. **Quarterly**: Analyze storage costs and usage patterns
3. **Annually**: Update Sharp dependencies and optimize configurations

### Support Checklist

- [ ] Verify S3 triggers are configured
- [ ] Check Lambda function permissions
- [ ] Confirm environment variables
- [ ] Test thumbnail generation manually
- [ ] Validate frontend display
- [ ] Monitor CloudWatch logs
- [ ] Check S3 storage structure

For additional support, refer to the repair script documentation in `scripts/README.md`.
