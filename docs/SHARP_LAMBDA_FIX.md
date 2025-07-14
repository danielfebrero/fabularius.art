# Sharp Module Lambda Deployment Fix

## Problem

The Sharp image processing library requires platform-specific native binaries. When developing on macOS and deploying to AWS Lambda (Linux x64), the Sharp module fails with the error:

```
Cannot find module '../build/Release/sharp-linux-x64.node'
```

This happens because Sharp was compiled for macOS but Lambda runs on Linux x64.

## Solution

### 1. Dynamic Loading

The `ThumbnailService` now uses dynamic imports to load Sharp with proper error handling:

```typescript
// Dynamically import Sharp to handle platform-specific binaries
let sharp: typeof import("sharp");

const loadSharp = async () => {
  if (!sharp) {
    try {
      sharp = (await import("sharp")).default;
      console.log("Sharp module loaded successfully");
    } catch (error) {
      // Detailed error logging
      throw new Error("Sharp module not available...");
    }
  }
  return sharp;
};
```

### 2. Platform-Specific Installation

Added npm scripts to handle Sharp installation for different environments:

```json
{
  "scripts": {
    "build:lambda": "npm run install-sharp-lambda && npm run build",
    "install-sharp-lambda": "npm uninstall sharp && npm install --platform=linux --arch=x64 sharp",
    "install-sharp-dev": "npm uninstall sharp && npm install sharp"
  }
}
```

### 3. Updated Deployment Process

The deployment script now:

1. Installs Sharp for Linux x64 before building
2. Builds the TypeScript code
3. Deploys to Lambda
4. Restores Sharp for local development

### 4. Lambda Function Configuration

Updated the SAM template with:

- Increased memory to 1024MB (Sharp is memory-intensive)
- Increased timeout to 60 seconds
- Added proper S3 permissions

## Usage

### For Deployment

```bash
./scripts/deploy.sh --env dev
```

The deployment script handles Sharp installation automatically.

### For Local Development

If you need to manually restore Sharp for local development:

```bash
./scripts/restore-dev-sharp.sh
```

Or use the npm script:

```bash
cd backend && npm run install-sharp-dev
```

### Manual Sharp Installation

If needed, you can manually install Sharp for specific platforms:

```bash
# For Lambda (Linux x64)
npm install --platform=linux --arch=x64 sharp

# For local development (auto-detects platform)
npm install sharp
```

## Testing

To test thumbnail generation locally:

1. Ensure you have the correct Sharp version: `npm run install-sharp-dev`
2. Run your tests or start the local development server

To test deployment:

1. Deploy using the updated script: `./scripts/deploy.sh`
2. The script will automatically handle Sharp installation and restoration

## Troubleshooting

### Error: "Sharp module not available"

1. Check that Sharp is installed for the correct platform
2. Verify Lambda function has enough memory (1024MB recommended)
3. Check CloudWatch logs for detailed error information

### Local Development Issues

1. Run `npm run install-sharp-dev` to restore local Sharp
2. Clear node_modules and reinstall if issues persist

### Deployment Issues

1. Ensure the deploy script completed successfully
2. Check that `build:lambda` script ran without errors
3. Verify Lambda function configuration in SAM template
