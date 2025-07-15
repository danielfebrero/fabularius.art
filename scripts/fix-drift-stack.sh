#!/bin/bash

# Script to fix CloudFormation stack with resource drift (manually deleted resources)
set -e

# Default values
ENVIRONMENT="prod"
STACK_NAME=""
FORCE_DELETE=false
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT    Target environment (dev, staging, prod) [default: prod]"
    echo "  -f, --force             Force delete stack without confirmation"
    echo "  -d, --dry-run           Show what would be done without executing"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      # Fix prod stack drift"
    echo "  $0 --env staging        # Fix staging stack drift"
    echo "  $0 --dry-run            # Show what would be done"
    echo "  $0 --force              # Force delete and redeploy without confirmation"
    echo ""
    echo "This script handles CloudFormation drift caused by manually deleted resources:"
    echo "  1. Check current stack status"
    echo "  2. Try to cancel ongoing rollback if applicable"
    echo "  3. Attempt to continue update with force"
    echo "  4. If all else fails, offer to delete and redeploy the stack"
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -f|--force)
                FORCE_DELETE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
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
    
    # Set stack name based on environment
    STACK_NAME="pornspot-ai-$ENVIRONMENT"
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        print_error "Invalid environment: $ENVIRONMENT"
        print_error "Supported environments: dev, staging, prod"
        exit 1
    fi
}

check_stack_status() {
    print_status "Checking stack status for $STACK_NAME..."
    
    # Get stack status
    STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "STACK_NOT_FOUND")
    
    if [ "$STACK_STATUS" = "STACK_NOT_FOUND" ]; then
        print_info "Stack $STACK_NAME does not exist. You can deploy normally."
        exit 0
    fi
    
    print_info "Current stack status: $STACK_STATUS"
    
    case "$STACK_STATUS" in
        "UPDATE_ROLLBACK_IN_PROGRESS")
            print_warning "Stack is currently rolling back from a failed update."
            print_info "We'll wait for rollback to complete, then proceed with fix."
            ;;
        "UPDATE_ROLLBACK_COMPLETE"|"UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS")
            print_warning "Stack rollback completed. Ready to fix drift."
            ;;
        "UPDATE_ROLLBACK_FAILED")
            print_error "Stack rollback failed. Manual intervention may be required."
            ;;
        "ROLLBACK_COMPLETE")
            print_warning "Stack is in ROLLBACK_COMPLETE state."
            print_info "Consider using fix-rollback-stack.sh instead."
            ;;
        "CREATE_COMPLETE"|"UPDATE_COMPLETE")
            print_warning "Stack appears to be in a stable state."
            print_info "If you're experiencing issues, there may be resource drift."
            ;;
        *)
            print_warning "Stack is in state: $STACK_STATUS"
            ;;
    esac
}

wait_for_rollback_completion() {
    if [[ "$STACK_STATUS" == "UPDATE_ROLLBACK_IN_PROGRESS" ]]; then
        print_status "Waiting for rollback to complete..."
        print_info "This may take several minutes..."
        
        if [ "$DRY_RUN" = true ]; then
            print_info "[DRY RUN] Would wait for stack rollback completion"
            return 0
        fi
        
        # Wait for rollback to complete
        aws cloudformation wait stack-update-rollback-complete --stack-name "$STACK_NAME" || true
        
        # Get updated status
        STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null)
        print_info "Stack status after rollback: $STACK_STATUS"
    fi
}

attempt_force_update() {
    print_status "Attempting to force update the stack..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would run: sam build && sam deploy --config-env $ENVIRONMENT --force-upload --no-confirm-changeset"
        return 0
    fi
    
    print_info "Building SAM application..."
    sam build
    
    print_info "Deploying with force upload..."
    if sam deploy --config-env "$ENVIRONMENT" --force-upload --no-confirm-changeset; then
        print_status "Force update successful! ✓"
        return 0
    else
        print_error "Force update failed."
        return 1
    fi
}

detect_drift() {
    print_status "Checking for stack drift..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would detect stack drift"
        return 0
    fi
    
    # Start drift detection
    DRIFT_DETECTION_ID=$(aws cloudformation detect-stack-drift --stack-name "$STACK_NAME" --query 'StackDriftDetectionId' --output text)
    
    print_info "Drift detection started (ID: $DRIFT_DETECTION_ID)"
    print_info "Waiting for drift detection to complete..."
    
    # Wait for drift detection to complete
    aws cloudformation wait stack-drift-detection-complete --stack-drift-detection-id "$DRIFT_DETECTION_ID"
    
    # Get drift results
    DRIFT_STATUS=$(aws cloudformation describe-stack-drift-detection-status --stack-drift-detection-id "$DRIFT_DETECTION_ID" --query 'StackDriftStatus' --output text)
    
    print_info "Drift detection status: $DRIFT_STATUS"
    
    if [ "$DRIFT_STATUS" = "DRIFTED" ]; then
        print_warning "Stack has drifted resources. Showing drift details..."
        
        # Show drifted resources
        aws cloudformation describe-stack-resource-drifts --stack-name "$STACK_NAME" --stack-resource-drift-status-filters MODIFIED DELETED --query 'StackResourceDrifts[].{ResourceType:ResourceType,LogicalId:LogicalResourceId,Status:StackResourceDriftStatus}' --output table
        
        return 1
    else
        print_status "No drift detected."
        return 0
    fi
}

confirm_stack_deletion() {
    if [ "$FORCE_DELETE" = true ]; then
        print_warning "Force delete enabled. Skipping confirmation."
        return 0
    fi
    
    print_warning "🚨 STACK DELETION WARNING 🚨"
    print_warning "All previous attempts have failed. The only remaining option is to:"
    print_warning "DELETE the entire CloudFormation stack: $STACK_NAME"
    print_warning "This action will remove:"
    print_warning "  - DynamoDB table and ALL data"
    print_warning "  - S3 bucket and ALL media files"
    print_warning "  - Lambda functions"
    print_warning "  - API Gateway"
    print_warning "  - CloudFront distribution"
    print_warning "  - All other AWS resources in the stack"
    echo ""
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        print_error "⚠️  PRODUCTION ENVIRONMENT ⚠️"
        print_error "You are about to delete the PRODUCTION stack!"
        print_error "This will result in DATA LOSS and SERVICE DOWNTIME!"
        echo ""
    fi
    
    read -p "Are you absolutely sure you want to delete stack $STACK_NAME? (type 'DELETE' to confirm): " confirm
    if [[ $confirm != "DELETE" ]]; then
        print_status "Deletion cancelled."
        exit 0
    fi
    
    # Double confirmation for production
    if [ "$ENVIRONMENT" = "prod" ]; then
        echo ""
        read -p "This is PRODUCTION. Type 'DELETE PRODUCTION' to confirm: " prod_confirm
        if [[ $prod_confirm != "DELETE PRODUCTION" ]]; then
            print_status "Production deletion cancelled."
            exit 0
        fi
    fi
}

delete_and_redeploy() {
    print_status "Deleting and redeploying stack..."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would delete and redeploy stack"
        return 0
    fi
    
    # Use the existing fix-rollback-stack.sh script
    if [ -f "scripts/fix-rollback-stack.sh" ]; then
        chmod +x scripts/fix-rollback-stack.sh
        if [ "$FORCE_DELETE" = true ]; then
            ./scripts/fix-rollback-stack.sh --env "$ENVIRONMENT" --force
        else
            ./scripts/fix-rollback-stack.sh --env "$ENVIRONMENT"
        fi
    else
        print_error "fix-rollback-stack.sh script not found"
        print_info "Manual steps required:"
        print_info "1. aws cloudformation delete-stack --stack-name $STACK_NAME"
        print_info "2. aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME"
        print_info "3. sam build && sam deploy --config-env $ENVIRONMENT"
        exit 1
    fi
}

main() {
    parse_arguments "$@"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "🔍 DRY RUN MODE - No actual changes will be made"
    fi
    
    print_status "🔧 Fixing CloudFormation stack drift..."
    print_info "Environment: $ENVIRONMENT"
    print_info "Stack Name: $STACK_NAME"
    echo ""
    
    check_stack_status
    wait_for_rollback_completion
    
    # Try different approaches in order of preference
    print_status "Attempting automated fixes..."
    
    # Method 1: Force update
    print_info "Method 1: Attempting force update..."
    if attempt_force_update; then
        print_status "🎉 Stack fixed successfully with force update!"
        exit 0
    fi
    
    # Method 2: Check for drift and continue if no major issues
    print_info "Method 2: Checking for drift..."
    if detect_drift; then
        print_status "No drift detected. Stack should be stable now."
        exit 0
    fi
    
    # Method 3: Last resort - delete and redeploy
    print_warning "All automated fixes failed."
    print_warning "Manual deletion and redeployment required."
    
    if [ "$DRY_RUN" = true ]; then
        print_info "[DRY RUN] Would prompt for stack deletion and redeployment"
        exit 0
    fi
    
    echo ""
    read -p "Proceed with stack deletion and redeployment? (y/N): " proceed
    if [[ $proceed =~ ^[Yy]$ ]]; then
        confirm_stack_deletion
        delete_and_redeploy
        print_status "🎉 Stack fixed successfully!"
    else
        print_info "Manual intervention required. Stack remains in current state."
        print_info "You may need to:"
        print_info "1. Check AWS Console for specific resource issues"
        print_info "2. Manually delete problematic resources"
        print_info "3. Try deploying again"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"