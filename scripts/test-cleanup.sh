#!/bin/bash

# Test Environment Cleanup Script for Fabularius.art
# This script cleans up the testing environment and artifacts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
COVERAGE_DIR="$PROJECT_ROOT/coverage"
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"

# Default values
CLEAN_LEVEL="standard"
FORCE=false
VERBOSE=false
DOCKER_MODE=false

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

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Clean up test environment and artifacts for Fabularius.art project

OPTIONS:
    -l, --level LEVEL       Cleanup level (minimal, standard, deep, complete) [default: standard]
    -f, --force             Force cleanup without confirmation prompts
    -v, --verbose           Enable verbose output
    -d, --docker            Clean Docker test environment
    -h, --help              Show this help message

CLEANUP LEVELS:
    minimal     Remove only test results and temporary files
    standard    Remove test results, coverage reports, and logs
    deep        Remove all test artifacts and cached data
    complete    Remove everything including node_modules and Docker volumes

EXAMPLES:
    $0                      # Standard cleanup
    $0 --level deep         # Deep cleanup
    $0 --force --docker     # Force cleanup Docker environment
    $0 --level complete -v  # Complete cleanup with verbose output

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--level)
            CLEAN_LEVEL="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -d|--docker)
            DOCKER_MODE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Function to confirm action
confirm_action() {
    local message="$1"
    
    if [[ "$FORCE" == true ]]; then
        return 0
    fi
    
    echo -e "${YELLOW}$message${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to remove directory safely
remove_directory() {
    local dir="$1"
    local description="$2"
    
    if [[ -d "$dir" ]]; then
        if [[ "$VERBOSE" == true ]]; then
            print_status "Removing $description: $dir"
        fi
        rm -rf "$dir"
        print_success "Removed $description"
    elif [[ "$VERBOSE" == true ]]; then
        print_status "$description not found: $dir"
    fi
}

# Function to remove file safely
remove_file() {
    local file="$1"
    local description="$2"
    
    if [[ -f "$file" ]]; then
        if [[ "$VERBOSE" == true ]]; then
            print_status "Removing $description: $file"
        fi
        rm -f "$file"
        print_success "Removed $description"
    elif [[ "$VERBOSE" == true ]]; then
        print_status "$description not found: $file"
    fi
}

# Function to clean test results
clean_test_results() {
    print_status "Cleaning test results..."
    
    # Remove test result directories
    remove_directory "$TEST_RESULTS_DIR" "test results directory"
    remove_directory "$BACKEND_DIR/test-results" "backend test results"
    remove_directory "$FRONTEND_DIR/test-results" "frontend test results"
    
    # Remove individual test result files
    remove_file "$PROJECT_ROOT/test-summary.md" "test summary"
    remove_file "$PROJECT_ROOT/test-summary.json" "test summary JSON"
    remove_file "$BACKEND_DIR/test-results.xml" "backend test results XML"
    remove_file "$FRONTEND_DIR/test-results.xml" "frontend test results XML"
    
    print_success "Test results cleaned"
}

# Function to clean coverage reports
clean_coverage() {
    print_status "Cleaning coverage reports..."
    
    # Remove coverage directories
    remove_directory "$COVERAGE_DIR" "combined coverage directory"
    remove_directory "$BACKEND_DIR/coverage" "backend coverage"
    remove_directory "$FRONTEND_DIR/coverage" "frontend coverage"
    
    # Remove coverage files
    remove_file "$PROJECT_ROOT/coverage.lcov" "combined coverage file"
    remove_file "$BACKEND_DIR/coverage.lcov" "backend coverage file"
    remove_file "$FRONTEND_DIR/coverage.lcov" "frontend coverage file"
    
    print_success "Coverage reports cleaned"
}

# Function to clean Playwright artifacts
clean_playwright() {
    print_status "Cleaning Playwright artifacts..."
    
    remove_directory "$FRONTEND_DIR/playwright-report" "Playwright HTML report"
    remove_directory "$FRONTEND_DIR/test-results" "Playwright test results"
    remove_directory "$FRONTEND_DIR/.playwright" "Playwright cache"
    
    # Remove Playwright videos and screenshots
    remove_directory "$FRONTEND_DIR/__tests__/e2e/test-results" "E2E test results"
    
    print_success "Playwright artifacts cleaned"
}

# Function to clean logs
clean_logs() {
    print_status "Cleaning log files..."
    
    # Remove log files
    find "$PROJECT_ROOT" -name "*.log" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "npm-debug.log*" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "yarn-debug.log*" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "yarn-error.log*" -type f -delete 2>/dev/null || true
    
    # Remove Jest cache
    remove_directory "$BACKEND_DIR/.jest" "backend Jest cache"
    remove_directory "$FRONTEND_DIR/.jest" "frontend Jest cache"
    
    print_success "Log files cleaned"
}

# Function to clean temporary files
clean_temp_files() {
    print_status "Cleaning temporary files..."
    
    # Remove temporary test files
    remove_file "$PROJECT_ROOT/.env.test" "test environment file"
    remove_file "$FRONTEND_DIR/.lighthouserc.json" "Lighthouse CI config"
    
    # Remove OS-specific temp files
    find "$PROJECT_ROOT" -name ".DS_Store" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "Thumbs.db" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "*.tmp" -type f -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name "*.temp" -type f -delete 2>/dev/null || true
    
    print_success "Temporary files cleaned"
}

# Function to clean build artifacts
clean_build_artifacts() {
    print_status "Cleaning build artifacts..."
    
    # Remove build directories
    remove_directory "$BACKEND_DIR/dist" "backend build directory"
    remove_directory "$FRONTEND_DIR/.next" "Next.js build directory"
    remove_directory "$FRONTEND_DIR/out" "Next.js export directory"
    
    # Remove TypeScript build info
    remove_file "$BACKEND_DIR/tsconfig.tsbuildinfo" "backend TypeScript build info"
    remove_file "$FRONTEND_DIR/tsconfig.tsbuildinfo" "frontend TypeScript build info"
    
    print_success "Build artifacts cleaned"
}

# Function to clean node_modules
clean_node_modules() {
    print_status "Cleaning node_modules..."
    
    if confirm_action "This will remove all node_modules directories. You'll need to run 'npm install' again."; then
        remove_directory "$PROJECT_ROOT/node_modules" "root node_modules"
        remove_directory "$BACKEND_DIR/node_modules" "backend node_modules"
        remove_directory "$FRONTEND_DIR/node_modules" "frontend node_modules"
        
        # Remove package-lock files
        remove_file "$PROJECT_ROOT/package-lock.json" "root package-lock.json"
        remove_file "$BACKEND_DIR/package-lock.json" "backend package-lock.json"
        remove_file "$FRONTEND_DIR/package-lock.json" "frontend package-lock.json"
        
        print_success "node_modules cleaned"
    else
        print_warning "Skipped node_modules cleanup"
    fi
}

# Function to clean Docker environment
clean_docker() {
    print_status "Cleaning Docker test environment..."
    
    if command -v docker-compose >/dev/null 2>&1; then
        cd "$PROJECT_ROOT"
        
        # Stop and remove containers
        if [[ "$VERBOSE" == true ]]; then
            docker-compose -f docker-compose.test.yml down -v --remove-orphans
        else
            docker-compose -f docker-compose.test.yml down -v --remove-orphans >/dev/null 2>&1
        fi
        
        # Remove test images
        if confirm_action "Remove Docker test images?"; then
            docker images | grep fabularius | awk '{print $3}' | xargs -r docker rmi 2>/dev/null || true
        fi
        
        # Clean Docker system (optional)
        if confirm_action "Run Docker system prune to clean unused resources?"; then
            docker system prune -f
        fi
        
        print_success "Docker environment cleaned"
    else
        print_warning "Docker Compose not found, skipping Docker cleanup"
    fi
}

# Function to stop running processes
stop_test_processes() {
    print_status "Stopping test-related processes..."
    
    # Stop any running test servers
    pkill -f "jest" 2>/dev/null || true
    pkill -f "playwright" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "sam local" 2>/dev/null || true
    
    # Stop LocalStack if running
    if pgrep -f "localstack" >/dev/null; then
        print_status "Stopping LocalStack..."
        pkill -f "localstack" 2>/dev/null || true
    fi
    
    # Stop DynamoDB Local if running
    if pgrep -f "DynamoDBLocal" >/dev/null; then
        print_status "Stopping DynamoDB Local..."
        pkill -f "DynamoDBLocal" 2>/dev/null || true
    fi
    
    print_success "Test processes stopped"
}

# Function to show cleanup summary
show_cleanup_summary() {
    print_status "Cleanup Summary:"
    print_status "=================="
    print_status "Level: $CLEAN_LEVEL"
    print_status "Docker mode: $DOCKER_MODE"
    print_status "Force mode: $FORCE"
    
    case $CLEAN_LEVEL in
        "minimal")
            echo "  - Test results and temporary files"
            ;;
        "standard")
            echo "  - Test results, coverage reports, and logs"
            ;;
        "deep")
            echo "  - All test artifacts and cached data"
            ;;
        "complete")
            echo "  - Everything including node_modules and Docker volumes"
            ;;
    esac
    
    echo ""
}

# Main cleanup function
perform_cleanup() {
    case $CLEAN_LEVEL in
        "minimal")
            clean_test_results
            clean_temp_files
            ;;
        "standard")
            clean_test_results
            clean_coverage
            clean_playwright
            clean_logs
            clean_temp_files
            ;;
        "deep")
            stop_test_processes
            clean_test_results
            clean_coverage
            clean_playwright
            clean_logs
            clean_temp_files
            clean_build_artifacts
            ;;
        "complete")
            stop_test_processes
            clean_test_results
            clean_coverage
            clean_playwright
            clean_logs
            clean_temp_files
            clean_build_artifacts
            clean_node_modules
            ;;
        *)
            print_error "Invalid cleanup level: $CLEAN_LEVEL"
            exit 1
            ;;
    esac
    
    if [[ "$DOCKER_MODE" == true ]]; then
        clean_docker
    fi
}

# Function to verify cleanup
verify_cleanup() {
    print_status "Verifying cleanup..."
    
    local remaining_artifacts=()
    
    # Check for remaining test artifacts
    if [[ -d "$TEST_RESULTS_DIR" ]]; then
        remaining_artifacts+=("test results")
    fi
    
    if [[ -d "$COVERAGE_DIR" ]]; then
        remaining_artifacts+=("coverage reports")
    fi
    
    if [[ -d "$FRONTEND_DIR/playwright-report" ]]; then
        remaining_artifacts+=("Playwright reports")
    fi
    
    if [[ ${#remaining_artifacts[@]} -eq 0 ]]; then
        print_success "Cleanup verification passed"
    else
        print_warning "Some artifacts remain: ${remaining_artifacts[*]}"
    fi
}

# Main execution
main() {
    print_status "Starting test environment cleanup..."
    
    show_cleanup_summary
    
    if [[ "$FORCE" == false ]]; then
        if ! confirm_action "Proceed with cleanup?"; then
            print_status "Cleanup cancelled"
            exit 0
        fi
    fi
    
    perform_cleanup
    verify_cleanup
    
    print_success "Test environment cleanup complete!"
    
    # Show next steps
    case $CLEAN_LEVEL in
        "complete")
            print_status "Next steps:"
            print_status "  npm run install:all    # Reinstall dependencies"
            print_status "  npm run test:setup     # Setup test environment"
            ;;
        "deep")
            print_status "Next steps:"
            print_status "  npm run test:setup     # Setup test environment"
            ;;
    esac
}

# Run main function
main "$@"