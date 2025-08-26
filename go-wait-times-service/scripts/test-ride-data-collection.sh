#!/bin/bash

# Test the new ride data history functionality
# Linux/Mac shell script for testing

set -e

echo "=========================================="
echo "  Ride Data History Test Script"
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

echo "Testing ride data collection functionality..."
echo

# Set working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/.."
FUNCTION_DIR="${ROOT_DIR}/functions/live-data-collector"

echo "Function directory: ${FUNCTION_DIR}"

# Test 1: Build the Go function
echo "=========================================="
echo "  Test 1: Building Go Function"
echo "=========================================="

cd "${FUNCTION_DIR}"

echo "Initializing Go module..."
go mod init live-data-collector 2>/dev/null || true
go mod tidy

echo "Building function..."
if go build -o test-main .; then
    echo "SUCCESS: Function built successfully"
    rm -f test-main
else
    echo "ERROR: Failed to build function"
    exit 1
fi

# Test 2: Validate database schema
echo "=========================================="
echo "  Test 2: Validating Database Schema"
echo "=========================================="

cd "${ROOT_DIR}"
echo "Checking Prisma schema..."
if npx prisma validate; then
    echo "SUCCESS: Prisma schema is valid"
else
    echo "ERROR: Prisma schema validation failed"
    exit 1
fi

echo "Generating Prisma client..."
if npx prisma generate >/dev/null 2>&1; then
    echo "SUCCESS: Prisma client generated"
else
    echo "ERROR: Failed to generate Prisma client"
    exit 1
fi

# Test 3: Test API endpoint (if available)
echo "=========================================="
echo "  Test 3: Testing API Endpoints"
echo "=========================================="

echo "Testing themeparks.wiki API..."
if command -v curl &> /dev/null; then
    echo "Making test API call..."
    if curl -s -X GET "https://api.themeparks.wiki/v1/entity/75ea578a-adc8-4116-a54d-dccb60765ef9/live" \
           -H "Accept: application/json" \
           -H "User-Agent: DisnelyandLinePredictor/1.0" \
           --max-time 10 >/dev/null; then
        echo "SUCCESS: API endpoint is accessible"
    else
        echo "WARNING: API endpoint test failed"
    fi
else
    echo "INFO: Curl not available, skipping API test"
fi

echo "=========================================="
echo "  Test Results Summary"
echo "=========================================="
echo
echo "All tests completed successfully!"
echo
echo "Next steps:"
echo "1. Deploy function: ./deploy-live-data-function.sh"
echo "2. Monitor logs: gcloud logging read \"resource.type=cloud_function\" --limit 50"
echo "3. Test manual execution via Cloud Console"
echo
