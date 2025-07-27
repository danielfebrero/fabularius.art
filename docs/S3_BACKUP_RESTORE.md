# S3 Bucket Backup and Restore

This document describes how to use the S3 bucket backup and restore functionality for different environments.

## Overview

The backup and restore scripts allow you to:

1. **Dump** S3 bucket contents to local filesystem for backup purposes
2. **Restore** S3 bucket contents from local filesystem dumps
3. **Auto-restore** during local development startup if bucket is empty

## Scripts

### `dump-s3-bucket.sh`

Dumps S3 bucket contents to local filesystem.

**Usage:**

```bash
# Dump local environment (default)
./scripts/dump-s3-bucket.sh

# Dump specific environment
./scripts/dump-s3-bucket.sh --env=local
./scripts/dump-s3-bucket.sh --env=dev
./scripts/dump-s3-bucket.sh --env=staging
./scripts/dump-s3-bucket.sh --env=prod

# Dump to custom directory
./scripts/dump-s3-bucket.sh --env=prod --output ./prod-backup

# Show help
./scripts/dump-s3-bucket.sh --help
```

### `restore-s3-bucket.sh`

Restores S3 bucket contents from local filesystem dump.

**Usage:**

```bash
# Restore to local environment (default)
./scripts/restore-s3-bucket.sh

# Restore to specific environment
./scripts/restore-s3-bucket.sh --env=local
./scripts/restore-s3-bucket.sh --env=dev
./scripts/restore-s3-bucket.sh --env=staging
./scripts/restore-s3-bucket.sh --env=prod

# Restore from custom directory (cross-environment restore)
./scripts/restore-s3-bucket.sh --env=local --source ./prod-backup

# Show help
./scripts/restore-s3-bucket.sh --help
```

## Directory Structure

All environments now use a consistent backup directory structure:

### All Environments (local, dev, staging, prod)

- **Default dump location**: `./backups/s3/{environment}/`
- **Bucket names**:
  - Local: `local-pornspot-media`
  - Others: `{environment}-pornspot-media`

### Examples:

- Local environment: `./backups/s3/local/`
- Dev environment: `./backups/s3/dev/`
- Staging environment: `./backups/s3/staging/`
- Prod environment: `./backups/s3/prod/`

## Dump Contents

Each dump creates the following structure:

```
{dump-directory}/
├── objects/                 # All bucket objects with original directory structure
├── bucket-metadata.json     # Bucket metadata and dump information
├── object-list.json        # Detailed listing of all objects with metadata
└── dump-summary.txt        # Human-readable summary
```

## Auto-Restore Feature

The `start-local-backend.sh` script automatically checks if the local S3 bucket is empty and restores from dump if available:

1. **Start LocalStack** and initialize AWS resources
2. **Check bucket status** - count objects in `local-pornspot-media`
3. **Auto-restore** if:
   - Bucket is empty (0 objects)
   - Dump directory exists: `./backups/s3/local/`
   - Dump contains objects: `./backups/s3/local/objects/`

## Environment Configuration

### Local Environment

- **AWS Endpoint**: `http://localhost:4566` (LocalStack)
- **Credentials**: Test credentials (`test`/`test`)
- **Region**: `us-east-1`

### Remote Environments (dev, staging, prod)

- **AWS Endpoint**: Default AWS endpoints
- **Credentials**: From AWS profile/environment variables
- **Region**: `AWS_REGION` environment variable or `us-east-1`

## Examples

### Basic Backup Workflow

```bash
# 1. Dump current local bucket
./scripts/dump-s3-bucket.sh --env=local

# 2. Commit dump to repo (optional)
git add backups/
git commit -m "Add S3 bucket backup"

# 3. Push to remote
git push
```

### Basic Restore Workflow

```bash
# 1. Clone repo or pull latest changes
git pull

# 2. Start local backend (auto-restores if bucket empty)
./scripts/start-local-backend.sh

# OR manually restore
./scripts/restore-s3-bucket.sh --env=local
```

### Cross-Environment Backup/Restore

```bash
# Scenario 1: Copy production data to local development
./scripts/dump-s3-bucket.sh --env=prod --output ./prod-backup
./scripts/restore-s3-bucket.sh --env=local --source ./prod-backup

# Scenario 2: Copy staging data to production (be careful!)
./scripts/dump-s3-bucket.sh --env=staging --output ./staging-backup
./scripts/restore-s3-bucket.sh --env=prod --source ./staging-backup

# Scenario 3: Create a named backup of production
./scripts/dump-s3-bucket.sh --env=prod --output ./backups/prod-$(date +%Y%m%d)

# Scenario 4: Restore specific backup to any environment
./scripts/restore-s3-bucket.sh --env=local --source ./backups/prod-20250127
```

## GitIgnore Configuration

By default, backup directories are ignored in git:

```gitignore
# LocalStack and S3 backup data
localstack-data/
backups/
```

To commit backups to the repository, comment out these lines in `.gitignore`.

## Troubleshooting

### LocalStack Not Running

```
[ERROR] LocalStack is not running! Please start LocalStack first.
```

**Solution**: Start LocalStack with `./scripts/start-local-backend.sh`

### Bucket Not Found

```
[WARNING] Bucket 'bucket-name' does not exist or is empty. Nothing to dump.
```

**Solution**: Ensure the correct environment and bucket exists

### Cross-Environment Warning

```
[WARNING] Cross-environment restore detected!
[WARNING] Source: prod → Target: local
```

**Note**: This is normal for cross-environment operations. The warning ensures you're aware of the source/target mismatch.

### Directory Not Found

```
[WARNING] Dump directory './some-backup' does not exist. Nothing to restore.
```

**Solution**: Verify the source directory path or create a dump first

### AWS Credentials

For remote environments, ensure AWS credentials are configured:

```bash
aws configure
# OR
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

### Permission Denied

```
[ERROR] Unknown option: --env=local
```

**Solution**: Make scripts executable:

```bash
chmod +x scripts/dump-s3-bucket.sh scripts/restore-s3-bucket.sh
```

## Tips

1. **Regular Backups**: Run dumps regularly to avoid data loss
2. **Environment Isolation**: Always specify `--env` for production operations
3. **Cross-Environment Safety**: Use `--output` and `--source` for explicit cross-environment operations
4. **Named Backups**: Use date-stamped directories for multiple backups (`--output ./backups/prod-$(date +%Y%m%d)`)
5. **Test Restores**: Verify restore functionality in development first
6. **Size Monitoring**: Large buckets may take time to dump/restore
7. **Version Control**: Consider committing critical dumps to the repository
8. **Metadata Tracking**: The scripts automatically track source environment in metadata files
