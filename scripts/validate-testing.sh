#!/bin/bash

# Fabularius.art Testing Infrastructure Validation Script
# This script validates that the complete testing environment is properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  Testing Infrastructure Validation"
    echo "=================================================="
    echo -e "${NC}"
}

# Check function template
check() {
    local description="$1"
    local command="$2"
    
    ((TOTAL_CHECKS++))
    print_status "Checking: $description"
    
    if eval "$command" >/dev/null 2>&1; then
        print_success "$description"
        return 0
    else
        print_error "$description"
        return 1
    fi
}

# File existence checks
check_files() {
    echo ""
    print_status "=== File Structure Validation ==="
    
    # Root configuration files
    check "Root package.json exists" "[ -f 'package.json' ]"
    check "Root Jest config exists" "[ -f 'jest.config.root.js' ]"
    check "Docker compose test config exists" "[ -f 'docker-compose.test.yml' ]"
    check "Testing documentation exists" "[ -f 'TESTING.md' ]"
    
    # Backend files
    check "Backend package.json exists" "[ -f 'backend/package.json' ]"
    check "Backend Jest config exists" "[ -f 'backend/jest.config.js' ]"
    check "Backend test setup exists" "[ -f 'backend/__tests__/setup.ts' ]"
    
    # Frontend files
    check "Frontend package.json exists" "[ -f 'frontend/package.json' ]"
    check "Frontend Jest config exists" "[ -f 'frontend/jest.config.js' ]"
    check "Frontend Jest setup exists" "[ -f 'frontend/jest.setup.js' ]"
    check "Playwright config exists" "[ -f 'frontend/playwright.config.ts' ]"
    
    # Scripts
    check "Test setup script exists" "[ -f 'scripts/test-setup.sh' ]"
    check "Test cleanup script exists" "[ -f 'scripts/test-cleanup.sh' ]"
    check "Test summary generator exists" "[ -f 'scripts/generate-test-summary.js' ]"
    check "Testing setup script exists" "[ -f 'scripts/setup-testing.sh' ]"
    
    # CI/CD
    check "GitHub Actions workflow exists" "[ -f '.github/workflows/test.yml' ]"
    
    # Git hooks
    check "Husky pre-commit hook exists" "[ -f '.husky/pre-commit' ]"
    check "Husky helper script exists" "[ -f '.husky/_/husky.sh' ]"
}

# Script permissions
check_permissions() {
    echo ""
    print_status "=== Script Permissions Validation ==="
    
    check "Test setup script is executable" "[ -x 'scripts/test-setup.sh' ]"
    check "Test cleanup script is executable" "[ -x 'scripts/test-cleanup.sh' ]"
    check "Testing setup script is executable" "[ -x 'scripts/setup-testing.sh' ]"
    check "Validation script is executable" "[ -x 'scripts/validate-testing.sh' ]"
    check "Pre-commit hook is executable" "[ -x '.husky/pre-commit' ]"
    check "Husky helper is executable" "[ -x '.husky/_/husky.sh' ]"
}

# Package.json scripts
check_npm_scripts() {
    echo ""
    print_status "=== NPM Scripts Validation ==="
    
    # Root scripts
    check "Root test:all script exists" "npm run test:all --dry-run"
    check "Root test:coverage:combined script exists" "npm run test:coverage:combined --dry-run"
    check "Root test:ci script exists" "npm run test:ci --dry-run"
    check "Root test:summary script exists" "npm run test:summary --dry-run"
    
    # Backend scripts
    check "Backend test script exists" "cd backend && npm run test --dry-run"
    check "Backend test:unit script exists" "cd backend && npm run test:unit --dry-run"
    check "Backend test:integration script exists" "cd backend && npm run test:integration --dry-run"
    check "Backend lint script exists" "cd backend && npm run lint --dry-run"
    
    # Frontend scripts
    check "Frontend test script exists" "cd frontend && npm run test --dry-run"
    check "Frontend test:e2e script exists" "cd frontend && npm run test:e2e --dry-run"
    check "Frontend lint script exists" "cd frontend && npm run lint --dry-run"
    check "Frontend type-check script exists" "cd frontend && npm run type-check --dry-run"
}

# Dependencies validation
check_dependencies() {
    echo ""
    print_status "=== Dependencies Validation ==="
    
    # Check if node_modules exist
    check "Root node_modules exists" "[ -d 'node_modules' ]"
    check "Backend node_modules exists" "[ -d 'backend/node_modules' ]"
    check "Frontend node_modules exists" "[ -d 'frontend/node_modules' ]"
    
    # Check key testing dependencies
    check "Jest is installed (backend)" "cd backend && npm list jest"
    check "Jest is installed (frontend)" "cd frontend && npm list jest"
    check "Playwright is installed" "cd frontend && npm list @playwright/test"
    check "AWS SDK mock is installed" "cd backend && npm list aws-sdk-client-mock"
    check "MSW is installed" "cd frontend && npm list msw"
}

# Configuration validation
check_configurations() {
    echo ""
    print_status "=== Configuration Validation ==="
    
    # Jest configurations
    check "Root Jest config is valid" "node -e 'require(\"./jest.config.root.js\")'"
    check "Backend Jest config is valid" "cd backend && node -e 'require(\"./jest.config.js\")'"
    check "Frontend Jest config is valid" "cd frontend && node -e 'require(\"./jest.config.js\")'"
    
    # TypeScript configurations
    check "Backend TypeScript config is valid" "cd backend && npx tsc --noEmit --skipLibCheck"
    check "Frontend TypeScript config is valid" "cd frontend && npx tsc --noEmit --skipLibCheck"
    
    # Playwright configuration
    check "Playwright config is valid" "cd frontend && npx playwright --version"
}

# Test structure validation
check_test_structure() {
    echo ""
    print_status "=== Test Structure Validation ==="
    
    # Backend test structure
    check "Backend unit tests exist" "[ -d 'backend/__tests__/unit' ]"
    check "Backend integration tests exist" "[ -d 'backend/__tests__/integration' ]"
    check "Backend test fixtures exist" "[ -d 'backend/__tests__/fixtures' ]"
    check "Backend test helpers exist" "[ -d 'backend/__tests__/helpers' ]"
    
    # Frontend test structure
    check "Frontend component tests exist" "[ -d 'frontend/__tests__/components' ]"
    check "Frontend E2E tests exist" "[ -d 'frontend/__tests__/e2e' ]"
    check "Frontend test fixtures exist" "[ -d 'frontend/__tests__/fixtures' ]"
    check "Frontend test mocks exist" "[ -d 'frontend/__tests__/mocks' ]"
    
    # Test file counts
    backend_unit_tests=$(find backend/__tests__/unit -name "*.test.ts" 2>/dev/null | wc -l)
    backend_integration_tests=$(find backend/__tests__/integration -name "*.test.ts" 2>/dev/null | wc -l)
    frontend_unit_tests=$(find frontend/__tests__ -name "*.test.tsx" -o -name "*.test.ts" 2>/dev/null | grep -v e2e | wc -l)
    frontend_e2e_tests=$(find frontend/__tests__/e2e -name "*.spec.ts" 2>/dev/null | wc -l)
    
    if [ "$backend_unit_tests" -gt 0 ]; then
        print_success "Backend unit tests found ($backend_unit_tests tests)"
        ((PASSED_CHECKS++))
    else
        print_error "No backend unit tests found"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    if [ "$backend_integration_tests" -gt 0 ]; then
        print_success "Backend integration tests found ($backend_integration_tests tests)"
        ((PASSED_CHECKS++))
    else
        print_error "No backend integration tests found"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    if [ "$frontend_unit_tests" -gt 0 ]; then
        print_success "Frontend unit tests found ($frontend_unit_tests tests)"
        ((PASSED_CHECKS++))
    else
        print_error "No frontend unit tests found"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    if [ "$frontend_e2e_tests" -gt 0 ]; then
        print_success "Frontend E2E tests found ($frontend_e2e_tests tests)"
        ((PASSED_CHECKS++))
    else
        print_error "No frontend E2E tests found"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
}

# Environment validation
check_environment() {
    echo ""
    print_status "=== Environment Validation ==="
    
    # Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        print_success "Node.js version is compatible ($(node --version))"
        ((PASSED_CHECKS++))
    else
        print_error "Node.js version is too old ($(node --version)). Requires 18+"
        ((FAILED_CHECKS++))
    fi
    ((TOTAL_CHECKS++))
    
    # npm version
    check "npm is available" "npm --version"
    
    # Git
    check "Git is available" "git --version"
    
    # Docker (optional)
    if command -v docker >/dev/null 2>&1; then
        print_success "Docker is available ($(docker --version | cut -d' ' -f3 | cut -d',' -f1))"
        ((PASSED_CHECKS++))
    else
        print_warning "Docker not available (some integration tests may not work)"
    fi
    ((TOTAL_CHECKS++))
}

# Generate summary
generate_summary() {
    echo ""
    print_status "=== Validation Summary ==="
    echo ""
    
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        print_success "All checks passed! ($PASSED_CHECKS/$TOTAL_CHECKS)"
        echo ""
        print_status "🎉 Testing infrastructure is fully configured and ready!"
        echo ""
        print_status "Next steps:"
        echo "  • Run 'npm run test:all' to execute the full test suite"
        echo "  • Run './scripts/test-setup.sh local' to setup local test environment"
        echo "  • Commit changes to trigger CI/CD pipeline"
        echo "  • Review TESTING.md for detailed documentation"
        return 0
    else
        print_error "Some checks failed! ($FAILED_CHECKS/$TOTAL_CHECKS failed)"
        echo ""
        print_status "Please address the failed checks above before proceeding."
        echo ""
        print_status "Common solutions:"
        echo "  • Run 'npm install' to install missing dependencies"
        echo "  • Run './scripts/setup-testing.sh' to setup the environment"
        echo "  • Check file permissions with 'chmod +x scripts/*.sh'"
        echo "  • Verify Node.js version with 'node --version'"
        return 1
    fi
}

# Main execution
main() {
    print_header
    
    # Reset counters
    TOTAL_CHECKS=0
    PASSED_CHECKS=0
    FAILED_CHECKS=0
    
    # Run all validation checks
    check_files
    check_permissions
    check_npm_scripts
    check_dependencies
    check_configurations
    check_test_structure
    check_environment
    
    # Generate summary and exit with appropriate code
    generate_summary
}

# Run main function
main "$@"