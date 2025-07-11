#!/bin/bash

# Fabularius.art Deployment Script
set -e

echo "🚀 Starting Fabularius.art deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    print_status "Building and deploying backend infrastructure..."
    
    # Build the SAM application
    sam build
    
    # Deploy with confirmation
    if [ "$1" = "--guided" ]; then
        sam deploy --guided
    else
        sam deploy
    fi
    
    print_status "Backend deployed successfully ✓"
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
    print_status "Starting deployment process..."
    
    # Check if guided deployment is requested
    GUIDED=false
    if [ "$1" = "--guided" ]; then
        GUIDED=true
        print_warning "Running guided deployment..."
    fi
    
    # Run deployment steps
    check_dependencies
    install_backend_deps
    
    if [ "$GUIDED" = true ]; then
        deploy_backend --guided
    else
        deploy_backend
    fi
    
    install_frontend_deps
    build_frontend
    
    print_status "🎉 Deployment completed successfully!"
    print_warning "Don't forget to deploy your frontend to your hosting service (Vercel, Netlify, etc.)"
    
    # Get API Gateway URL from SAM outputs
    print_status "Getting API Gateway URL..."
    API_URL=$(aws cloudformation describe-stacks --stack-name fabularius-art-dev --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text 2>/dev/null || echo "Not found")
    
    if [ "$API_URL" != "Not found" ]; then
        print_status "API Gateway URL: $API_URL"
        print_warning "Update your frontend environment variables with this URL"
    fi
}

# Run main function with all arguments
main "$@"