# Deployment Guide

This guide explains how to deploy the pornspot Art application to multiple environments (dev, staging, prod).

## Overview

The project supports three environments:

- **Development (dev)**: For development and testing
- **Staging**: For pre-production testing and validation
- **Production (prod)**: For live users

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. AWS SAM CLI installed
3. Node.js and npm installed
4. A Vercel account (https://vercel.com) for frontend deployment
5. Backend infrastructure deployed to target environment

## Backend Deployment

### Albums Backend Migration Steps

When deploying the new albums backend logic:

1. **Deploy the new GSI:** Add the `isPublic-createdAt-index` to your DynamoDB table.
2. **Run the backfill script:** Before routing any user traffic to the new albums endpoint logic, run [`backend/scripts/backfill-isPublic.ts`](../backend/scripts/backfill-isPublic.ts:1) to set the `isPublic` field for all legacy album records. This script will update only those albums missing the attribute, defaulting them to `true`.
3. **Route traffic:** Once the backfill script has completed, it is safe to route traffic to the new `/albums` endpoint logic that depends on the `isPublic` attribute and the GSI.

---

### Using the Deploy Script

The [`scripts/deploy.sh`](scripts/deploy.sh) script supports environment-specific deployments:

```bash
# Deploy to development (default)
./scripts/deploy.sh

# Deploy to staging
./scripts/deploy.sh --env staging

# Deploy to production with guided setup
./scripts/deploy.sh --env prod --guided

# Show help
./scripts/deploy.sh --help
```

### Manual SAM Deployment

You can also deploy manually using SAM CLI:

```bash
# Build the application
sam build

# Deploy to specific environment
sam deploy --config-env dev     # Development
sam deploy --config-env staging # Staging
sam deploy --config-env prod    # Production
```

### Production Deployment via npm

For deploying the backend to **production**, you can simply run the following npm script from the project root:

```bash
npm run deploy:backend:prod
```

This command will build and deploy the backend to the production environment using the correct parameters.

### Environment Configuration

Each environment has its own configuration in [`samconfig.toml`](samconfig.toml):

- **dev**: `pornspot-ai-dev` stack
- **staging**: `pornspot-ai-staging` stack
- **prod**: `pornspot-ai-prod` stack

## Frontend Deployment

### Using the Frontend Deploy Script

The [`scripts/deploy-frontend.sh`](scripts/deploy-frontend.sh) script helps prepare and validate your frontend before deployment:

```bash
# Prepare for production deployment
./scripts/deploy-frontend.sh --env prod --type production

# Prepare for staging preview
./scripts/deploy-frontend.sh --env staging

# Prepare for development preview
./scripts/deploy-frontend.sh --env dev

# Show help
./scripts/deploy-frontend.sh --help
```

### Vercel Setup

#### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect this as a Next.js project

#### 2. Configure Project Settings

In the Vercel project settings:

- **Framework Preset**: Next.js
- **Root Directory**: Leave empty (monorepo setup handled by [`vercel.json`](vercel.json))
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `npm install && cd frontend && npm install`

#### 3. Environment-Specific Configuration

Create separate Vercel projects for each environment or use environment-specific variables:

##### Production Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://api.pornspot.ai
NEXT_PUBLIC_CDN_URL=https://your-prod-cloudfront.cloudfront.net
NEXT_PUBLIC_SITE_URL=https://pornspot.ai
NODE_ENV=production
```

##### Staging Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://staging-api.pornspot.ai
NEXT_PUBLIC_CDN_URL=https://staging-cloudfront.cloudfront.net
NEXT_PUBLIC_SITE_URL=https://staging.pornspot.ai
NODE_ENV=production
```

##### Development Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://dev-api.pornspot.ai
NEXT_PUBLIC_CDN_URL=https://dev-cloudfront.cloudfront.net
NEXT_PUBLIC_SITE_URL=https://dev.pornspot.ai
NODE_ENV=development
```

#### 4. Domain Configuration

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain(s):
   - Production: `pornspot.ai`
   - Staging: `staging.pornspot.ai`
   - Development: `dev.pornspot.ai`
3. Configure DNS records as instructed by Vercel

#### 5. Deploy

```bash
# For preview deployments
vercel

# For production deployment
vercel --prod
```

Or use automatic deployments:

- **Production**: Push to `main` branch
- **Preview**: Create pull requests or push to feature branches

## Environment-Specific Deployment Workflows

### Development Workflow

1. **Backend Deployment**:

   ```bash
   ./scripts/deploy.sh --env dev
   ```

2. **Frontend Deployment**:

   ```bash
   ./scripts/deploy-frontend.sh --env dev
   vercel  # Deploy to preview
   ```

3. **Testing**: Use development URLs for testing new features

### Staging Workflow

1. **Backend Deployment**:

   ```bash
   ./scripts/deploy.sh --env staging
   ```

2. **Frontend Deployment**:

   ```bash
   ./scripts/deploy-frontend.sh --env staging
   vercel  # Deploy to staging preview
   ```

3. **Testing**: Comprehensive testing before production release

### Production Workflow

1. **Backend Deployment**:

   ```bash
   ./scripts/deploy.sh --env prod --guided  # Use guided for safety
   ```

2. **Frontend Deployment**:

   ```bash
   ./scripts/deploy-frontend.sh --env prod --type production
   vercel --prod  # Deploy to production
   ```

3. **Monitoring**: Monitor logs and performance after deployment

## Post-Deployment Configuration

### Update Backend CORS

Ensure your backend API allows requests from all environment domains:

```javascript
// In your backend CORS configuration
const allowedOrigins = [
  "https://pornspot.ai", // Production
  "https://staging.pornspot.ai", // Staging
  "https://dev.pornspot.ai", // Development
  "https://your-vercel-previews.vercel.app", // Vercel previews
];
```

### Update CloudFront Domains

Update the [`frontend/next.config.js`](frontend/next.config.js) image domains with your actual CloudFront domains:

```javascript
images: {
  domains: [
    "your-prod-cloudfront.cloudfront.net",
    "your-staging-cloudfront.cloudfront.net",
    "your-dev-cloudfront.cloudfront.net"
  ],
  // ...
}
```

## Environment Characteristics

### Development Environment

- **Purpose**: Feature development and initial testing
- **Stack**: `pornspot-ai-dev`
- **Domain**: `dev.pornspot.ai`
- **Data**: Test data, can be reset frequently
- **Monitoring**: Basic logging

### Staging Environment

- **Purpose**: Pre-production testing and validation
- **Stack**: `pornspot-ai-staging`
- **Domain**: `staging.pornspot.ai`
- **Data**: Production-like test data
- **Monitoring**: Enhanced logging and monitoring

### Production Environment

- **Purpose**: Live application for end users
- **Stack**: `pornspot-ai-prod`
- **Domain**: `pornspot.ai`
- **Data**: Live user data
- **Monitoring**: Full monitoring, alerting, and backup strategies

## Monitoring and Analytics

### Environment-Specific Monitoring

- **Development**: Basic console logging
- **Staging**: Enhanced logging with performance metrics
- **Production**: Full monitoring stack with alerting

### Vercel Analytics

Enable Vercel Analytics in your project settings for performance monitoring across all environments.

### Error Tracking

Consider integrating error tracking services like Sentry with environment-specific configurations.

## Troubleshooting

### Common Issues

1. **CloudFormation Stack in ROLLBACK_COMPLETE State**

   When you see the error: `Stack is in ROLLBACK_COMPLETE state and can not be updated`, you have two options:

   **Option 1: Continue Rollback (Recommended first try)**

   ```bash
   ./scripts/continue-rollback.sh --env prod
   ```

   This attempts to continue the rollback and get the stack back to a stable state without data loss.

   **Option 2: Delete and Recreate Stack**

   ```bash
   ./scripts/fix-rollback-stack.sh --env prod
   ```

   ⚠️ **WARNING**: This will delete all data in the stack (DynamoDB, S3, etc.)

   **Manual Alternative**:

   ```bash
   # Continue rollback manually
   aws cloudformation continue-update-rollback --stack-name pornspot-ai-prod
   aws cloudformation wait stack-rollback-complete --stack-name pornspot-ai-prod

   # Or delete and recreate manually
   aws cloudformation delete-stack --stack-name pornspot-ai-prod
   aws cloudformation wait stack-delete-complete --stack-name pornspot-ai-prod
   ./scripts/deploy.sh --env prod
   ```

2. **Environment Configuration Errors**

   - Verify [`samconfig.toml`](samconfig.toml) contains all environment sections
   - Check environment variables match the target environment
   - Ensure stack names are unique per environment

3. **Build Failures**

   - Check environment variables are set correctly in Vercel
   - Ensure all dependencies are listed in [`package.json`](package.json)
   - Review build logs in Vercel Dashboard
   - Verify the correct environment file is being used

4. **API Connection Issues**

   - Verify `NEXT_PUBLIC_API_URL` matches the deployed backend environment
   - Check CORS configuration allows the frontend domain
   - Ensure API Gateway is accessible and deployed to correct environment

5. **Image Loading Issues**
   - Verify `NEXT_PUBLIC_CDN_URL` points to the correct CloudFront distribution
   - Check CloudFront domain in [`frontend/next.config.js`](frontend/next.config.js)
   - Ensure images exist in the environment-specific S3 bucket

### Deployment Script Issues

1. **Permission Errors**

   ```bash
   chmod +x scripts/deploy.sh
   chmod +x scripts/deploy-frontend.sh
   ```

2. **AWS Configuration**

   ```bash
   aws configure list  # Verify AWS credentials
   aws sts get-caller-identity  # Check current AWS identity
   ```

3. **SAM Configuration**
   ```bash
   sam --version  # Ensure SAM CLI is installed
   ```

## Best Practices

### Environment Management

1. **Isolation**: Keep environments completely isolated
2. **Data**: Use separate databases and S3 buckets per environment
3. **Secrets**: Use environment-specific secrets and API keys
4. **Monitoring**: Implement appropriate monitoring for each environment level

### Deployment Safety

1. **Staging First**: Always deploy to staging before production
2. **Guided Production**: Use `--guided` flag for production deployments
3. **Rollback Plan**: Have a rollback strategy for production issues
4. **Testing**: Run comprehensive tests in staging environment

### Security Considerations

1. **Environment Variables**

   - Never commit sensitive data to repository
   - Use Vercel's environment variable system per environment
   - Prefix public variables with `NEXT_PUBLIC_`
   - Use different API keys/secrets per environment

2. **Access Control**

   - Limit production access to authorized personnel
   - Use IAM roles with least privilege principle
   - Enable MFA for production AWS accounts

3. **Headers and CORS**
   - Security headers are configured in [`frontend/next.config.js`](frontend/next.config.js)
   - CORS is handled by the backend API with environment-specific origins
   - CSP headers can be added if needed

## Continuous Deployment

### Automated Deployments

Vercel automatically deploys:

- **Production**: When code is pushed to `main` branch
- **Preview**: For pull requests and feature branches

### Recommended Git Workflow

1. **Feature Development**: Create feature branches, deploy to dev environment
2. **Staging**: Merge to `staging` branch, deploy to staging environment
3. **Production**: Merge to `main` branch, deploy to production

### Branch Protection

Configure branch protection rules in your Git repository:

- Require pull request reviews for `main` branch
- Require status checks to pass (tests, linting)
- Require branches to be up to date before merging

## Quick Reference

### Deploy Commands

```bash
# Backend deployments
./scripts/deploy.sh --env dev
./scripts/deploy.sh --env staging
./scripts/deploy.sh --env prod --guided

# Frontend preparation
./scripts/deploy-frontend.sh --env dev
./scripts/deploy-frontend.sh --env staging
./scripts/deploy-frontend.sh --env prod --type production

# Vercel deployments
vercel                    # Preview deployment
vercel --prod            # Production deployment
```

### Environment Files

- [`.env.development`](.env.development) - Development environment variables
- [`.env.staging`](.env.staging) - Staging environment variables
- [`.env.production`](.env.production) - Production environment variables

### Configuration Files

- [`samconfig.toml`](samconfig.toml) - SAM deployment configuration
- [`vercel.json`](vercel.json) - Vercel project configuration
- [`template.yaml`](template.yaml) - AWS SAM template
