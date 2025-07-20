# GSI3 Index Migration Guide

## Problem

The Google OAuth authentication was failing with the error:

```
ValidationException: The table does not have the specified index: GSI3
```

## Root Cause

The GSI3 index was missing from the DynamoDB table configuration. While the code was expecting and using GSI3 for username-based user queries, the actual table definition in `template.yaml` and local setup scripts only included GSI1 and GSI2.

## Solution

Added the missing GSI3 index with the following configuration:

### GSI3 Index Details

- **Purpose**: Query users by username
- **Partition Key (GSI3PK)**: `"USER_USERNAME"`
- **Sort Key (GSI3SK)**: `{username}` (lowercase)

### Files Updated

1. **`template.yaml`**: Added GSI3PK/GSI3SK attribute definitions and GSI3 index
2. **`scripts/setup-local-db.js`**: Added GSI3 configuration for local development
3. **`scripts/create-dynamodb-table.js`**: Added GSI3 configuration for local development

## Migration Steps

### For Production Environment

1. **Deploy the updated CloudFormation template**:

   ```bash
   sam deploy --config-env prod
   ```

   **Note**: Adding a GSI to an existing DynamoDB table is a non-breaking change. DynamoDB will automatically backfill the index with existing data.

2. **Verify the index creation**:
   ```bash
   aws dynamodb describe-table --table-name prod-pornspot-media --query 'Table.GlobalSecondaryIndexes[?IndexName==`GSI3`]'
   ```

### For Development Environment

1. **For local development**, recreate the local table:

   ```bash
   cd scripts
   # Delete the existing table first (if using LocalStack)
   aws dynamodb delete-table --table-name local-pornspot-media --endpoint-url http://localhost:4566

   # Recreate with the new schema
   node setup-local-db.js
   ```

2. **For staging environment**:
   ```bash
   sam deploy --config-env staging
   ```

### Verification

After deployment, verify that GSI3 exists and is active:

```bash
aws dynamodb describe-table --table-name {environment}-pornspot-media \
  --query 'Table.GlobalSecondaryIndexes[?IndexName==`GSI3`].{IndexName:IndexName,IndexStatus:IndexStatus}'
```

Expected output:

```json
[
  {
    "IndexName": "GSI3",
    "IndexStatus": "ACTIVE"
  }
]
```

## Impact

- **Users**: Google OAuth login will now work correctly
- **Performance**: Username-based queries will be efficient
- **Breaking Changes**: None - this is purely additive

## Related Code

The GSI3 index is used by:

- `backend/shared/utils/dynamodb.ts` - `getUserByUsername()` function
- `backend/shared/utils/user.ts` - User creation with username indexing
- `backend/functions/user/auth/check-username.ts` - Username availability checking

## Testing

After migration, test the following scenarios:

1. Google OAuth login for new users
2. Google OAuth login for existing users
3. Username availability checking
4. User creation with email/password

```bash
# Test Google OAuth flow
curl -X POST https://api.your-domain.com/user/auth/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code","state":"test_state"}'
```
