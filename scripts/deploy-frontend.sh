#!/bin/bash

# Frontend Deployment Script for Vercel
# This script helps prepare and deploy the frontend to Vercel

set -e

echo "🚀 Preparing Fabularius Art frontend for Vercel deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd frontend && npm install && cd ..

# Run type checking
echo "🔍 Running type checks..."
cd frontend && npm run type-check && cd ..

# Run linting
echo "🧹 Running linter..."
cd frontend && npm run lint && cd ..

# Run tests
echo "🧪 Running tests..."
cd frontend && npm run test && cd ..

# Build the project locally to check for errors
echo "🏗️  Building project..."
cd frontend && npm run build && cd ..

echo "✅ Pre-deployment checks completed successfully!"
echo ""
echo "🌐 Ready to deploy to Vercel!"
echo ""
echo "Next steps:"
echo "1. Run 'vercel' to deploy to preview"
echo "2. Run 'vercel --prod' to deploy to production"
echo "3. Configure environment variables in Vercel dashboard:"
echo "   - NEXT_PUBLIC_API_URL"
echo "   - NEXT_PUBLIC_CDN_URL"
echo "   - NEXT_PUBLIC_SITE_URL"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"