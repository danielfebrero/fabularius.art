#!/bin/bash

# Script to fix CloudFormation stack in ROLLBACK_COMPLETE state
set -e

# Default values
ENVIRONMENT="prod"
STACK_NAME=""
FORCE_DELETE=false

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
    echo "  -f, --force             Force delete without confirmation"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      # Fix prod stack (with confirmation)"
    echo "  $0 --env staging        # Fix staging stack"
    echo "  $0 --force              # Force delete prod stack without confirmation"
    echo ""
    echo "This script will:"
    echo "  1. Check if the stack is in ROLLBACK_COMPLETE state"
    echo "  2. Delete the stack if confirmed"
    echo "  3. Redeploy the stack using the deploy script"
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
    STACK_NAME="pornspot-art-$ENVIRONMENT"
    
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
    
    if [ "$STACK_STATUS" != "ROLLBACK_COMPLETE" ]; then
        print_warning "Stack is not in ROLLBACK_COMPLETE state."
        print_info "Current status: $STACK_STATUS"
        print_info "This script is only needed for stacks in ROLLBACK_COMPLETE state."
        exit 0
    fi
    
    print_warning "Stack $STACK_NAME is in ROLLBACK_COMPLETE state and needs to be deleted before redeployment."
}

confirm_deletion() {
    if [ "$FORCE_DELETE" = true ]; then
        print_warning "Force delete enabled. Skipping confirmation."
        return 0
    fi
    
    print_warning "🚨 STACK DELETION WARNING 🚨"
    print_warning "This will DELETE the entire CloudFormation stack: $STACK_NAME"
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

delete_stack() {
    print_status "Deleting CloudFormation stack: $STACK_NAME..."
    
    # Delete the stack
    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    
    print_status "Waiting for stack deletion to complete..."
    print_info "This may take several minutes..."
    
    # Wait for deletion to complete
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
    
    print_status "Stack $STACK_NAME deleted successfully ✓"
}

redeploy_stack() {
    print_status "Redeploying stack using deploy script..."
    
    # Check if deploy script exists
    if [ ! -f "scripts/deploy.sh" ]; then
        print_error "Deploy script not found: scripts/deploy.sh"
        print_error "Please run the deployment manually:"
        print_error "  sam build && sam deploy --config-env $ENVIRONMENT"
        exit 1
    fi
    
    # Make sure deploy script is executable
    chmod +x scripts/deploy.sh
    
    # Run deployment
    print_status "Running: ./scripts/deploy.sh --env $ENVIRONMENT"
    ./scripts/deploy.sh --env "$ENVIRONMENT"
    
    print_status "Stack redeployment completed ✓"
}

main() {
    parse_arguments "$@"
    
    print_status "🔧 Fixing CloudFormation stack in ROLLBACK_COMPLETE state..."
    print_info "Environment: $ENVIRONMENT"
    print_info "Stack Name: $STACK_NAME"
    echo ""
    
    check_stack_status
    confirm_deletion
    delete_stack
    redeploy_stack
    
    print_status "🎉 Stack fix completed successfully!"
    print_info "Your $ENVIRONMENT environment is now ready to use."
}

# Run main function with all arguments
main "$@"