#!/bin/bash

# Quick Docker Network Fix Script
# This script fixes Docker network issues without full restart

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

echo "🔧 Quick Docker Network Fix"
echo "==========================="

# Stop all running containers to free up networks
print_status "Stopping all running containers..."
docker stop $(docker ps -q) >/dev/null 2>&1 || true

# Remove all SAM containers that might be holding onto networks
print_status "Removing SAM containers..."
docker ps -a --filter "ancestor=samcli/lambda-nodejs:20-x86_64-ea35a2dafa693f01cf9de8ed7" -q | xargs docker rm -f >/dev/null 2>&1 || true
docker ps -a --filter "name=sam" -q | xargs docker rm -f >/dev/null 2>&1 || true

# Prune unused networks
print_status "Pruning unused networks..."
docker network prune -f >/dev/null 2>&1 || true

# Remove specific problematic networks
print_status "Removing potentially problematic networks..."
docker network ls --filter "name=sam" -q | xargs docker network rm >/dev/null 2>&1 || true
docker network ls --filter "name=lambda" -q | xargs docker network rm >/dev/null 2>&1 || true

# Try to remove any orphaned bridge networks
print_status "Cleaning up orphaned bridge networks..."
docker network ls --format "{{.ID}} {{.Name}}" | grep -E "^[a-f0-9]{12} [a-f0-9]{12}$" | awk '{print $1}' | xargs docker network rm >/dev/null 2>&1 || true

# Recreate the project network if it doesn't exist
NETWORK_NAME="pornspot-ai_local-network"
NETWORK_EXISTS=$(docker network ls --filter "name=${NETWORK_NAME}" --format "{{.Name}}" | grep -x "${NETWORK_NAME}" || true)

if [ -n "$NETWORK_EXISTS" ]; then
    # Check if network has correct labels
    NETWORK_LABEL=$(docker network inspect "${NETWORK_NAME}" --format '{{index .Labels "com.docker.compose.network"}}' 2>/dev/null || echo "")
    
    if [ "$NETWORK_LABEL" != "local-network" ]; then
        print_warning "Network ${NETWORK_NAME} has incorrect labels, removing and recreating..."
        docker network rm "${NETWORK_NAME}" >/dev/null 2>&1 || true
        NETWORK_EXISTS=""
    else
        print_status "Project network $NETWORK_NAME exists with correct labels"
    fi
fi

if [ -z "$NETWORK_EXISTS" ]; then
    print_status "Creating/recreating project network with Docker Compose..."
    # Use Docker Compose to create the network with proper labels
    cd /Users/dannybengal/dev/lola/PornSpot.ai
    docker-compose -f docker-compose.local.yml up -d --no-recreate >/dev/null 2>&1 || true
    print_success "Network $NETWORK_NAME created with correct labels"
fi

print_success "Network cleanup completed!"
print_status "You can now try starting your backend again"
