# Deployment Scripts

This directory contains scripts for deploying the pornspot Art application to different environments.

## Scripts Overview

### [`deploy.sh`](deploy.sh)

Main backend deployment script that supports multiple environments (dev, staging, prod).

**Usage:**

```bash
./scripts/deploy.sh [OPTIONS]

Options:
  -e, --env ENVIRONMENT    Target environment (dev, staging, prod) [default: dev]
  -g, --guided            Run guided deployment (interactive)
  -h, --help              Show help message

Examples:
  ./scripts/deploy.sh                      # Deploy to dev environment
  ./scripts/deploy.sh --env staging        # Deploy to staging environment
  ./scripts/deploy.sh --env prod --guided  # Deploy to production with guided setup
```

**Features:**

- Environment validation and safety checks
- Production deployment confirmation
- Automatic dependency installation
- SAM build and deployment
- Environment-specific stack naming
- API Gateway URL extraction

### [`deploy-frontend.sh`](deploy-frontend.sh)

Frontend preparation and deployment script for Vercel.

**Usage:**

```bash
./scripts/deploy-frontend.sh [OPTIONS]

Options:
  -e, --env ENVIRONMENT    Target environment (dev, staging, prod) [default: prod]
  -t, --type TYPE         Deployment type (preview, production) [default: preview]
  -h, --help              Show help message

Examples:
  ./scripts/deploy-frontend.sh                           # Deploy to preview (staging)
  ./scripts/deploy-frontend.sh --env prod --type production  # Deploy to production
  ./scripts/deploy-frontend.sh --env staging             # Deploy staging to preview
```

**Features:**

- Pre-deployment validation (type checking, linting, tests)
- Environment-specific configuration guidance
- Production deployment safety checks
- Vercel CLI integration
- Environment variable documentation

### [`fix-rollback-stack.sh`](fix-rollback-stack.sh)

Fixes CloudFormation stacks stuck in ROLLBACK_COMPLETE state by deleting and recreating them.

**Usage:**

```bash
./scripts/fix-rollback-stack.sh [OPTIONS]

Options:
  -e, --env ENVIRONMENT    Target environment (dev, staging, prod) [default: prod]
  -f, --force             Force delete without confirmation
  -h, --help              Show help message

Examples:
  ./scripts/fix-rollback-stack.sh                    # Fix prod stack (with confirmation)
  ./scripts/fix-rollback-stack.sh --env staging      # Fix staging stack
  ./scripts/fix-rollback-stack.sh --force            # Force delete prod stack without confirmation
```

**Features:**

- Checks if the stack is in ROLLBACK_COMPLETE state
- Deletes the stack after confirmation (⚠️ **DATA LOSS**)
- Redeploys the stack using the deploy script
- **WARNING**: This will delete all data in DynamoDB tables and S3 buckets

### [`continue-rollback.sh`](continue-rollback.sh)

Attempts to continue update rollback for CloudFormation stacks in ROLLBACK_COMPLETE state without data loss.

**Usage:**

```bash
./scripts/continue-rollback.sh [OPTIONS]

Options:
  -e, --env ENVIRONMENT    Target environment (dev, staging, prod) [default: prod]
  -h, --help              Show help message

Examples:
  ./scripts/continue-rollback.sh                     # Continue rollback for prod stack
  ./scripts/continue-rollback.sh --env staging       # Continue rollback for staging stack
```

**Features:**

- Checks if the stack is in ROLLBACK_COMPLETE state
- Continues the update rollback to get stack back to stable state
- Redeploys the stack using the deploy script
- **Recommended first approach** as it preserves data

## Environment Support

Both scripts support three environments:

### Development (`dev`)

- **Purpose**: Feature development and initial testing
- **Backend Stack**: `pornspot-ai-dev`
- **Frontend Domain**: `dev.pornspot.ai`
- **Safety Level**: Low (quick iterations)

### Staging (`staging`)

- **Purpose**: Pre-production testing and validation
- **Backend Stack**: `pornspot-ai-staging`
- **Frontend Domain**: `staging.pornspot.ai`
- **Safety Level**: Medium (comprehensive testing)

### Production (`prod`)

- **Purpose**: Live application for end users
- **Backend Stack**: `pornspot-ai-prod`
- **Frontend Domain**: `pornspot.ai`
- **Safety Level**: High (confirmation prompts, guided deployment)

## Prerequisites

### Backend Deployment

- AWS CLI configured with appropriate permissions
- AWS SAM CLI installed
- Node.js and npm installed
- Valid [`samconfig.toml`](../samconfig.toml) configuration

### Frontend Deployment

- Vercel CLI installed (or will be installed automatically)
- Backend API deployed and accessible
- Environment variables configured in Vercel dashboard

## Safety Features

### Production Safeguards

- Confirmation prompts for production deployments
- Guided deployment option for production
- Environment validation before deployment
- Clear warnings for destructive operations

### Validation Checks

- Dependency verification
- Configuration file validation
- Environment variable checks
- Pre-deployment testing (frontend)

## Integration with CI/CD

These scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Deploy Backend to Staging
  run: ./scripts/deploy.sh --env staging

- name: Prepare Frontend for Production
  run: ./scripts/deploy-frontend.sh --env prod --type production
```

## Troubleshooting

### Common Issues

1. **CloudFormation Stack in ROLLBACK_COMPLETE State**

   When you see the error: `Stack is in ROLLBACK_COMPLETE state and can not be updated`:

   **Option 1: Continue Rollback (Recommended first try)**

   ```bash
   ./scripts/continue-rollback.sh --env prod
   ```

   **Option 2: Delete and Recreate Stack**

   ```bash
   ./scripts/fix-rollback-stack.sh --env prod
   ```

   ⚠️ **WARNING**: This will delete all data in the stack

2. **Permission Denied**

   ```bash
   chmod +x scripts/deploy.sh
   chmod +x scripts/deploy-frontend.sh
   chmod +x scripts/fix-rollback-stack.sh
   chmod +x scripts/continue-rollback.sh
   ```

3. **AWS Configuration Issues**

   ```bash
   aws configure list
   aws sts get-caller-identity
   ```

4. **SAM CLI Issues**

   ```bash
   sam --version
   sam build --help
   ```

5. **Node.js/npm Issues**
   ```bash
   node --version
   npm --version
   ```

### Getting Help

Run any script with the `--help` flag to see detailed usage information:

```bash
./scripts/deploy.sh --help
./scripts/deploy-frontend.sh --help
```

## Related Documentation

- [Main Deployment Guide](../DEPLOYMENT.md) - Comprehensive deployment documentation
- [SAM Configuration](../samconfig.toml) - Environment-specific SAM settings
- [Vercel Configuration](../vercel.json) - Frontend deployment settings
- [AWS SAM Template](../template.yaml) - Infrastructure as Code definition

### [`repair-thumbnails.js`](repair-thumbnails.js)

Batch script to generate missing thumbnails for existing media files in the database.

**Usage:**

```bash
npm run repair:thumbnails [OPTIONS]

Options:
  --dry-run           Show what would be processed without making changes
  --limit NUMBER      Limit the number of items to process [default: 100]
  --batch-size NUMBER Number of items to process concurrently [default: 5]

Examples:
  npm run repair:thumbnails                    # Process up to 100 items with default settings
  npm run repair:thumbnails --dry-run          # Preview what would be processed
  npm run repair:thumbnails --limit 50         # Process only 50 items
  npm run repair:thumbnails --batch-size 3     # Process 3 items concurrently
```

**Features:**

- Generates all three thumbnail sizes (small: 300x300, medium: 600x600, large: 1200x1200)
- Downloads original images from S3, creates thumbnails, and uploads them back
- Updates DynamoDB records with thumbnail URLs and processing status
- Concurrent processing with configurable batch size
- Comprehensive error handling and logging
- Dry-run mode for safe testing
- Progress reporting and performance metrics

**Prerequisites:**

- AWS CLI configured with appropriate permissions
- Access to the S3 bucket containing original images
- DynamoDB read/write permissions for media table
- Node.js environment with required dependencies

**How It Works:**

1. Scans DynamoDB for media items without thumbnail URLs or with "pending" status
2. Downloads original images from S3
3. Generates three thumbnail sizes using Sharp image processing
4. Uploads thumbnails to S3 in organized folder structure
5. Updates DynamoDB records with thumbnail URLs and "uploaded" status
6. Provides detailed logging and error reporting

**Monitoring:**

```bash
# Monitor the script output for:
- Number of items processed
- Success/failure rates
- Processing time per item
- Any errors or warnings
```

**Production Considerations:**

- Start with a small limit (--limit 10) to test in production
- Monitor AWS costs during large batch operations
- Use appropriate batch-size based on available memory and network
- Consider running during off-peak hours for large datasets
