#!/bin/bash

# Graceful Stop Backend Script
# This script properly stops SAM local and cleans up Docker containers

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

echo "🛑 Gracefully stopping PornSpot.ai Local Backend"
echo "==============================================="

# Function to find and kill SAM processes
stop_sam_processes() {
    print_status "Looking for SAM local processes..."
    
    # Find SAM local processes
    SAM_PIDS=$(pgrep -f "sam local start-api" 2>/dev/null || true)
    
    if [ -n "$SAM_PIDS" ]; then
        print_status "Found SAM local processes (PIDs: $SAM_PIDS)"
        echo "$SAM_PIDS" | xargs kill -TERM 2>/dev/null || true
        
        # Wait a moment for graceful shutdown
        sleep 2
        
        # Force kill if still running
        REMAINING_PIDS=$(pgrep -f "sam local start-api" 2>/dev/null || true)
        if [ -n "$REMAINING_PIDS" ]; then
            print_warning "Force killing remaining SAM processes..."
            echo "$REMAINING_PIDS" | xargs kill -KILL 2>/dev/null || true
        fi
        
        print_success "SAM local processes stopped"
    else
        print_status "No SAM local processes found"
    fi
}

# Function to stop SAM Docker containers
stop_sam_containers() {
    print_status "Stopping SAM Docker containers..."
    
    # Find all containers using SAM lambda images
    SAM_CONTAINERS=$(docker ps --filter "ancestor=samcli/lambda-nodejs:20-x86_64-ea35a2dafa693f01cf9de8ed7" -q 2>/dev/null || true)
    
    if [ -n "$SAM_CONTAINERS" ]; then
        print_status "Stopping $(echo "$SAM_CONTAINERS" | wc -l | tr -d ' ') SAM containers..."
        echo "$SAM_CONTAINERS" | xargs docker stop >/dev/null 2>&1 || true
        echo "$SAM_CONTAINERS" | xargs docker rm >/dev/null 2>&1 || true
        print_success "SAM containers stopped and removed"
    else
        print_status "No running SAM containers found"
    fi
    
    # Also check for any containers with 'sam' in the name
    NAMED_SAM_CONTAINERS=$(docker ps --filter "name=sam" -q 2>/dev/null || true)
    if [ -n "$NAMED_SAM_CONTAINERS" ]; then
        print_status "Stopping additional SAM-named containers..."
        echo "$NAMED_SAM_CONTAINERS" | xargs docker stop >/dev/null 2>&1 || true
        echo "$NAMED_SAM_CONTAINERS" | xargs docker rm >/dev/null 2>&1 || true
        print_success "Additional SAM containers stopped"
    fi
}

# Stop SAM processes first
stop_sam_processes

# Stop SAM containers
stop_sam_containers

# Clean up dangling volumes
print_status "Cleaning up dangling Docker volumes..."
docker volume prune -f >/dev/null 2>&1 || true

print_success "Backend stopped gracefully!"
print_status "You can now restart with: npm run dev:backend"
