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

# Step 0: Clean up Docker networks and containers
print_status "Cleaning up Docker environment..."

# Clean up any orphaned networks and containers first
docker network prune -f >/dev/null 2>&1 || true
docker container prune -f >/dev/null 2>&1 || true

# Check if the network exists and has correct labels
NETWORK_NAME="pornspot-ai_local-network"
NETWORK_EXISTS=$(docker network ls --filter "name=${NETWORK_NAME}" --format "{{.Name}}" | grep -x "${NETWORK_NAME}" || true)

if [ -n "$NETWORK_EXISTS" ]; then
    # Check if network has correct labels
    NETWORK_LABEL=$(docker network inspect "${NETWORK_NAME}" --format '{{index .Labels "com.docker.compose.network"}}' 2>/dev/null || echo "")
    
    if [ "$NETWORK_LABEL" != "local-network" ]; then
        print_warning "Network ${NETWORK_NAME} has incorrect labels, removing..."
        
        # Stop and remove any containers using this network
        CONTAINERS_USING_NETWORK=$(docker network inspect "${NETWORK_NAME}" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || true)
        if [ -n "$CONTAINERS_USING_NETWORK" ]; then
            echo "$CONTAINERS_USING_NETWORK" | xargs docker stop >/dev/null 2>&1 || true
            echo "$CONTAINERS_USING_NETWORK" | xargs docker rm -f >/dev/null 2>&1 || true
        fi
        
        # Remove the incorrectly labeled network
        docker network rm "${NETWORK_NAME}" >/dev/null 2>&1 || true
        print_success "Removed incorrectly labeled network"
    fi
fi

print_success "Docker environment cleaned up"

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

# Step 5: Build Backend Components
print_status "Building backend components..."
echo ""

# Step 5a: Compile TypeScript
print_status "Compiling TypeScript code..."
if cd backend && npm run build; then
    print_success "TypeScript compilation completed"
else
    print_error "Failed to compile TypeScript code"
    exit 1
fi

# Step 5b: Install bcrypt for development
print_status "Installing bcrypt for development environment..."
if npm run install-bcrypt-dev; then
    print_success "Bcrypt installed for development"
else
    print_error "Failed to install bcrypt for development"
    exit 1
fi

# Step 5c: Copy shared code to layer
print_status "Copying shared code to Lambda layer..."
if npm run copy:layer; then
    print_success "Shared code copied to layer"
else
    print_error "Failed to copy shared code to layer"
    exit 1
fi

# Go back to root directory
cd ..

# Step 5d: Clean up previous SAM containers
print_status "Cleaning up previous SAM containers and build artifacts..."
if ./scripts/cleanup-sam-containers.sh; then
    print_success "SAM cleanup completed"
else
    print_warning "SAM cleanup failed, continuing anyway..."
fi

# Step 5d.1: Verify Docker network is ready
print_status "Verifying Docker network is ready..."

# Ensure LocalStack is running and network is available
if ! docker ps | grep -q "pornspot-local-aws"; then
    print_warning "LocalStack container not running, restarting..."
    docker-compose -f docker-compose.local.yml up -d >/dev/null 2>&1 || true
    sleep 3
fi

# Verify network exists
NETWORK_NAME="pornspot-ai_local-network"
if ! docker network ls | grep -q "${NETWORK_NAME}"; then
    print_warning "Network not found, recreating with Docker Compose..."
    docker-compose -f docker-compose.local.yml up -d >/dev/null 2>&1 || true
    sleep 2
fi

print_success "Docker network is ready"

# Step 5d.2: Create backend environment JSON configuration
print_status "Creating backend environment JSON configuration..."
if .venv/bin/python scripts/create-backend-env-json.py; then
    print_success "Backend environment JSON created successfully"
else
    print_error "Failed to create backend environment JSON"
    exit 1
fi

# Step 5e: Build SAM application
print_status "Building SAM application..."
if sam build; then
    print_success "SAM build completed"
else
    print_error "Failed to build SAM application"
    exit 1
fi

# Step 5f: Start Backend Server
print_status "Starting backend server..."
echo ""
print_warning "The backend server will now start and run in the foreground."
print_warning "Press Ctrl+C to stop the server when you're done."
echo ""
echo "🔧 Backend server will be available at: http://localhost:3001"
echo ""
echo "🚀 Starting SAM local API server..."
echo ""

# Start the SAM local API server
print_status "Attempting to start SAM with Docker network..."
if sam local start-api --port 3001 --docker-network pornspot-ai_local-network --env-vars backend/.env.local.json; then
    print_success "Backend server stopped gracefully"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 130 ]; then
        # Ctrl+C was pressed
        print_success "Backend server stopped by user"
    elif [ $EXIT_CODE -eq 1 ]; then
        # Network error, try without Docker network
        print_warning "Failed to start with Docker network, trying without network..."
        print_warning "Note: LocalStack integration may not work properly without the network"
        echo ""
        
        if sam local start-api --port 3001 --env-vars backend/.env.local.json; then
            print_success "Backend server stopped gracefully"
        else
            EXIT_CODE_FALLBACK=$?
            if [ $EXIT_CODE_FALLBACK -eq 130 ]; then
                print_success "Backend server stopped by user"
            else
                print_error "Backend server exited with error code: $EXIT_CODE_FALLBACK"
                exit $EXIT_CODE_FALLBACK
            fi
        fi
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