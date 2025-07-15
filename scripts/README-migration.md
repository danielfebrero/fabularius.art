# WebP Migration Script Documentation

This document provides comprehensive instructions for migrating existing JPEG and PNG thumbnail files to WebP format in the PornSpot.ai application.

## Overview

The WebP migration script converts existing JPEG and PNG thumbnail files to WebP format while preserving original files in their uploaded format. This migration approach provides:

- **Improved Performance**: WebP thumbnails are typically 25-35% smaller than JPEG
- **Better User Experience**: Faster loading times for browsing/display
- **Preserved Downloads**: Original files remain in their uploaded format for download functionality
- **Lightbox Performance**: WebP display versions created for optimal viewing
- **Storage Optimization**: Reduced S3 storage costs for thumbnails

## Prerequisites

### Environment Setup

1. **Node.js**: Version 16+ required
2. **AWS Credentials**: Properly configured AWS credentials with access to:
   - DynamoDB table (read/write permissions)
   - S3 bucket (read/write/delete permissions)
3. **Dependencies**: Sharp library installed (`npm install sharp`)

### Required Environment Variables

```bash
# Required
DYNAMODB_TABLE=your-dynamodb-table-name
S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1

# Optional (for local development)
AWS_SAM_LOCAL=true  # Set to true when using LocalStack
```

### IAM Permissions

The script requires the following AWS permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:Scan", "dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:*:*:table/your-table-name"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Installation

1. **Clone the repository** (if not already done)
2. **Navigate to the project directory**
3. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```
4. **Make the script executable**:
   ```bash
   chmod +x scripts/migrate-to-webp.js
   ```

## Usage

### Basic Commands

#### Dry Run (Recommended First Step)

```bash
node scripts/migrate-to-webp.js --dry-run
```

#### Full Migration

```bash
node scripts/migrate-to-webp.js
```

#### Migration with Custom Batch Size

```bash
node scripts/migrate-to-webp.js --batch-size=5
```

### Command Line Options

| Option              | Description                          | Default | Example                  |
| ------------------- | ------------------------------------ | ------- | ------------------------ |
| `--dry-run`         | Preview changes without making them  | false   | `--dry-run`              |
| `--batch-size=N`    | Number of records to process at once | 10      | `--batch-size=5`         |
| `--resume-from=ID`  | Resume from specific media ID        | null    | `--resume-from=media123` |
| `--album-id=ID`     | Process only specific album          | null    | `--album-id=album456`    |
| `--log-level=LEVEL` | Set log verbosity                    | info    | `--log-level=debug`      |
| `--thumbnails-only` | Convert only thumbnails (default)    | true    | `--thumbnails-only`      |
| `--help`            | Show help message                    | -       | `--help`                 |

### Advanced Usage Examples

#### Process Specific Album

```bash
node scripts/migrate-to-webp.js --album-id=album123 --batch-size=5
```

#### Resume Failed Migration

```bash
node scripts/migrate-to-webp.js --resume-from=media456
```

#### Thumbnails Only (Default Behavior)

```bash
node scripts/migrate-to-webp.js
```

Note: The script now only converts thumbnails by default, preserving original files.

#### Debug Mode

```bash
node scripts/migrate-to-webp.js --log-level=debug --batch-size=1
```

## Migration Process

### What the Script Does

1. **Scans DynamoDB**: Finds all media records with JPEG or PNG thumbnail files
2. **Downloads Thumbnails**: Retrieves JPEG and PNG thumbnail files from S3
3. **Converts to WebP**: Uses Sharp library for high-quality thumbnail conversion
4. **Uploads WebP Thumbnails**: Stores converted thumbnails back to S3
5. **Updates Database**: Modifies DynamoDB records with new thumbnail URLs
6. **Preserves Originals**: Keeps original files in their uploaded format for downloads
7. **Cleanup**: Deletes only JPEG and PNG thumbnail files (originals preserved)

### File Processing Logic

#### Thumbnail Conversion

- **Identifies JPEG and PNG thumbnails** in `thumbnailUrls` object
- **Converts each size** (cover, small, medium, large, xlarge)
- **Supports both formats**: JPEG (.jpg, .jpeg) and PNG (.png) input files
- **Preserves quality settings** per thumbnail size:
  - cover: 80% quality
  - small: 85% quality
  - medium: 90% quality
  - large: 90% quality
  - xlarge: 95% quality

#### Original File Preservation

- **Preserves original media files** in their uploaded format (JPEG, PNG, GIF, etc.)
- **Maintains original filename and MIME type** in database
- **Ensures download functionality** works with original format files
- **Creates WebP display versions** for lightbox viewing (handled by upload processor)

#### Format Support

- **Input Formats**: JPEG (.jpg, .jpeg), PNG (.png)
- **Output Format**: WebP (.webp) for all thumbnails
- **Processing**: Uses same Sharp pipeline for both JPEG and PNG inputs
- **Quality Settings**: Same WebP quality settings work for both source formats

### Database Updates

The script updates the following fields in DynamoDB:

- `thumbnailUrls`: Updates URLs to use `.webp` extensions for thumbnails only (from .jpg, .jpeg, or .png)
- `thumbnailUrl`: Updates single thumbnail URL (usually small size)
- `url`: **Preserved** - keeps original file URL and format
- `filename`: **Preserved** - keeps original filename and extension
- `mimeType`: **Preserved** - keeps original MIME type
- `updatedAt`: Sets current timestamp

## Error Handling and Recovery

### Retry Logic

- **3 automatic retries** for failed operations
- **1-second delay** between retries
- **Graceful failure**: Continues with other records if one fails

### Error Logging

- **Detailed error logs** saved to `migration-errors-{timestamp}.json`
- **Per-record error tracking** with media ID and album ID
- **Error categorization** (download, conversion, upload, database)

### Resume Capability

```bash
# Resume from specific media ID
node scripts/migrate-to-webp.js --resume-from=media123

# Check progress file (if enabled in config)
cat .migration-progress.json
```

## Monitoring and Reporting

### Real-time Progress

The script provides real-time progress information:

- Records processed/total
- Conversion success rate
- Processing speed (records/second)
- Estimated time remaining

### Final Report

After completion, generates comprehensive reports:

#### Summary Report

```json
{
  "totalRecords": 1000,
  "processedRecords": 950,
  "skippedRecords": 45,
  "failedRecords": 5,
  "convertedThumbnails": 4750,
  "convertedOriginals": 850,
  "deletedFiles": 5600,
  "elapsedSeconds": 1800,
  "recordsPerSecond": "0.53"
}
```

#### Error Report

- Detailed error information for failed records
- Recommendations for manual intervention
- Recovery commands for specific failures

## Safety Features

### Dry Run Mode

- **Preview all changes** before execution
- **Zero risk** - no files or database records modified
- **Detailed change log** showing what would be converted

### Validation

- **File integrity checks** after conversion
- **WebP format validation** before deleting originals
- **Database consistency checks** during updates

### Backup Recommendations

```bash
# Create DynamoDB backup (recommended)
aws dynamodb create-backup \
  --table-name $DYNAMODB_TABLE \
  --backup-name "pre-webp-migration-$(date +%Y%m%d)"

# S3 versioning should be enabled on the bucket
aws s3api put-bucket-versioning \
  --bucket $S3_BUCKET \
  --versioning-configuration Status=Enabled
```

## Troubleshooting

### Common Issues

#### Sharp Module Not Found

```bash
Error: Sharp module not available
```

**Solution**: Install Sharp with correct platform binaries

```bash
npm uninstall sharp
npm install --platform=linux --arch=x64 sharp
```

#### Permission Denied

```bash
Error: Access Denied
```

**Solution**: Check IAM permissions and AWS credentials

```bash
aws sts get-caller-identity  # Verify credentials
```

#### Out of Memory

```bash
Error: JavaScript heap out of memory
```

**Solution**: Reduce batch size and enable streaming

```bash
node --max-old-space-size=4096 scripts/migrate-to-webp.js --batch-size=3
```

#### Network Timeouts

```bash
Error: Operation timeout
```

**Solution**: Increase timeout in configuration

```javascript
// In migrate-to-webp-config.js
processing: {
  operationTimeout: 60000; // Increase to 60 seconds
}
```

### Recovery Procedures

#### Partial Migration Recovery

If migration fails partway through:

1. **Check error report** for specific failure patterns
2. **Fix underlying issues** (permissions, network, etc.)
3. **Resume from last successful record**:
   ```bash
   node scripts/migrate-to-webp.js --resume-from=last-successful-id
   ```

#### Database Inconsistency Recovery

If database updates fail but files were converted:

1. **Run in dry-run mode** to identify inconsistencies
2. **Use specific album targeting**:
   ```bash
   node scripts/migrate-to-webp.js --album-id=affected-album
   ```

## Performance Optimization

### Batch Size Tuning

- **Small batches (1-3)**: Better for debugging, slower overall
- **Medium batches (5-10)**: Good balance for most environments
- **Large batches (15-20)**: Faster but higher memory usage

### Resource Monitoring

Monitor these metrics during migration:

- **Memory usage**: Should stay under 2GB
- **Network bandwidth**: S3 transfer rates
- **Database read/write capacity**: DynamoDB throttling

### Optimization Tips

```bash
# For large migrations (1000+ records)
node scripts/migrate-to-webp.js --batch-size=15 --log-level=warn

# For debugging specific issues
node scripts/migrate-to-webp.js --batch-size=1 --log-level=debug --album-id=problem-album

# For memory-constrained environments
node --max-old-space-size=2048 scripts/migrate-to-webp.js --batch-size=5
```

## Configuration Customization

### Quality Settings

Modify `migrate-to-webp-config.js` to adjust quality:

```javascript
quality: {
  original: 95,        // High quality for originals
  defaultThumbnail: 90 // Fallback for custom thumbnails
}
```

### Format Support Settings

```javascript
fileTypes: {
  jpegExtensions: [".jpg", ".jpeg"],
  pngExtensions: [".png"],
  convertibleExtensions: [".jpg", ".jpeg", ".png"],
  convertibleMimeTypes: ["image/jpeg", "image/jpg", "image/png"]
}
```

### Processing Limits

```javascript
processing: {
  maxFileSize: 50 * 1024 * 1024,  // 50MB limit
  maxRetries: 5,                   // More retries
  retryDelay: 2000                 // Longer delays
}
```

## Testing

### Test Environment Setup

```bash
# Use LocalStack for testing
AWS_SAM_LOCAL=true \
DYNAMODB_TABLE=test-table \
S3_BUCKET=test-bucket \
node scripts/migrate-to-webp.js --dry-run
```

### Validation Tests

```bash
# Test specific record
node scripts/migrate-to-webp.js --dry-run --album-id=test-album

# Test error handling
node scripts/migrate-to-webp.js --batch-size=1 --log-level=debug
```

## Best Practices

### Pre-Migration Checklist

- [ ] Backup DynamoDB table
- [ ] Enable S3 versioning
- [ ] Run dry-run first
- [ ] Test with small album
- [ ] Monitor AWS costs
- [ ] Check Sharp installation

### During Migration

- [ ] Monitor progress logs
- [ ] Watch for memory usage
- [ ] Check error rates
- [ ] Verify sample conversions
- [ ] Monitor AWS service limits

### Post-Migration

- [ ] Verify report accuracy
- [ ] Spot-check converted files
- [ ] Test application functionality
- [ ] Monitor performance improvements
- [ ] Clean up temporary files

## Support and Maintenance

### Log Locations

- **Migration logs**: Console output + optional file logging
- **Error reports**: `migration-errors-{timestamp}.json`
- **Progress files**: `.migration-progress.json`
- **Full reports**: `migration-report-{timestamp}.json`

### Maintenance Commands

```bash
# Clean up old reports
find . -name "migration-*-*.json" -mtime +30 -delete

# Check conversion success rate
grep -c "✅ SUCCESS" migration.log
```

### Contact Information

For issues or questions:

- Check error reports first
- Review this documentation
- Test in dry-run mode
- Monitor AWS CloudWatch logs

---

**Important**: Always run in `--dry-run` mode first to preview changes and verify the migration plan before executing the actual conversion. The script now supports both JPEG and PNG thumbnail conversion to WebP format.
