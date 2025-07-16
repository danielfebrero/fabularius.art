# User Management Guide

This guide explains how to create and manage admin users in the pornspot.ai application across different environments.

## Overview

The application uses a single admin user system where users are stored in DynamoDB with bcrypt-hashed passwords. Admin users have full access to the admin panel for managing albums and media.

## Creating Admin Users

### Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Node.js** installed (v18 or later)
3. **Required npm packages** installed in the backend directory
4. **Proper AWS permissions** for DynamoDB operations

### For Production Environment

#### Step 1: Ensure Infrastructure is Deployed

Make sure your production stack is deployed:

```bash
# Deploy to production
sam deploy --config-env prod

# Or use the deployment script
./scripts/deploy.sh
```

#### Step 2: Install Dependencies

```bash
cd backend
npm install
cd ..
```

#### Step 3: Create Admin User

```bash
node scripts/create-admin-prod.js prod <username> <password>
```

**Example:**

```bash
node scripts/create-admin-prod.js prod admin MySecurePassword123!
```

#### Step 4: Verify Creation

The script will output the admin ID and creation timestamp. Store these credentials securely.

### For Other Environments

#### Development

```bash
node scripts/create-admin-prod.js dev admin DevPassword123!
```

#### Staging

```bash
node scripts/create-admin-prod.js staging admin StagingPassword123!
```

#### Local (using LocalStack)

```bash
node scripts/create-admin.js admin LocalPassword123!
```

## Password Requirements

All passwords must meet these security requirements:

- **Minimum 8 characters** long
- At least **one uppercase letter** (A-Z)
- At least **one lowercase letter** (a-z)
- At least **one number** (0-9)
- At least **one special character** (!@#$%^&\*()\_+-=[]{}|;':"\\,.<>?)

## AWS Permissions Required

The user/role executing the script needs the following DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:Query"],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/*-pornspot-media",
        "arn:aws:dynamodb:*:*:table/*-pornspot-media/index/GSI1"
      ]
    }
  ]
}
```

## Environment Configuration

### Production Setup

1. **Configure AWS Profile:**

   ```bash
   aws configure --profile production
   ```

2. **Set Environment Variables:**

   ```bash
   export AWS_PROFILE=production
   export AWS_REGION=us-east-1
   ```

3. **Verify Access:**
   ```bash
   aws dynamodb describe-table --table-name prod-pornspot-media
   ```

### Table Names by Environment

- **Local:** `local-pornspot-media`
- **Development:** `dev-pornspot-media`
- **Staging:** `staging-pornspot-media`
- **Production:** `prod-pornspot-media`

## Security Best Practices

### For Production

1. **Use Strong Passwords:** Follow the password requirements strictly
2. **Secure Credential Storage:** Store admin credentials in a secure password manager
3. **Limit Access:** Only create admin users when necessary
4. **Regular Rotation:** Consider rotating admin passwords periodically
5. **Audit Trail:** Keep records of when admin users are created

### AWS Security

1. **Use IAM Roles:** Prefer IAM roles over access keys when possible
2. **Principle of Least Privilege:** Grant only necessary DynamoDB permissions
3. **MFA:** Enable MFA on AWS accounts used for production operations
4. **CloudTrail:** Ensure CloudTrail is enabled to log DynamoDB operations

## Troubleshooting

### Common Issues

#### 1. Table Not Found

```
❌ DynamoDB table 'prod-pornspot-media' not found.
```

**Solution:** Ensure the infrastructure is deployed for the target environment.

#### 2. Credentials Error

```
❌ AWS credentials error.
```

**Solution:** Configure AWS credentials properly:

```bash
aws configure
# or
export AWS_PROFILE=your-profile
```

#### 3. Permission Denied

```
❌ User: arn:aws:iam::123456789012:user/username is not authorized to perform: dynamodb:PutItem
```

**Solution:** Add the required DynamoDB permissions to your IAM user/role.

#### 4. Username Already Exists

```
❌ Username already exists
```

**Solution:** Choose a different username or check existing users.

### Verification Commands

#### Check if table exists:

```bash
aws dynamodb describe-table --table-name prod-pornspot-media
```

#### List existing admin users (requires additional permissions):

```bash
aws dynamodb query \
  --table-name prod-pornspot-media \
  --index-name GSI1 \
  --key-condition-expression "GSI1PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"ADMIN_USERNAME"}}'
```

## User Management Operations

### Deactivating Users

Currently, user deactivation must be done through the [`AdminUtil.deactivateAdmin()`](backend/shared/utils/admin.ts:79) method in the backend code.

### Password Updates

Password updates can be performed using the [`AdminUtil.updateAdminPassword()`](backend/shared/utils/admin.ts:52) method.

### Future Enhancements

Consider implementing:

- CLI commands for user management operations
- Web-based admin user management interface
- User role management (if multiple admin levels are needed)
- Session management and logout functionality

## Support

For additional support or questions about user management:

1. Check the application logs in CloudWatch
2. Review the DynamoDB table structure
3. Consult the authentication middleware in [`backend/functions/admin/auth/`](backend/functions/admin/auth/)
