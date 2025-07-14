#!/bin/bash

# Restore Sharp for local development after deployment
# This script reinstalls Sharp with the correct binaries for your local platform

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_status "Restoring Sharp for local development..."

cd backend

print_warning "Uninstalling current Sharp module..."
npm uninstall sharp

print_status "Installing Sharp for local platform..."
npm install sharp

print_status "Sharp has been restored for local development ✓"
print_warning "Remember to run 'npm run build:lambda' before deploying to AWS Lambda"

cd ..