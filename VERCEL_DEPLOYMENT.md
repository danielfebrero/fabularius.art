# Vercel Deployment Guide

## Environment Variables Required in Vercel Dashboard

The following environment variables must be configured in your Vercel project settings:

### Production Environment Variables

```
NEXT_PUBLIC_API_URL=https://pxw4lhemwi.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_CDN_URL=https://dpoieeap5d01g.cloudfront.net
NEXT_PUBLIC_SITE_URL=https://fabularius.art
NODE_ENV=production
```

## Build Configuration

The project is configured with:

- **Framework**: Next.js 14.2.30
- **Node.js Runtime**: 18.x
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/.next`

## Recent Fixes Applied

1. **TypeScript Configuration**: Simplified strict TypeScript settings that were causing build failures on Vercel
2. **Next.js Version**: Fixed version consistency between package.json and actual runtime
3. **Vercel Configuration**: Removed invalid functions runtime specification that was causing "Function Runtimes must have a valid version" error
4. **Build Cache**: Cleared local build cache to resolve import path issues

## Deployment Steps

1. Ensure all environment variables are set in Vercel dashboard
2. Push changes to your repository
3. Vercel will automatically trigger a new deployment
4. Monitor the build logs for any issues

## Troubleshooting

If the build still fails on Vercel:

1. Check that all environment variables are properly set
2. Verify the Node.js version matches (18.x)
3. Ensure the build works locally with `npm run build`
4. Check Vercel build logs for specific error messages
