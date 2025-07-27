#!/bin/bash

# Restore S3 bucket from local filesystem dump
# This script will upload all objects from the dump directory back to the bucket
#
# Usage: ./scripts/restore-s3-bucket.sh [--env=ENVIRONMENT]
# Examples:
#   ./scripts/restore-s3-bucket.sh              # Restores to local environment (default)
#   ./scripts/restore-s3-bucket.sh --env=local  # Restores to local environment
#   ./scripts/restore-s3-bucket.sh --env=dev    # Restores to dev environment
#   ./scripts/restore-s3-bucket.sh --env=staging # Restores to staging environment
#   ./scripts/restore-s3-bucket.sh --env=prod   # Restores to prod environment

set -e

# Default configuration
ENVIRONMENT="local"
SOURCE_DIR=""

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

# Show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Restore S3 bucket contents from local filesystem dump."
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT     Target environment (local, dev, staging, prod) [default: local]"
    echo "  -s, --source DIRECTORY    Source directory for restore [default: auto-detected]"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                        # Restore to local environment bucket"
    echo "  $0 --env local                           # Restore to local environment bucket"
    echo "  $0 --env staging                         # Restore to staging environment bucket"
    echo "  $0 --env local --source ./prod-backup    # Restore prod backup to local"
    echo ""
    echo "Cross-environment restore workflow:"
    echo "  ./scripts/dump-s3-bucket.sh --env prod --output ./prod-dump    # Dump production data"
    echo "  $0 --env local --source ./prod-dump                           # Restore to local"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--source)
                SOURCE_DIR="$2"
                shift 2
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
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(local|dev|staging|prod)$ ]]; then
        print_error "Invalid environment: $ENVIRONMENT"
        print_error "Supported environments: local, dev, staging, prod"
        exit 1
    fi
}

# Load environment variables from .env file
load_env_config() {
    local env_file="./scripts/.env.${ENVIRONMENT}"
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        print_error "Please create the .env file for environment: $ENVIRONMENT"
        exit 1
    fi
    
    print_status "Loading configuration from: $env_file"
    
    # Load environment variables
    set -o allexport
    source "$env_file"
    set +o allexport
}

# Get environment-specific configuration
get_config() {
    # Load environment-specific configuration
    load_env_config
    
    case $ENVIRONMENT in
        local)
            AWS_REGION="${AWS_REGION:-us-east-1}"
            AWS_ENDPOINT_URL="${LOCAL_AWS_ENDPOINT:-http://localhost:4566}"
            BUCKET_NAME="${S3_BUCKET:-local-pornspot-media}"
            ;;
        dev|staging|prod)
            AWS_REGION="${AWS_REGION:-us-east-1}"
            AWS_ENDPOINT_URL=""  # Use default AWS endpoints
            BUCKET_NAME="${S3_BUCKET:-${ENVIRONMENT}-pornspot-media}"
            ;;
    esac
    
    # Set dump directory - use custom source dir or default consistent structure
    if [ -z "$SOURCE_DIR" ]; then
        DUMP_DIR="./backups/s3/${ENVIRONMENT}"
    else
        DUMP_DIR="$SOURCE_DIR"
    fi
    
    print_status "Using bucket: $BUCKET_NAME"
}

# AWS CLI command wrapper
aws_cmd() {
    if [ "$ENVIRONMENT" = "local" ]; then
        AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}" \
        AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}" \
        aws --region "$AWS_REGION" --endpoint-url="$AWS_ENDPOINT_URL" "$@"
    else
        # Use credentials from .env file or environment
        if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
            AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
            AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
            aws --region "$AWS_REGION" "$@"
        else
            # Fall back to default AWS credentials (profile, IAM role, etc.)
            aws --region "$AWS_REGION" "$@"
        fi
    fi
}

# Parse arguments
parse_arguments "$@"

# Get environment-specific configuration
get_config

print_status "Restoring S3 bucket for environment: $ENVIRONMENT"
print_status "Target bucket: $BUCKET_NAME"
print_status "Source dump location: $DUMP_DIR"

# Check if LocalStack is running (only for local environment)
if [ "$ENVIRONMENT" = "local" ]; then
    print_status "Checking if LocalStack is running..."
    if ! curl -s http://localhost:4566/_localstack/health >/dev/null 2>&1; then
        print_error "LocalStack is not running! Please start LocalStack first."
        exit 1
    fi
    print_success "LocalStack is running"
fi

# Check if dump directory exists
if [ ! -d "$DUMP_DIR" ]; then
    print_warning "Dump directory '$DUMP_DIR' does not exist. Nothing to restore."
    print_status "Run './scripts/dump-s3-bucket.sh' first to create a dump."
    exit 0
fi

# Check if dump has objects
if [ ! -d "$DUMP_DIR/objects" ] || [ -z "$(ls -A "$DUMP_DIR/objects" 2>/dev/null)" ]; then
    print_warning "No objects found in dump directory. Nothing to restore."
    exit 0
fi

print_success "Found dump directory with objects"

# Read metadata if available
METADATA_FILE="$DUMP_DIR/bucket-metadata.json"
SOURCE_ENVIRONMENT=""
if [ -f "$METADATA_FILE" ]; then
    DUMP_DATE=$(cat "$METADATA_FILE" | grep -o '"dumpDate": "[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "Unknown")
    EXPECTED_COUNT=$(cat "$METADATA_FILE" | grep -o '"objectCount": [0-9]*' | cut -d':' -f2 | tr -d ' ' 2>/dev/null || echo "Unknown")
    SOURCE_ENVIRONMENT=$(cat "$METADATA_FILE" | grep -o '"environment": "[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "Unknown")
    print_status "Dump metadata found - Date: $DUMP_DATE, Expected objects: $EXPECTED_COUNT"
    print_status "Source environment: $SOURCE_ENVIRONMENT"
    
    # Warn if cross-environment restore
    if [ "$SOURCE_ENVIRONMENT" != "Unknown" ] && [ "$SOURCE_ENVIRONMENT" != "$ENVIRONMENT" ]; then
        print_warning "Cross-environment restore detected!"
        print_warning "Source: $SOURCE_ENVIRONMENT → Target: $ENVIRONMENT"
        print_warning "Ensure this is intentional before proceeding."
        echo ""
    fi
fi

# Check if bucket exists, create if it doesn't
print_status "Checking if bucket '$BUCKET_NAME' exists..."
if ! aws_cmd s3api head-bucket --bucket "$BUCKET_NAME" >/dev/null 2>&1; then
    print_status "Bucket does not exist, creating it..."
    if aws_cmd s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION"; then
        print_success "Bucket '$BUCKET_NAME' created"
        
        # Apply CORS policy if config file exists (only for local environment)
        if [ "$ENVIRONMENT" = "local" ]; then
            CORS_CONFIG="./scripts/local-s3-cors.json"
            if [ -f "$CORS_CONFIG" ]; then
                print_status "Applying CORS policy..."
                if aws_cmd s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration "file://$CORS_CONFIG"; then
                    print_success "CORS policy applied"
                else
                    print_warning "Failed to apply CORS policy, continuing anyway..."
                fi
            fi
        fi
    else
        print_error "Failed to create bucket"
        exit 1
    fi
else
    print_success "Bucket '$BUCKET_NAME' already exists"
fi

# Count objects to upload
OBJECT_COUNT=$(find "$DUMP_DIR/objects" -type f | wc -l | tr -d ' ')
print_status "Found $OBJECT_COUNT objects to restore"

if [ "$OBJECT_COUNT" -eq 0 ]; then
    print_warning "No objects to restore"
    exit 0
fi

# Sync objects to bucket
print_status "Uploading objects to bucket..."
if aws_cmd s3 sync "$DUMP_DIR/objects/" "s3://$BUCKET_NAME" --exact-timestamps; then
    print_success "Objects uploaded successfully"
else
    print_error "Failed to upload objects"
    exit 1
fi

# Verify upload
print_status "Verifying upload..."
UPLOADED_COUNT=$(aws_cmd s3api list-objects-v2 --bucket "$BUCKET_NAME" --query 'length(Contents)' --output text 2>/dev/null || echo "0")

if [ "$UPLOADED_COUNT" = "None" ]; then
    UPLOADED_COUNT=0
fi

if [ "$UPLOADED_COUNT" -eq "$OBJECT_COUNT" ]; then
    print_success "Upload verification passed: $UPLOADED_COUNT objects uploaded"
else
    print_warning "Upload verification warning: Expected $OBJECT_COUNT, found $UPLOADED_COUNT objects"
fi

# Calculate total size if possible
TOTAL_SIZE=$(find "$DUMP_DIR/objects" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
HUMAN_SIZE=$(numfmt --to=iec-i --suffix=B $TOTAL_SIZE 2>/dev/null || echo "${TOTAL_SIZE} bytes")

echo ""
print_success "🎉 S3 bucket restore completed successfully!"
echo ""
echo "📊 Restore Statistics:"
echo "  • Environment: $ENVIRONMENT"
echo "  • Bucket: $BUCKET_NAME"
echo "  • Objects Restored: $UPLOADED_COUNT"
echo "  • Total Size: $HUMAN_SIZE"
echo "  • Source: $DUMP_DIR"
echo ""
echo "💡 Bucket is now ready for use"
if [ "$ENVIRONMENT" = "local" ]; then
    echo "💡 Test with: aws --endpoint-url=http://localhost:4566 s3 ls s3://$BUCKET_NAME"
else
    echo "💡 Test with: aws s3 ls s3://$BUCKET_NAME"
fi
