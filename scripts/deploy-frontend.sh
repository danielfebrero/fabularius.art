#!/bin/bash

# Frontend Deployment Script for Vercel
# Supports multiple environments: dev, staging, prod
set -e

# Default environment
ENVIRONMENT="prod"
DEPLOY_TYPE="preview"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT    Target environment (dev, staging, prod) [default: prod]"
    echo "  -t, --type TYPE         Deployment type (preview, production) [default: preview]"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy to preview (staging)"
    echo "  $0 --env prod --type production  # Deploy to production"
    echo "  $0 --env staging             # Deploy staging to preview"
    echo ""
    echo "Supported environments:"
    echo "  dev      - Development environment"
    echo "  staging  - Staging environment for testing"
    echo "  prod     - Production environment"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--type)
                DEPLOY_TYPE="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        print_error "Invalid environment: $ENVIRONMENT"
        print_error "Supported environments: dev, staging, prod"
        exit 1
    fi
    
    # Validate deployment type
    if [[ ! "$DEPLOY_TYPE" =~ ^(preview|production)$ ]]; then
        print_error "Invalid deployment type: $DEPLOY_TYPE"
        print_error "Supported types: preview, production"
        exit 1
    fi
}

# Main function
main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    print_status "🚀 Preparing pornspot Art frontend for Vercel deployment..."
    print_info "Environment: $ENVIRONMENT"
    print_info "Deployment type: $DEPLOY_TYPE"

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi

    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    cd frontend && npm install && cd ..

    # Run type checking
    print_status "Running type checks..."
    cd frontend && npm run type-check && cd ..

    # Run linting
    print_status "Running linter..."
    cd frontend && npm run lint && cd ..

    # Run tests
    print_status "Running tests..."
    cd frontend && npm run test && cd ..

    # Build the project locally to check for errors
    print_status "Building project..."
    cd frontend && npm run build && cd ..

    print_status "✅ Pre-deployment checks completed successfully!"
    echo ""
    print_status "🌐 Ready to deploy to Vercel!"
    echo ""

    # Environment-specific deployment guidance
    case $ENVIRONMENT in
        prod)
            if [ "$DEPLOY_TYPE" = "production" ]; then
                print_warning "🚨 PRODUCTION DEPLOYMENT 🚨"
                print_warning "You are about to deploy to production."
                echo ""
                read -p "Are you sure you want to continue? (yes/no): " confirm
                if [[ $confirm != "yes" ]]; then
                    print_status "Deployment cancelled."
                    exit 0
                fi
                print_info "Run: vercel --prod"
            else
                print_info "Run: vercel (for preview deployment)"
            fi
            ;;
        staging)
            print_info "Run: vercel (for staging preview)"
            print_info "Consider using a staging project in Vercel for isolation"
            ;;
        dev)
            print_info "Run: vercel (for development preview)"
            ;;
    esac

    echo ""
    print_info "Environment variables to configure in Vercel dashboard:"
    case $ENVIRONMENT in
        prod)
            echo "   - NEXT_PUBLIC_API_URL=https://api.pornspot.ai"
            echo "   - NEXT_PUBLIC_CDN_URL=https://your-prod-cloudfront.cloudfront.net"
            echo "   - NEXT_PUBLIC_SITE_URL=https://pornspot.ai"
            ;;
        staging)
            echo "   - NEXT_PUBLIC_API_URL=https://staging-api.pornspot.ai"
            echo "   - NEXT_PUBLIC_CDN_URL=https://your-staging-cloudfront.cloudfront.net"
            echo "   - NEXT_PUBLIC_SITE_URL=https://staging.pornspot.ai"
            ;;
        dev)
            echo "   - NEXT_PUBLIC_API_URL=https://dev-api.pornspot.ai"
            echo "   - NEXT_PUBLIC_CDN_URL=https://your-dev-cloudfront.cloudfront.net"
            echo "   - NEXT_PUBLIC_SITE_URL=https://dev.pornspot.ai"
            ;;
    esac
    echo ""
    print_info "📖 See DEPLOYMENT.md for detailed instructions"
}

# Run main function with all arguments
main "$@"