# Delete All Comments Script

## Overview

This script deletes ALL comments from the specified environment database. This is a destructive operation that cannot be undone and should be used with extreme caution.

## Usage

### Basic Usage

```bash
# Preview what would be deleted (recommended first step)
npm run delete:comments -- --env=prod --dry-run

# Actually delete all comments (requires confirmation)
npm run delete:comments -- --env=prod --confirm
```

### Environment Options

- `--env=local` - Delete from local database (LocalStack)
- `--env=dev` - Delete from dev environment
- `--env=staging` - Delete from staging environment
- `--env=prod` - Delete from production database

### Safety Options

- `--dry-run` - Preview what would be deleted without actually deleting
- `--confirm` - Actually perform the deletion (required for real deletion)
- `--help, -h` - Show help message

## What This Script Does

1. **Scans Database**: Finds all comment entities (`COMMENT#*`) and comment interactions (`COMMENT_INTERACTION#*`)
2. **Analyzes Data**: Provides detailed breakdown of what will be deleted
3. **Safety Checks**: Requires explicit confirmation for actual deletion
4. **Batch Deletion**: Deletes entities in batches of 25 to respect DynamoDB limits
5. **Count Updates**: Resets comment counts on affected albums and media
6. **Progress Reporting**: Provides detailed progress and error reporting

## Safety Features

### Dry Run Mode

Always test with `--dry-run` first to see what would be deleted:

```bash
npm run delete:comments -- --env=prod --dry-run
```

### Confirmation Prompts

The script requires explicit confirmation for destructive operations:

```
⚠️  WARNING: This will permanently delete ALL comments and interactions!
   This action cannot be undone.
   Environment: PROD
   Comments to delete: 1,234
   Interactions to delete: 567

Are you absolutely sure you want to proceed? (y/N):
```

### Production Protection

Extra confirmation is required for production environment:

```
🚨 PRODUCTION ENVIRONMENT DELETION 🚨
   This will delete ALL comments from the production database!

This is PRODUCTION. Type 'DELETE ALL COMMENTS' to confirm:
```

## Examples

### Local Development

```bash
# Test deletion on local environment
npm run delete:comments -- --env=local --dry-run

# Actually delete from local (for testing)
npm run delete:comments -- --env=local --confirm
```

### Production

```bash
# ALWAYS start with dry-run to see what would be deleted
npm run delete:comments -- --env=prod --dry-run

# Review the output carefully, then proceed with actual deletion
npm run delete:comments -- --env=prod --confirm
```

## Output Example

```
🚀 Delete All Comments Script
📅 2024-01-15T10:30:00.000Z
📋 DynamoDB Table: prod-pornspot-media
🌍 AWS Region: us-east-1
🏷️  Environment: prod
🧪 Dry Run: NO

🔍 Scanning DynamoDB for comment entities...
   Found 45 comments in this batch (45 total scanned)
   Found 32 comments in this batch (77 total scanned)
📊 Total comment entities found: 77

🔍 Scanning DynamoDB for comment interaction entities...
   Found 12 comment interactions in this batch (12 total scanned)
📊 Total comment interaction entities found: 12

📋 Comment Analysis:
   Total comments: 77
   Album comments: 45
   Media comments: 32
   Unique targets affected: 23

📋 Comment Interaction Analysis:
   Total comment interactions: 12

🎯 Total entities to delete: 89

⚠️  WARNING: This will permanently delete ALL comments and interactions!
   This action cannot be undone.
   Environment: PROD
   Comments to delete: 77
   Interactions to delete: 12

🚨 PRODUCTION ENVIRONMENT DELETION 🚨
   This will delete ALL comments from the production database!

Are you absolutely sure you want to proceed? (y/N): y

This is PRODUCTION. Type 'DELETE ALL COMMENTS' to confirm: DELETE ALL COMMENTS

🔄 Deleting 77 comment entities...
   Deleting batch 1/4 (25 entities)
   ✅ Completed batch 1: 25 entities deleted
   Deleting batch 2/4 (25 entities)
   ✅ Completed batch 2: 25 entities deleted
   Deleting batch 3/4 (25 entities)
   ✅ Completed batch 3: 25 entities deleted
   Deleting batch 4/4 (2 entities)
   ✅ Completed batch 4: 2 entities deleted

🔄 Deleting 12 comment interaction entities...
   Deleting batch 1/1 (12 entities)
   ✅ Completed batch 1: 12 entities deleted

🔄 Resetting comment counts for 23 target entities...
✅ Updated comment counts: 23 succeeded, 0 failed

📊 Deletion Results:

💬 Comments:
   Processed: 77
   Successfully deleted: 77
   Errors: 0

👍 Comment Interactions:
   Processed: 12
   Successfully deleted: 12
   Errors: 0

🎯 Total:
   Successfully deleted: 89
   Errors: 0

✅ All comments deleted successfully!
```

## Error Handling

The script includes comprehensive error handling:

- **Batch Failures**: Individual batch failures don't stop the entire process
- **Detailed Reporting**: Specific error messages for failed operations
- **Exit Codes**: Appropriate exit codes for automation
- **Rollback Guidance**: Clear indication if partial failures occur

## Recovery

Since this operation is destructive and cannot be undone:

1. **Always backup** your database before running this script
2. **Test thoroughly** in non-production environments first
3. **Use dry-run** to verify what will be deleted
4. **Consider impact** on user experience and data integrity

## Database Impact

This script affects the following database entities:

- **Comment Records** (`COMMENT#<id>` with `SK: METADATA`)
- **Comment Interactions** (User likes on comments)
- **GSI Entries** (All related GSI entries are automatically cleaned up)
- **Target Counts** (Comment counts on albums and media are reset to 0)

## AWS Permissions Required

The script requires the following AWS permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/prod-pornspot-media",
        "arn:aws:dynamodb:*:*:table/prod-pornspot-media/index/*"
      ]
    }
  ]
}
```

## Integration with Existing Systems

This script follows the same patterns as other database management scripts in the project:

- **Environment Configuration**: Same pattern as other scripts (`create-admin.js`, etc.)
- **Safety Features**: Dry-run and confirmation patterns from cleanup scripts
- **Batch Processing**: Same DynamoDB batch limits and error handling
- **Logging**: Consistent progress reporting and error messages

## When to Use

This script should only be used in specific scenarios:

- **Database Reset**: When completely resetting the comment system
- **Data Migration**: Before migrating to a new comment system
- **Development**: Cleaning test data in non-production environments
- **Compliance**: When required to remove all user comments for legal reasons

## Alternatives

Instead of deleting all comments, consider:

- **Bulk Moderation**: Hide comments instead of deleting them
- **Export First**: Export comments before deletion for backup
- **Selective Deletion**: Delete comments by user, date, or target instead of all
- **Archive**: Move comments to an archive table instead of deletion
