/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization - DISABLED to avoid Vercel costs
  images: {
    unoptimized: true,
    domains: [
      "localhost",
      // Add your CloudFront domain here when deployed
      process.env.NEXT_PUBLIC_CDN_URL?.replace("https://", "") ||
        "dpoieeap5d01g.cloudfront.net",

      "cdn.pornspot.ai",
    ],
    // Removed formats since we're serving unoptimized PNG, MP4, and GIF from CDN
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "pornspot.ai",
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ["lucide-react"],
    outputFileTracingRoot: __dirname,
  },

  // Compression
  compress: true,

  // Power by header
  poweredByHeader: false,
};

module.exports = nextConfig;
