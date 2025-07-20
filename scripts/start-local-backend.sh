#!/bin/bash

# Start Local Backend Script
# This script starts LocalStack, sets up the database, and creates an admin user

set -e  # Exit on any error

echo "🚀 Starting PornSpot.ai Local Backend Environment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

print_success "All prerequisites are available"

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running. Please start Docker and try again."
    exit 1
fi

print_success "Docker daemon is running"

# Step 1: Check and Start LocalStack if needed
print_status "Checking LocalStack status..."

# Check if LocalStack is already running and healthy
LOCALSTACK_RUNNING=false
if curl -s http://localhost:4566/_localstack/health >/dev/null 2>&1; then
    LOCALSTACK_RUNNING=true
    print_success "LocalStack is already running and healthy!"
else
    # Check if container exists but is not healthy
    CONTAINER_STATUS=$(docker-compose -f docker-compose.local.yml ps -q localstack 2>/dev/null)
    
    if [ -n "$CONTAINER_STATUS" ]; then
        print_warning "LocalStack container exists but is not healthy, restarting..."
        docker-compose -f docker-compose.local.yml down >/dev/null 2>&1 || true
    fi
    
    print_status "Starting LocalStack with Docker Compose..."
    
    # Start LocalStack
    if docker-compose -f docker-compose.local.yml up -d; then
        print_success "LocalStack started successfully"
    else
        print_error "Failed to start LocalStack"
        exit 1
    fi
    
    # Wait for LocalStack to be ready
    print_status "Waiting for LocalStack to be ready..."
    LOCALSTACK_READY=false
    WAIT_COUNT=0
    MAX_WAIT=30
    
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        if curl -s http://localhost:4566/_localstack/health >/dev/null 2>&1; then
            LOCALSTACK_READY=true
            break
        fi
        echo -n "."
        sleep 2
        WAIT_COUNT=$((WAIT_COUNT + 1))
    done
    
    echo ""
    
    if [ "$LOCALSTACK_READY" = true ]; then
        print_success "LocalStack is ready!"
        LOCALSTACK_RUNNING=true
    else
        print_error "LocalStack failed to start within expected time"
        print_status "Checking LocalStack logs..."
        docker-compose -f docker-compose.local.yml logs localstack
        exit 1
    fi
fi

# Step 2: Initialize AWS Resources
print_status "Initializing AWS resources (S3 bucket, CORS policy)..."

# Navigate to scripts directory to ensure relative paths work correctly
ORIGINAL_DIR=$(pwd)
if [ ! -f "scripts/init-local-aws.sh" ]; then
    if [ -f "init-local-aws.sh" ]; then
        print_status "Already in scripts directory"
    else
        print_error "Cannot find init-local-aws.sh script"
        exit 1
    fi
else
    cd scripts || exit 1
fi

# Run the AWS initialization script
if bash init-local-aws.sh; then
    print_success "AWS resources initialized successfully"
else
    print_error "Failed to initialize AWS resources"
    cd "$ORIGINAL_DIR" || exit 1
    exit 1
fi

# Return to original directory
cd "$ORIGINAL_DIR" || exit 1

# Step 3: Setup Local Database
print_status "Setting up local database and ensuring all indexes exist..."

# Navigate to scripts directory if not already there
if [ ! -f "scripts/setup-local-db.js" ]; then
    if [ -f "setup-local-db.js" ]; then
        print_status "Already in scripts directory"
    else
        print_error "Cannot find setup-local-db.js script"
        exit 1
    fi
else
    cd scripts || exit 1
fi

if node setup-local-db.js; then
    print_success "Database setup and index verification completed"
else
    print_error "Failed to setup database or create missing indexes"
    exit 1
fi

# Step 4: Create Admin User
print_status "Creating admin user..."

ADMIN_USERNAME="dani"
ADMIN_PASSWORD="Aa001903!"

if node create-admin.js local "$ADMIN_USERNAME" "$ADMIN_PASSWORD"; then
    print_success "Admin user setup completed"
else
    # Check if it failed because user already exists
    if node create-admin.js local "$ADMIN_USERNAME" "$ADMIN_PASSWORD" 2>&1 | grep -q "Username already exists"; then
        print_warning "Admin user already exists - skipping creation"
    else
        print_error "Failed to create admin user"
        exit 1
    fi
fi

# Go back to root directory
cd ..

echo ""
print_success "🎉 Local backend infrastructure is ready!"
echo ""
echo "📋 Environment Details:"
echo "  • LocalStack: http://localhost:4566"
echo "  • DynamoDB: http://localhost:4566"
echo "  • S3: http://localhost:4566"
echo "  • Admin Username: $ADMIN_USERNAME"
echo "  • Database Table: local-pornspot-media"
echo ""

# Step 5: Start Backend Server
print_status "Starting backend server..."
echo ""
print_warning "The backend server will now start and run in the foreground."
print_warning "Press Ctrl+C to stop the server when you're done."
echo ""
echo "🔧 Backend server will be available at: http://localhost:3001"
echo ""
echo "🚀 Starting SAM local API server..."
echo ""

# Start the backend development server
if npm run dev:backend; then
    print_success "Backend server stopped gracefully"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 130 ]; then
        # Ctrl+C was pressed
        print_success "Backend server stopped by user"
    else
        print_error "Backend server exited with error code: $EXIT_CODE"
        exit $EXIT_CODE
    fi
fi

echo ""
print_success "🎉 Local development session completed!"
echo ""
echo "🔧 Useful Commands:"
echo "  • Restart infrastructure: ./start-local-backend.sh"
echo "  • View LocalStack logs: docker-compose -f docker-compose.local.yml logs -f"
echo "  • Stop LocalStack: docker-compose -f docker-compose.local.yml down"
echo "  • Health check: curl http://localhost:4566/_localstack/health"
echo ""