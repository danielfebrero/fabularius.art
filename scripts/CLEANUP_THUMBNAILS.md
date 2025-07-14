# Thumbnail Cleanup Scripts

This directory contains scripts to clean up existing thumbnail data before implementing the new 5-size thumbnail system.

## Overview

The current system has old thumbnails with these patterns:

- Files in `/thumbnails/` directories
- Files with `_thumb_small`, `_thumb_medium`, `_thumb_large` suffixes
- Database fields: `thumbnailUrl` and `thumbnailUrls`

These scripts will clean up all existing thumbnail data to prepare for the new system with 5 sizes: cover (128px), small (240px), medium (300px), large (365px), xlarge (600px).

## Scripts

### 1. S3 Cleanup (`cleanup-thumbnails-s3.js`)

Removes all thumbnail files from S3 bucket.

**What it does:**

- Lists all objects with `/thumbnails/` prefix
- Deletes objects containing `_thumb_small`, `_thumb_medium`, `_thumb_large`
- Provides progress logging and batch deletion
- Supports dry-run mode

**Usage:**

```bash
# Dry run (preview what would be deleted)
npm run cleanup:thumbnails:s3 -- --dry-run

# Actual cleanup
S3_BUCKET=your-bucket npm run cleanup:thumbnails:s3

# Help
node scripts/cleanup-thumbnails-s3.js --help
```

### 2. DynamoDB Cleanup (`cleanup-thumbnails-db.js`)

Removes thumbnail references from database.

**What it does:**

- Scans all Media entities in DynamoDB
- Removes `thumbnailUrl` and `thumbnailUrls` fields
- Resets status to "uploaded"
- Updates `updatedAt` timestamp

**Usage:**

```bash
# Dry run (preview what would be updated)
npm run cleanup:thumbnails:db -- --dry-run

# Actual cleanup
DYNAMODB_TABLE=your-table npm run cleanup:thumbnails:db

# Help
node scripts/cleanup-thumbnails-db.js --help
```

### 3. Complete Cleanup (`cleanup-thumbnails-all.js`)

Runs both S3 and DynamoDB cleanup in sequence.

**What it does:**

- Validates environment variables
- Runs S3 cleanup first
- Then runs DynamoDB cleanup
- Provides comprehensive error handling and rollback logic
- Supports selective cleanup (skip S3 or DB)

**Usage:**

```bash
# Dry run (complete preview)
npm run cleanup:thumbnails:all -- --dry-run

# Complete cleanup
S3_BUCKET=your-bucket DYNAMODB_TABLE=your-table npm run cleanup:thumbnails:all

# Only S3 cleanup
npm run cleanup:thumbnails:all -- --skip-db

# Only DynamoDB cleanup
npm run cleanup:thumbnails:all -- --skip-s3

# Help
node scripts/cleanup-thumbnails-all.js --help
```

## Environment Variables

| Variable         | Required             | Description                           |
| ---------------- | -------------------- | ------------------------------------- |
| `S3_BUCKET`      | Yes (for S3 cleanup) | S3 bucket name containing media files |
| `DYNAMODB_TABLE` | Yes (for DB cleanup) | DynamoDB table name                   |
| `AWS_REGION`     | No                   | AWS region (default: us-east-1)       |

## Safety Features

### Dry Run Mode

All scripts support `--dry-run` flag that shows what would be deleted/updated without making actual changes.

```bash
# Examples
npm run cleanup:thumbnails:s3 -- --dry-run
npm run cleanup:thumbnails:db -- --dry-run
npm run cleanup:thumbnails:all -- --dry-run
```

### Confirmation Prompts

Scripts ask for explicit confirmation before performing destructive operations:

```
⚠️  WARNING: This will permanently delete thumbnail data!
   - S3 thumbnail files will be deleted
   - DynamoDB thumbnail references will be removed
   This action cannot be undone.

Are you sure you want to proceed with the complete cleanup? (y/N):
```

### Progress Logging

Scripts provide detailed progress information:

- Object/entity counts
- Batch processing status
- Success/error summaries
- Detailed error reporting

### Error Handling

- Comprehensive error catching and reporting
- Batch operation failures don't stop entire process
- Rollback guidance when partial failures occur
- Exit codes for automation

## Examples

### Local Development

```bash
# Set environment variables
export S3_BUCKET=local-pornspot-media
export DYNAMODB_TABLE=dev-pornspot-media
export AWS_REGION=us-east-1

# Run dry run first
npm run cleanup:thumbnails:all -- --dry-run

# If results look good, run actual cleanup
npm run cleanup:thumbnails:all
```

### Production

```bash
# Use environment variables from your deployment
npm run cleanup:thumbnails:all -- --dry-run

# Confirm results, then run cleanup
npm run cleanup:thumbnails:all
```

### Incremental Cleanup

```bash
# Clean S3 first
npm run cleanup:thumbnails:s3

# Verify S3 cleanup, then clean database
npm run cleanup:thumbnails:db
```

## Error Recovery

### S3 Cleanup Failed

If S3 cleanup fails but you need to proceed:

```bash
# Skip S3 and only clean database
npm run cleanup:thumbnails:all -- --skip-s3
```

### Database Cleanup Failed

If database cleanup fails but S3 succeeded:

```bash
# Skip S3 and retry database
npm run cleanup:thumbnails:all -- --skip-s3
```

### Complete Failure

If both operations fail:

1. Check AWS credentials and permissions
2. Verify environment variables
3. Check network connectivity
4. Run individual scripts with `--dry-run` to diagnose

## Output Examples

### S3 Cleanup Output

```
🚀 S3 Thumbnail Cleanup Script
📅 2024-01-15T10:30:00.000Z
🪣 S3 Bucket: my-bucket
🌍 AWS Region: us-east-1
🧪 Dry Run: NO

🔍 Scanning S3 bucket for thumbnail objects...
   Found 150 thumbnails in this batch
   Found 89 thumbnails in this batch
📊 Total thumbnail objects found: 239

📋 Thumbnail Objects Summary:
   Objects in /thumbnails/ directories: 180
   Objects with _thumb_small suffix: 59
   Objects with _thumb_medium suffix: 59
   Objects with _thumb_large suffix: 59
   Total size: 45.67 MB
   Total objects: 239

🗑️  Deleting 239 thumbnail objects...
   Processing batch 1/1 (239 objects)
   ✅ Successfully deleted 239 objects

📊 Cleanup Results:
   Objects processed: 239
   Successfully deleted: 239
   Errors: 0

✅ S3 thumbnail cleanup completed successfully!
```

### Database Cleanup Output

```
🚀 DynamoDB Thumbnail Cleanup Script
📅 2024-01-15T10:35:00.000Z
📋 DynamoDB Table: my-table
🌍 AWS Region: us-east-1
🧪 Dry Run: NO

🔍 Scanning DynamoDB for Media entities...
   Found 45 media entities in this batch (125 total scanned)
   Found 32 media entities in this batch (189 total scanned)
📊 Total Media entities found: 77

📋 Media Entities Analysis:
   Total entities: 77
   With thumbnailUrl field: 45
   With thumbnailUrls field: 32
   With both fields: 18
   Without thumbnail fields: 18

📊 Status Distribution:
   uploaded: 45
   processing: 15
   failed: 17

🎯 Entities needing update: 59

🔄 Processing 59 media entities...
   Processing batch 1/3 (25 entities)
   ✅ Completed batch 1: 25 entities processed
   Processing batch 2/3 (25 entities)
   ✅ Completed batch 2: 25 entities processed
   Processing batch 3/3 (9 entities)
   ✅ Completed batch 3: 9 entities processed

📊 Cleanup Results:
   Entities processed: 59
   Successfully updated: 59
   Errors: 0

✅ DynamoDB thumbnail cleanup completed successfully!
```

## Next Steps

After running these cleanup scripts:

1. ✅ All old thumbnail files removed from S3
2. ✅ All thumbnail references removed from database
3. ✅ Media entities reset to "uploaded" status
4. 🚀 Ready to implement new 5-size thumbnail system

The new system should generate thumbnails with these specifications:

- **cover**: 128px (for album covers)
- **small**: 240px (for grid thumbnails)
- **medium**: 300px (for lightbox previews)
- **large**: 365px (for detail views)
- **xlarge**: 600px (for high-quality display)
