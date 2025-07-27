# DynamoDB Table Backup and Restore

This document describes how to use the DynamoDB table backup and restore functionality for different environments.

## Overview

The backup and restore scripts allow you to:

1. **Dump** DynamoDB table contents to local filesystem for backup purposes
2. **Restore** DynamoDB table contents from local filesystem dumps
3. **Cross-environment restore** - dump from one environment, restore to another
4. **Schema preservation** - automatically create tables with proper schema

## Scripts

### `dump-dynamodb-table.sh`

Dumps DynamoDB table contents to local filesystem.

**Usage:**

```bash
# Dump local environment (default)
./scripts/dump-dynamodb-table.sh

# Dump specific environment
./scripts/dump-dynamodb-table.sh --env=local
./scripts/dump-dynamodb-table.sh --env=dev
./scripts/dump-dynamodb-table.sh --env=staging
./scripts/dump-dynamodb-table.sh --env=prod

# Dump to custom directory
./scripts/dump-dynamodb-table.sh --env=prod --output ./prod-backup

# Show help
./scripts/dump-dynamodb-table.sh --help
```

### `restore-dynamodb-table.sh`

Restores DynamoDB table contents from local filesystem dump.

**Usage:**

```bash
# Restore to local environment (default)
./scripts/restore-dynamodb-table.sh

# Restore to specific environment
./scripts/restore-dynamodb-table.sh --env=local
./scripts/restore-dynamodb-table.sh --env=dev
./scripts/restore-dynamodb-table.sh --env=staging
./scripts/restore-dynamodb-table.sh --env=prod

# Restore from custom directory (cross-environment restore)
./scripts/restore-dynamodb-table.sh --env=local --source ./prod-backup

# Show help
./scripts/restore-dynamodb-table.sh --help
```

## Directory Structure

All environments use a consistent backup directory structure:

### All Environments (local, dev, staging, prod)

- **Default dump location**: `./backups/dynamodb/{environment}/`
- **Table names**: Configured in `/scripts/.env.{environment}` files

### Examples:

- Local environment: `./backups/dynamodb/local/`
- Dev environment: `./backups/dynamodb/dev/`
- Staging environment: `./backups/dynamodb/staging/`
- Prod environment: `./backups/dynamodb/prod/`

## Dump Contents

Each dump creates the following structure:

```
{dump-directory}/
├── table-data.json       # All table items in DynamoDB JSON format
├── table-schema.json     # Complete table schema (keys, indexes, etc.)
├── table-metadata.json   # Table metadata and dump information
└── dump-summary.txt      # Human-readable summary
```

## Environment Configuration

The scripts read table names and AWS configuration from `/scripts/.env.{environment}` files:

### Local Environment (`.env.local`)

```bash
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
LOCAL_AWS_ENDPOINT=http://localhost:4566
DYNAMODB_TABLE=local-pornspot-media
```

### Remote Environments (`.env.dev`, `.env.staging`, `.env.prod`)

```bash
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
DYNAMODB_TABLE=prod-pornspot-media
```

## Examples

### Basic Backup Workflow

```bash
# 1. Dump current local table
./scripts/dump-dynamodb-table.sh --env=local

# 2. Commit dump to repo (optional)
git add backups/
git commit -m "Add DynamoDB table backup"

# 3. Push to remote
git push
```

### Basic Restore Workflow

```bash
# 1. Clone repo or pull latest changes
git pull

# 2. Restore to local environment
./scripts/restore-dynamodb-table.sh --env=local
```

### Cross-Environment Backup/Restore

```bash
# Scenario 1: Copy production data to local development
./scripts/dump-dynamodb-table.sh --env=prod --output ./prod-backup
./scripts/restore-dynamodb-table.sh --env=local --source ./prod-backup

# Scenario 2: Copy staging data to production (be careful!)
./scripts/dump-dynamodb-table.sh --env=staging --output ./staging-backup
./scripts/restore-dynamodb-table.sh --env=prod --source ./staging-backup

# Scenario 3: Create a named backup of production
./scripts/dump-dynamodb-table.sh --env=prod --output ./backups/prod-$(date +%Y%m%d)

# Scenario 4: Restore specific backup to any environment
./scripts/restore-dynamodb-table.sh --env=local --source ./backups/prod-20250127
```

## Key Features

### Schema Preservation

- **Auto-creation**: If target table doesn't exist, it's created from schema
- **Index support**: Preserves Global and Local Secondary Indexes
- **Key schema**: Maintains partition and sort key configuration

### Batch Processing

- **Large tables**: Handles tables with millions of items
- **DynamoDB limits**: Respects 25-item batch write limits
- **Error handling**: Continues processing if individual batches fail

### Cross-Environment Safety

- **Warnings**: Shows clear warnings for cross-environment operations
- **Metadata**: Tracks source environment and table information
- **Verification**: Confirms successful restore operations

### Data Handling

- **Additive restore**: Adds items to existing table (no deletion)
- **JSON format**: Uses standard DynamoDB JSON format
- **Metadata tracking**: Preserves dump date, item counts, source info

## Integration with Start Script

Unlike S3 backups, DynamoDB restore is not automatically integrated into `start-local-backend.sh` because:

1. Table creation/setup is handled by `setup-local-db.js`
2. DynamoDB schema changes may require manual intervention
3. Data restoration is typically a deliberate action

To add auto-restore, you can modify `start-local-backend.sh` to call the restore script after table setup.

## GitIgnore Configuration

Backup directories are ignored by default:

```gitignore
# Backup data
backups/
```

To commit backups to the repository, comment out this line in `.gitignore`.

## Troubleshooting

### LocalStack Not Running

```
[ERROR] LocalStack is not running! Please start LocalStack first.
```

**Solution**: Start LocalStack with `./scripts/start-local-backend.sh`

### Table Not Found

```
[WARNING] Table 'table-name' does not exist. Nothing to dump.
```

**Solution**: Ensure the correct environment and table exists

### Environment File Missing

```
[ERROR] Environment file not found: ./scripts/.env.prod
```

**Solution**: Create the appropriate `.env.{environment}` file with required variables

### Schema Creation Failed

```
[ERROR] Table 'table-name' does not exist and no schema file found to create it
```

**Solution**: Either create the table manually or ensure the dump includes `table-schema.json`

### Cross-Environment Warning

```
[WARNING] Cross-environment restore detected!
[WARNING] Source: prod → Target: local
```

**Note**: This is normal for cross-environment operations. The warning ensures you're aware of the source/target mismatch.

### Batch Write Errors

```
[WARNING] Failed to restore batch, continuing with next batch...
```

**Note**: Individual batch failures are logged but don't stop the overall process. Check final verification results.

## AWS Credentials

### Local Environment

Uses test credentials for LocalStack:

- `AWS_ACCESS_KEY_ID=test`
- `AWS_SECRET_ACCESS_KEY=test`

### Remote Environments

Configure credentials in `.env.{environment}` files or use:

```bash
aws configure
# OR
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

## Tips

1. **Regular Backups**: Run dumps regularly, especially before schema changes
2. **Environment Isolation**: Always specify `--env` for production operations
3. **Test Restores**: Verify restore functionality in development first
4. **Large Tables**: Large tables may take time to dump/restore
5. **Schema Changes**: Test schema compatibility when restoring across environments
6. **Verification**: Always check the final item count after restore operations
7. **Batch Size**: Script automatically handles DynamoDB's 25-item batch limits
