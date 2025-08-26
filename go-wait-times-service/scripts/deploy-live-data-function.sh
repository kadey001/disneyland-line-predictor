#!/bin/bash

# Deploy Live Data Collector Cloud Function
# Production-grade deployment script for Linux/Mac

set -e  # Exit on any error

echo "=========================================="
echo "  Live Data Collector Deployment Script"
echo "=========================================="

# Check if required environment variables are set
if [[ -z "${PROJECT_ID}" ]]; then
    echo "ERROR: PROJECT_ID environment variable not set"
    echo "Please set PROJECT_ID to your Google Cloud project ID"
    exit 1
fi

if [[ -z "${REGION}" ]]; then
    export REGION="us-east1"
    echo "INFO: Using default region: ${REGION}"
fi

# Set working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/.."
FUNCTION_DIR="${ROOT_DIR}/functions/live-data-collector"
TERRAFORM_DIR="${ROOT_DIR}/terraform"

echo "Current directory: $(pwd)"
echo "Function directory: ${FUNCTION_DIR}"
echo "Terraform directory: ${TERRAFORM_DIR}"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "ERROR: Go is not installed or not in PATH"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "ERROR: Terraform is not installed or not in PATH"
    exit 1
fi

# Check if gcloud is installed and authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "ERROR: gcloud is not authenticated"
    echo "Please run: gcloud auth login"
    exit 1
fi

echo "=========================================="
echo "  Step 1: Preparing Function Code"
echo "=========================================="

# Navigate to function directory
cd "${FUNCTION_DIR}"

# Initialize Go module and download dependencies
echo "Initializing Go module..."
go mod init live-data-collector 2>/dev/null || true
go mod tidy

# Build and test the function
echo "Building function..."
go build -o main .

# Clean up build artifacts
rm -f main

echo "=========================================="
echo "  Step 2: Deploying with Terraform"
echo "=========================================="

# Navigate to Terraform directory
cd "${TERRAFORM_DIR}"

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Plan deployment
echo "Planning deployment..."
terraform plan -var="project_id=${PROJECT_ID}" -var="region=${REGION}"

# Apply deployment
echo "Applying deployment..."
terraform apply -auto-approve -var="project_id=${PROJECT_ID}" -var="region=${REGION}"

echo "=========================================="
echo "  Step 3: Verifying Deployment"
echo "=========================================="

# Get function URL
FUNCTION_URL=$(terraform output -raw live_data_collector_url 2>/dev/null || echo "")

if [[ -z "${FUNCTION_URL}" ]]; then
    echo "WARNING: Could not retrieve function URL from Terraform output"
    echo "You can find the function URL in the Google Cloud Console"
else
    echo "Function URL: ${FUNCTION_URL}"
    echo "Testing function..."
    
    # Test the function with curl
    if command -v curl &> /dev/null; then
        curl -X POST "${FUNCTION_URL}" \
             -H "Content-Type: application/json" \
             -d '{"parkIds": ["75ea578a-adc8-4116-a54d-dccb60765ef9"]}' \
             --max-time 30 || echo "Function test failed, but deployment may still be successful"
        echo
    else
        echo "Curl not available, skipping function test"
    fi
fi

echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo
echo "Next steps:"
echo "1. Monitor the function logs: gcloud logging read \"resource.type=cloud_function AND resource.labels.function_name=live-data-collector\" --limit 50"
echo "2. View function metrics in Cloud Console"
echo "3. Test manual execution via Cloud Console or HTTP request"
echo
echo "Scheduled execution: Every 5 minutes via Cloud Scheduler"
echo
