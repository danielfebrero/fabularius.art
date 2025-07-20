#!/bin/bash

# Cleanup SAM Docker Containers Script
# This script cleans up all SAM-related Docker containers and build artifacts

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

echo "🧹 Cleaning up SAM Docker containers and build artifacts"
echo "======================================================="

# Stop and remove all SAM-related containers
print_status "Stopping and removing SAM-related Docker containers..."

# Find all containers using SAM lambda images
SAM_CONTAINERS=$(docker ps -a --filter "ancestor=samcli/lambda-nodejs:20-x86_64-ea35a2dafa693f01cf9de8ed7" -q 2>/dev/null || true)

if [ -n "$SAM_CONTAINERS" ]; then
    print_status "Found SAM containers to clean up..."
    echo "$SAM_CONTAINERS" | xargs docker stop >/dev/null 2>&1 || true
    echo "$SAM_CONTAINERS" | xargs docker rm >/dev/null 2>&1 || true
    print_success "Removed $(echo "$SAM_CONTAINERS" | wc -l | tr -d ' ') SAM containers"
else
    print_status "No SAM containers found to clean up"
fi

# Also clean up any containers with 'sam' in the name
NAMED_SAM_CONTAINERS=$(docker ps -a --filter "name=sam" -q 2>/dev/null || true)
if [ -n "$NAMED_SAM_CONTAINERS" ]; then
    print_status "Found additional SAM-named containers..."
    echo "$NAMED_SAM_CONTAINERS" | xargs docker stop >/dev/null 2>&1 || true
    echo "$NAMED_SAM_CONTAINERS" | xargs docker rm >/dev/null 2>&1 || true
    print_success "Cleaned up additional SAM-named containers"
fi

# Clean up any dangling Docker volumes
print_status "Cleaning up dangling Docker volumes..."
docker volume prune -f >/dev/null 2>&1 || true

# Remove the .aws-sam directory to force a clean rebuild
if [ -d ".aws-sam" ]; then
    print_status "Removing .aws-sam build directory..."
    rm -rf .aws-sam
    print_success "Removed .aws-sam directory"
else
    print_status ".aws-sam directory not found"
fi

# Clean up any Docker build cache (optional - uncomment if needed)
# print_status "Cleaning Docker build cache..."
# docker builder prune -f >/dev/null 2>&1 || true

print_success "Cleanup completed! You can now start the backend safely."
print_status "Run: npm run dev:backend or ./scripts/start-local-backend.sh"
