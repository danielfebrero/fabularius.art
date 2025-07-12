#!/bin/bash

# Script to continue update rollback for CloudFormation stack in ROLLBACK_COMPLETE state
set -e

# Default values
ENVIRONMENT="prod"
STACK_NAME=""

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
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      # Continue rollback for prod stack"
    echo "  $0 --env staging        # Continue rollback for staging stack"
    echo ""
    echo "This script will:"
    echo "  1. Check if the stack is in ROLLBACK_COMPLETE state"
    echo "  2. Continue the update rollback to get stack back to stable state"
    echo "  3. Redeploy the stack using the deploy script"
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENVIRONMENT="$2"
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
    
    # Set stack name based on environment
    STACK_NAME="fabularius-art-$ENVIRONMENT"
    
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
    
    print_status "Stack $STACK_NAME is in ROLLBACK_COMPLETE state. Attempting to continue rollback..."
}

continue_update_rollback() {
    print_status "Continuing update rollback for stack: $STACK_NAME..."
    
    # Try to continue the update rollback
    aws cloudformation continue-update-rollback --stack-name "$STACK_NAME" || {
        print_error "Failed to continue update rollback."
        print_error "This might happen if there are resources that can't be rolled back."
        print_error "You may need to:"
        print_error "  1. Check the CloudFormation console for specific errors"
        print_error "  2. Manually fix any stuck resources"
        print_error "  3. Use the delete-and-recreate approach instead"
        print_error ""
        print_error "To delete and recreate the stack, run:"
        print_error "  ./scripts/fix-rollback-stack.sh --env $ENVIRONMENT"
        exit 1
    }
    
    print_status "Waiting for rollback to complete..."
    print_info "This may take several minutes..."
    
    # Wait for the rollback to complete
    aws cloudformation wait stack-rollback-complete --stack-name "$STACK_NAME" || {
        print_error "Rollback did not complete successfully."
        print_error "Check the CloudFormation console for details."
        exit 1
    }
    
    print_status "Rollback completed successfully ✓"
    
    # Check final status
    FINAL_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text)
    print_info "Final stack status: $FINAL_STATUS"
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
    
    print_status "🔧 Continuing update rollback for CloudFormation stack..."
    print_info "Environment: $ENVIRONMENT"
    print_info "Stack Name: $STACK_NAME"
    echo ""
    
    check_stack_status
    continue_update_rollback
    redeploy_stack
    
    print_status "🎉 Stack recovery completed successfully!"
    print_info "Your $ENVIRONMENT environment is now ready to use."
}

# Run main function with all arguments
main "$@"