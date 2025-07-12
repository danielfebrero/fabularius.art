# Vercel Deployment Guide

This guide explains how to deploy the Fabularius Art frontend to Vercel.

## Prerequisites

1. A Vercel account (https://vercel.com)
2. The backend API deployed and accessible
3. CloudFront CDN configured for media assets

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect this as a Next.js project

### 2. Configure Project Settings

In the Vercel project settings:

- **Framework Preset**: Next.js
- **Root Directory**: Leave empty (monorepo setup handled by vercel.json)
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `npm install && cd frontend && npm install`

### 3. Environment Variables

Add the following environment variables in Vercel Dashboard → Settings → Environment Variables:

#### Production Environment Variables

```
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
NEXT_PUBLIC_CDN_URL=https://your-cloudfront-domain.cloudfront.net
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production
```

#### Optional Environment Variables

```
GOOGLE_SITE_VERIFICATION=your-google-site-verification-code
```

### 4. Domain Configuration

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel

### 5. Deploy

1. Push your code to the main branch
2. Vercel will automatically deploy
3. Monitor the deployment in the Vercel Dashboard

## Post-Deployment Configuration

### Update Backend CORS

Ensure your backend API allows requests from your Vercel domain:

```javascript
// In your backend CORS configuration
const allowedOrigins = [
  "https://your-vercel-domain.vercel.app",
  "https://your-custom-domain.com",
];
```

### Update CloudFront Domain

Update the `next.config.js` image domains with your actual CloudFront domain:

```javascript
images: {
  domains: [
    "your-actual-cloudfront-domain.cloudfront.net"
  ],
  // ...
}
```

## Environment-Specific Configurations

### Development

- Uses local API endpoints
- Mock data for testing

### Production

- Uses production API Gateway
- CloudFront CDN for media
- Optimized builds and caching

## Monitoring and Analytics

### Vercel Analytics

Enable Vercel Analytics in your project settings for performance monitoring.

### Error Tracking

Consider integrating error tracking services like Sentry for production monitoring.

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check environment variables are set correctly
   - Ensure all dependencies are listed in package.json
   - Review build logs in Vercel Dashboard

2. **API Connection Issues**

   - Verify NEXT_PUBLIC_API_URL is correct
   - Check CORS configuration on backend
   - Ensure API Gateway is accessible

3. **Image Loading Issues**
   - Verify NEXT_PUBLIC_CDN_URL is correct
   - Check CloudFront domain in next.config.js
   - Ensure images exist in S3 bucket

### Performance Optimization

1. **Image Optimization**

   - Use Next.js Image component
   - Configure proper image domains
   - Enable WebP/AVIF formats

2. **Caching**
   - Leverage Vercel's Edge Network
   - Configure proper cache headers
   - Use static generation where possible

## Security Considerations

1. **Environment Variables**

   - Never commit sensitive data to repository
   - Use Vercel's environment variable system
   - Prefix public variables with NEXT*PUBLIC*

2. **Headers**
   - Security headers are configured in next.config.js
   - CORS is handled by the backend API
   - CSP headers can be added if needed

## Continuous Deployment

Vercel automatically deploys:

- **Production**: When code is pushed to main branch
- **Preview**: For pull requests and other branches

Configure branch protection rules in your Git repository for additional safety.
