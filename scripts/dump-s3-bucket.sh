#!/bin/bash

# Dump LocalStack S3 bucket to local filesystem
# This script will download all objects from the S3 bucket
# and store them in a local directory structure that can be committed to the repo
#
# Usage: ./scripts/dump-s3-bucket.sh [--env=ENVIRONMENT]
# Examples:
#   ./scripts/dump-s3-bucket.sh              # Dumps local environment (default)
#   ./scripts/dump-s3-bucket.sh --env=local  # Dumps local environment
#   ./scripts/dump-s3-bucket.sh --env=dev    # Dumps dev environment
#   ./scripts/dump-s3-bucket.sh --env=staging # Dumps staging environment
#   ./scripts/dump-s3-bucket.sh --env=prod   # Dumps prod environment

set -e

# Default configuration
ENVIRONMENT="local"
OUTPUT_DIR=""

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
    echo "Dump S3 bucket contents to local filesystem for backup/restore purposes."
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT     Source environment (local, dev, staging, prod) [default: local]"
    echo "  -o, --output DIRECTORY    Output directory for dump [default: auto-generated]"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Dump local environment bucket"
    echo "  $0 --env local                       # Dump local environment bucket"
    echo "  $0 --env prod                        # Dump prod environment bucket"
    echo "  $0 --env prod --output ./prod-backup # Dump prod to specific directory"
    echo ""
    echo "Cross-environment restore workflow:"
    echo "  $0 --env prod --output ./prod-dump          # Dump production data"
    echo "  ./scripts/restore-s3-bucket.sh --env local --source ./prod-dump  # Restore to local"
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
            -o|--output)
                OUTPUT_DIR="$2"
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
    
    # Set dump directory - use custom output dir or default consistent structure
    if [ -z "$OUTPUT_DIR" ]; then
        DUMP_DIR="./backups/s3/${ENVIRONMENT}"
    else
        DUMP_DIR="$OUTPUT_DIR"
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

print_status "Dumping S3 bucket for environment: $ENVIRONMENT"
print_status "Bucket: $BUCKET_NAME"
print_status "Dump location: $DUMP_DIR"

# Check if LocalStack is running (only for local environment)
if [ "$ENVIRONMENT" = "local" ]; then
    print_status "Checking if LocalStack is running..."
    if ! curl -s http://localhost:4566/_localstack/health >/dev/null 2>&1; then
        print_error "LocalStack is not running! Please start LocalStack first."
        exit 1
    fi
    print_success "LocalStack is running"
fi

# Check if bucket exists
print_status "Checking if bucket '$BUCKET_NAME' exists..."
if ! aws_cmd s3api head-bucket --bucket "$BUCKET_NAME" >/dev/null 2>&1; then
    print_warning "Bucket '$BUCKET_NAME' does not exist or is empty. Nothing to dump."
    exit 0
fi
print_success "Bucket '$BUCKET_NAME' exists"

# Create dump directory
print_status "Creating dump directory..."
mkdir -p "$DUMP_DIR"
print_success "Dump directory created: $DUMP_DIR"

# List objects in bucket
print_status "Listing objects in bucket..."
OBJECT_COUNT=$(aws_cmd s3api list-objects-v2 --bucket "$BUCKET_NAME" --query 'length(Contents)' --output text 2>/dev/null || echo "0")

if [ "$OBJECT_COUNT" = "0" ] || [ "$OBJECT_COUNT" = "None" ]; then
    print_warning "Bucket '$BUCKET_NAME' is empty. Nothing to dump."
    exit 0
fi

print_status "Found $OBJECT_COUNT objects to dump"

# Create metadata file
METADATA_FILE="$DUMP_DIR/bucket-metadata.json"
print_status "Creating metadata file..."
cat > "$METADATA_FILE" << EOF
{
  "bucketName": "$BUCKET_NAME",
  "environment": "$ENVIRONMENT",
  "dumpDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "objectCount": $OBJECT_COUNT,
  "awsRegion": "$AWS_REGION",
  "endpointUrl": "$AWS_ENDPOINT_URL"
}
EOF
print_success "Metadata file created: $METADATA_FILE"

# Sync bucket contents to local directory
print_status "Downloading bucket contents..."
if aws_cmd s3 sync "s3://$BUCKET_NAME" "$DUMP_DIR/objects/" --exact-timestamps; then
    print_success "Bucket contents downloaded successfully"
else
    print_error "Failed to download bucket contents"
    exit 1
fi

# Create object listing with metadata
print_status "Creating detailed object listing..."
OBJECT_LIST_FILE="$DUMP_DIR/object-list.json"
aws_cmd s3api list-objects-v2 --bucket "$BUCKET_NAME" --output json > "$OBJECT_LIST_FILE"
print_success "Object listing created: $OBJECT_LIST_FILE"

# Create a summary
SUMMARY_FILE="$DUMP_DIR/dump-summary.txt"
print_status "Creating dump summary..."
cat > "$SUMMARY_FILE" << EOF
S3 Bucket Dump Summary
======================

Environment: $ENVIRONMENT
Bucket Name: $BUCKET_NAME
Dump Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Total Objects: $OBJECT_COUNT
Dump Directory: $DUMP_DIR

Contents:
- objects/: All bucket objects with original directory structure
- bucket-metadata.json: Bucket metadata and dump information
- object-list.json: Detailed listing of all objects with metadata
- dump-summary.txt: This summary file

To restore this dump, run: ./scripts/restore-s3-bucket.sh --env=$ENVIRONMENT
EOF

print_success "Dump summary created: $SUMMARY_FILE"

# Calculate total size
TOTAL_SIZE=$(find "$DUMP_DIR/objects" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
HUMAN_SIZE=$(numfmt --to=iec-i --suffix=B $TOTAL_SIZE 2>/dev/null || echo "${TOTAL_SIZE} bytes")

echo ""
print_success "🎉 S3 bucket dump completed successfully!"
echo ""
echo "📊 Dump Statistics:"
echo "  • Environment: $ENVIRONMENT"
echo "  • Bucket: $BUCKET_NAME"
echo "  • Objects: $OBJECT_COUNT"
echo "  • Total Size: $HUMAN_SIZE"
echo "  • Location: $DUMP_DIR"
echo ""
echo "📝 Files created:"
echo "  • $DUMP_DIR/objects/ - All bucket objects"
echo "  • $METADATA_FILE - Bucket metadata"
echo "  • $OBJECT_LIST_FILE - Object listing"
echo "  • $SUMMARY_FILE - Dump summary"
echo ""
echo "💡 Tip: You can now commit the '$DUMP_DIR' directory to your repo"
echo "💡 To restore: ./scripts/restore-s3-bucket.sh --env=$ENVIRONMENT"
