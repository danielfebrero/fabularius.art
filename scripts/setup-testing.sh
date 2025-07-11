#!/bin/bash

# Fabularius.art Testing Infrastructure Setup Script
# This script initializes the complete testing environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔵 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  Fabularius.art Testing Infrastructure Setup"
    echo "=================================================="
    echo -e "${NC}"
}

# Check if we're in the right directory
check_project_root() {
    if [ ! -f "package.json" ] || [ ! -f "template.yaml" ]; then
        print_error "Not in project root directory. Please run from the project root."
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or later is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm is not installed."
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker >/dev/null 2>&1; then
        print_success "Docker found - full testing environment available"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker not found - some integration tests may not work"
        DOCKER_AVAILABLE=false
    fi
    
    # Check Git
    if ! command -v git >/dev/null 2>&1; then
        print_error "Git is not installed."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm ci
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend && npm ci && cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend && npm ci && cd ..
    
    print_success "Dependencies installed"
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    # Initialize Husky if not already done
    if [ ! -d ".husky" ]; then
        npx husky install
    fi
    
    # Make hooks executable
    chmod +x .husky/pre-commit .husky/_/husky.sh 2>/dev/null || true
    
    # Install Husky hooks
    npx husky install
    
    print_success "Git hooks configured"
}

# Setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    # Create test directories if they don't exist
    mkdir -p coverage
    mkdir -p test-results
    mkdir -p reports
    
    # Setup environment files
    if [ ! -f ".env.test" ]; then
        print_status "Creating test environment file..."
        cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000
LOCALSTACK_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Test Database Configuration
TEST_DB_NAME=fabularius-test
TEST_TABLE_PREFIX=test-

# Frontend Test Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENV=test
EOF
        print_success "Test environment file created"
    fi
    
    print_success "Test environment configured"
}

# Validate test setup
validate_test_setup() {
    print_status "Validating test setup..."
    
    # Check if all test scripts exist
    required_scripts=(
        "scripts/test-setup.sh"
        "scripts/test-cleanup.sh"
        "scripts/generate-test-summary.js"
    )
    
    for script in "${required_scripts[@]}"; do
        if [ ! -f "$script" ]; then
            print_error "Required script missing: $script"
            exit 1
        fi
    done
    
    # Check if test configurations exist
    required_configs=(
        "jest.config.root.js"
        "backend/jest.config.js"
        "frontend/jest.config.js"
        "frontend/playwright.config.ts"
    )
    
    for config in "${required_configs[@]}"; do
        if [ ! -f "$config" ]; then
            print_error "Required config missing: $config"
            exit 1
        fi
    done
    
    # Check if GitHub Actions workflow exists
    if [ ! -f ".github/workflows/test.yml" ]; then
        print_error "GitHub Actions workflow missing"
        exit 1
    fi
    
    print_success "Test setup validation passed"
}

# Run initial tests
run_initial_tests() {
    print_status "Running initial test suite..."
    
    # Run linting
    print_status "Running linting..."
    npm run lint:all || {
        print_warning "Linting issues found - please review"
    }
    
    # Run type checking
    print_status "Running type checking..."
    npm run type-check:all || {
        print_warning "Type checking issues found - please review"
    }
    
    # Run unit tests
    print_status "Running unit tests..."
    npm run test:unit:all || {
        print_warning "Some unit tests failed - please review"
    }
    
    print_success "Initial tests completed"
}

# Setup Docker environment (if available)
setup_docker_environment() {
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_status "Setting up Docker test environment..."
        
        # Pull required Docker images
        docker pull amazon/dynamodb-local:latest || print_warning "Failed to pull DynamoDB Local image"
        docker pull localstack/localstack:latest || print_warning "Failed to pull LocalStack image"
        
        print_success "Docker environment configured"
    fi
}

# Generate documentation
generate_documentation() {
    print_status "Generating test documentation..."
    
    # Create a quick start guide
    cat > TESTING_QUICKSTART.md << 'EOF'
# Testing Quick Start Guide

## Prerequisites
- Node.js 18+
- npm
- Docker (optional, for full integration tests)

## Quick Commands

### Run All Tests
```bash
npm run test:all
```

### Run Tests by Type
```bash
# Unit tests only
npm run test:unit:all

# Integration tests only
npm run test:integration:all

# E2E tests only
npm run test:e2e:all
```

### Coverage Reports
```bash
# Generate combined coverage
npm run test:coverage:combined

# View coverage report
open coverage/lcov-report/index.html
```

### Development Workflow
```bash
# Setup test environment
./scripts/test-setup.sh local

# Run tests in watch mode
npm run test:watch

# Cleanup after testing
./scripts/test-cleanup.sh
```

## CI/CD
Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

## Troubleshooting
See TESTING.md for detailed troubleshooting guide.
EOF
    
    print_success "Documentation generated"
}

# Main execution
main() {
    print_header
    
    check_project_root
    check_prerequisites
    install_dependencies
    setup_git_hooks
    setup_test_environment
    setup_docker_environment
    validate_test_setup
    run_initial_tests
    generate_documentation
    
    echo ""
    print_success "Testing infrastructure setup complete! 🎉"
    echo ""
    print_status "Next steps:"
    echo "  1. Review TESTING.md for detailed documentation"
    echo "  2. Review TESTING_QUICKSTART.md for quick commands"
    echo "  3. Run 'npm run test:all' to execute the full test suite"
    echo "  4. Commit your changes to trigger CI/CD pipeline"
    echo ""
    print_status "Happy testing! 🧪"
}

# Run main function
main "$@"