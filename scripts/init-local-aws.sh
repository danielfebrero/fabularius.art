#!/bin/bash

# Stop on any error
set -e

# --- Configuration ---
AWS_REGION="us-east-1"
AWS_ENDPOINT_URL="http://localhost:4566"
BUCKET_NAME="local-pornspot-media"
CORS_CONFIG_FILE="scripts/local-s3-cors.json"

# --- Helper Functions ---
log() {
  echo "[INFO] $1"
}

aws_cmd() {
  AWS_ACCESS_KEY_ID=test \
  AWS_SECRET_ACCESS_KEY=test \
  aws --region "$AWS_REGION" --endpoint-url="$AWS_ENDPOINT_URL" "$@"
}

# --- Main Script ---
log "Starting AWS resources initialization..."

# 1. Wait for LocalStack to be ready
log "Waiting for LocalStack services to become available..."
aws_cmd s3 wait bucket-exists --bucket some-random-bucket-that-does-not-exist 2>/dev/null || true
log "LocalStack is ready."

# 2. Create S3 Bucket
if aws_cmd s3api head-bucket --bucket "$BUCKET_NAME" >/dev/null 2>&1; then
  log "S3 bucket '$BUCKET_NAME' already exists."
else
  log "Creating S3 bucket: $BUCKET_NAME"
  aws_cmd s3api create-bucket --bucket "$BUCKET_NAME" --region "$AWS_REGION"
  log "S3 bucket created."
fi

# 3. Apply CORS policy to the S3 bucket
log "Applying CORS policy to bucket: $BUCKET_NAME"
aws_cmd s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration "file://$CORS_CONFIG_FILE"
log "CORS policy applied successfully."

log "AWS resources for local development are ready."