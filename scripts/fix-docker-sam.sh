#!/bin/bash

# Comprehensive SAM Docker Cleanup Script
# This script handles Docker Desktop file sharing issues with SAM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🔧 Comprehensive SAM Docker cleanup for macOS"
echo "=============================================="

# Function to wait for Docker to be ready
wait_for_docker() {
    print_status "Waiting for Docker to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker info >/dev/null 2>&1; then
            print_success "Docker is ready"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: Docker not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Docker failed to start within expected time"
    return 1
}

# Wait for Docker to be ready
wait_for_docker

# Stop all containers first
print_status "Stopping all Docker containers..."
docker stop $(docker ps -q) >/dev/null 2>&1 || true

# Remove all SAM-related containers
print_status "Removing all SAM-related containers..."
docker ps -a --filter "ancestor=samcli/lambda-nodejs:20-x86_64-ea35a2dafa693f01cf9de8ed7" -q | xargs docker rm -f >/dev/null 2>&1 || true
docker ps -a --filter "name=sam" -q | xargs docker rm -f >/dev/null 2>&1 || true

# Remove all unused volumes and networks
print_status "Cleaning up Docker volumes and networks..."
docker volume prune -f >/dev/null 2>&1 || true
docker network prune -f >/dev/null 2>&1 || true

# Force remove any remaining SAM-related networks
print_status "Removing SAM-related networks..."
docker network ls --filter "name=sam" -q | xargs docker network rm >/dev/null 2>&1 || true
docker network ls --filter "name=lambda" -q | xargs docker network rm >/dev/null 2>&1 || true

# Remove any Docker bridge networks that might be corrupted
print_status "Cleaning up potentially corrupted Docker networks..."
docker network ls --format "table {{.ID}}\t{{.Name}}" | grep -E "^[a-f0-9]{12}" | awk '{print $1}' | xargs docker network rm >/dev/null 2>&1 || true

# Remove SAM build directory completely
if [ -d ".aws-sam" ]; then
    print_status "Removing .aws-sam directory..."
    rm -rf .aws-sam
    print_success "Removed .aws-sam directory"
fi

# Clear any potential file locks
print_status "Clearing potential file system locks..."
sudo find /private/var/folders -name "*sam*" -type d -exec rm -rf {} + 2>/dev/null || true

# Restart Docker Desktop to clear any internal state
print_status "Restarting Docker Desktop to clear internal state..."
osascript -e 'quit app "Docker Desktop"' 2>/dev/null || true
sleep 5
open -a "Docker Desktop" 2>/dev/null || true

# Wait for Docker to be ready again
wait_for_docker

# Create a fresh build
print_status "Creating a fresh SAM build..."
sam build --use-container || {
    print_warning "Container build failed, trying without containers..."
    sam build
}

print_success "Comprehensive cleanup completed!"
print_status "Docker Desktop has been restarted and SAM build is fresh"
print_status "You can now start the backend with: npm run dev:backend"
