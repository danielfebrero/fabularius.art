# Deployment Scripts

This directory contains scripts for deploying the Fabularius Art application to different environments.

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

## Environment Support

Both scripts support three environments:

### Development (`dev`)

- **Purpose**: Feature development and initial testing
- **Backend Stack**: `fabularius-art-dev`
- **Frontend Domain**: `dev.fabularius.art`
- **Safety Level**: Low (quick iterations)

### Staging (`staging`)

- **Purpose**: Pre-production testing and validation
- **Backend Stack**: `fabularius-art-staging`
- **Frontend Domain**: `staging.fabularius.art`
- **Safety Level**: Medium (comprehensive testing)

### Production (`prod`)

- **Purpose**: Live application for end users
- **Backend Stack**: `fabularius-art-prod`
- **Frontend Domain**: `fabularius.art`
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

1. **Permission Denied**

   ```bash
   chmod +x scripts/deploy.sh
   chmod +x scripts/deploy-frontend.sh
   ```

2. **AWS Configuration Issues**

   ```bash
   aws configure list
   aws sts get-caller-identity
   ```

3. **SAM CLI Issues**

   ```bash
   sam --version
   sam build --help
   ```

4. **Node.js/npm Issues**
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
