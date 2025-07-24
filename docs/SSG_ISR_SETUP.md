# SSG and ISR Configuration for Homepage

## Overview

The homepage (`/[locale]/page.tsx`) is now configured for Static Site Generation (SSG) with Incremental Static Regeneration (ISR). This means:

- ✅ **Static at build time**: All locale homepages are pre-generated
- ✅ **Fast loading**: Users get instant static content
- ✅ **Auto-revalidation**: Content updates every hour automatically
- ✅ **Manual revalidation**: Can trigger updates without rebuilding
- ✅ **Client-side hydration**: Interactive features work after static load

## How It Works

### 1. Build Time

- `generateStaticParams()` generates static pages for all locales: `/en`, `/fr`, `/de`, etc.
- Each page fetches initial albums data and renders static HTML
- Static files are cached and served instantly

### 2. Runtime

- Users get static HTML immediately (fast initial load)
- React hydrates on client for interactivity
- `DiscoverClient` component handles dynamic features (infinite scroll, filtering)

### 3. Revalidation

Pages can be updated in three ways:

#### A. Automatic Time-based (Current: 1 hour)

```typescript
export const revalidate = 3600; // Every hour
```

#### B. On-demand via API (No rebuild needed!)

```bash
# Revalidate homepage for all locales
curl -X POST "https://yoursite.com/api/revalidate?secret=YOUR_SECRET&type=homepage"

# Revalidate specific tag cache
curl -X POST "https://yoursite.com/api/revalidate?secret=YOUR_SECRET&tag=albums"

# Revalidate specific path
curl -X POST "https://yoursite.com/api/revalidate?secret=YOUR_SECRET&path=/en"
```

#### C. Using the npm script

```bash
cd frontend
npm run revalidate:homepage
```

## Environment Variables Required

```bash
# Required for revalidation API security
REVALIDATE_SECRET=your-secret-key-here

# Your site URL for the revalidation script
NEXT_PUBLIC_SITE_URL=https://pornspot.ai
```

## Benefits

1. **Performance**: Static files load instantly
2. **SEO**: Pre-rendered content is perfect for search engines
3. **Scalability**: Static files can be cached globally
4. **Flexibility**: Content updates without rebuilds
5. **Reliability**: Fallback to static content if API fails

## Development vs Production

### Development (`npm run dev`)

- ISR works but rebuilds on every change
- Revalidation API available at `http://localhost:3000/api/revalidate`

### Production

- Static files served from CDN
- ISR updates happen in background
- Users always get fast static content

## Monitoring

Check revalidation in your deployment logs:

```bash
# Vercel
vercel logs --follow

# Check if revalidation worked
curl https://yoursite.com/api/revalidate?secret=YOUR_SECRET&type=homepage
```

## Troubleshooting

### Pages not updating?

1. Check `REVALIDATE_SECRET` environment variable
2. Verify API endpoint is accessible
3. Check deployment logs for revalidation errors
4. Test with `npm run revalidate:homepage`

### Static generation failing?

1. Ensure your API is accessible during build
2. Check for build-time errors in deployment logs
3. Verify `getAlbums()` function works with `force-cache`

## Next Steps

Consider these optimizations:

1. Add more specific cache tags for granular revalidation
2. Implement webhook-based revalidation when content changes
3. Add monitoring for cache hit rates
4. Consider edge-side includes for more dynamic content
