#!/bin/bash

# Fabularius.art Deployment Script
# Supports multiple environments: dev, staging, prod
set -e

# Default environment
ENVIRONMENT="dev"
GUIDED=false

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
    echo "  -e, --env ENVIRONMENT    Target environment (dev, staging, prod) [default: dev]"
    echo "  -g, --guided            Run guided deployment (interactive)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      # Deploy to dev environment"
    echo "  $0 --env staging        # Deploy to staging environment"
    echo "  $0 --env prod --guided  # Deploy to production with guided setup"
    echo ""
    echo "Supported environments:"
    echo "  dev      - Development environment (default)"
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
            -g|--guided)
                GUIDED=true
                shift
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
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v sam &> /dev/null; then
        print_error "AWS SAM CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    print_status "All dependencies are installed ✓"
}

# Validate environment configuration
validate_environment() {
    print_status "Validating $ENVIRONMENT environment configuration..."
    
    # Check if SAM config exists for the environment
    if ! grep -q "^\[$ENVIRONMENT\]" samconfig.toml; then
        print_error "No configuration found for environment: $ENVIRONMENT"
        print_error "Please ensure samconfig.toml contains a [$ENVIRONMENT] section"
        exit 1
    fi
    
    # Environment-specific validations
    case $ENVIRONMENT in
        prod)
            print_warning "🚨 PRODUCTION DEPLOYMENT 🚨"
            print_warning "You are about to deploy to the production environment."
            print_warning "This will affect live users and data."
            echo ""
            read -p "Are you sure you want to continue? (yes/no): " confirm
            if [[ $confirm != "yes" ]]; then
                print_status "Deployment cancelled."
                exit 0
            fi
            ;;
        staging)
            print_info "Deploying to staging environment for testing..."
            ;;
        dev)
            print_info "Deploying to development environment..."
            ;;
    esac
    
    print_status "Environment validation completed ✓"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    print_status "Backend dependencies installed ✓"
}

# Build and deploy backend
deploy_backend() {
    print_status "Building and deploying backend infrastructure to $ENVIRONMENT environment..."
    
    # Build the SAM application
    sam build
    
    # Deploy with environment-specific configuration
    if [ "$GUIDED" = true ]; then
        print_warning "Running guided deployment for $ENVIRONMENT environment..."
        sam deploy --guided --config-env "$ENVIRONMENT"
    else
        print_status "Deploying to $ENVIRONMENT environment..."
        sam deploy --config-env "$ENVIRONMENT"
    fi
    
    print_status "Backend deployed successfully to $ENVIRONMENT ✓"
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_status "Frontend dependencies installed ✓"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    cd frontend
    npm run build
    cd ..
    print_status "Frontend built successfully ✓"
}

# Main deployment function
main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    print_status "🚀 Starting Fabularius.art deployment to $ENVIRONMENT environment..."
    
    # Run deployment steps
    validate_environment
    check_dependencies
    install_backend_deps
    deploy_backend
    install_frontend_deps
    build_frontend
    
    print_status "🎉 Deployment completed successfully!"
    print_warning "Don't forget to deploy your frontend to your hosting service (Vercel, Netlify, etc.)"
    
    # Get API Gateway URL from SAM outputs (environment-specific stack name)
    print_status "Getting API Gateway URL..."
    STACK_NAME="fabularius-art-$ENVIRONMENT"
    API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text 2>/dev/null || echo "Not found")
    
    if [ "$API_URL" != "Not found" ]; then
        print_status "API Gateway URL: $API_URL"
        print_warning "Update your frontend environment variables with this URL"
        
        # Environment-specific guidance
        case $ENVIRONMENT in
            prod)
                print_info "For production, update your Vercel environment variables:"
                print_info "  NEXT_PUBLIC_API_URL=$API_URL"
                ;;
            staging)
                print_info "For staging, you may want to create a staging Vercel deployment"
                ;;
            dev)
                print_info "For development, update your local .env files if needed"
                ;;
        esac
    fi
}

# Run main function with all arguments
main "$@"