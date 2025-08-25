#!/bin/bash

# Complete deployment script: Build Docker image and deploy with Terraform

set -e

echo "========================================"
echo "🚀 Complete Deployment with Manual Secrets"
echo "========================================"
echo "Docker build + Terraform deploy"
echo "Database secrets managed via Google Secret Manager"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Step 1: Build and push Docker image
echo "========================================"
echo "Step 1: Building and pushing Docker image"
echo "========================================"
bash "$SCRIPT_DIR/build-and-deploy-docker.sh"

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Docker build and push failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "Step 2: Deploying infrastructure with Terraform"
echo "========================================"

# Step 2: Deploy with Terraform (no environment variables needed)
bash "$SCRIPT_DIR/deploy-gcloud.sh"

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Terraform deployment failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "Step 3: Ensuring Cloud Run uses latest image"
echo "========================================"

# Configuration variables (must match build script)
PROJECT_ID="theme-park-wait-times-app"
REGION="us-west2"
SERVICE_NAME="wait-times-service"

echo "Forcing Cloud Run to deploy latest image revision..."
gcloud run deploy "$SERVICE_NAME" \
  --image "us-west2-docker.pkg.dev/$PROJECT_ID/wait-times-repo/$SERVICE_NAME:latest" \
  --region "$REGION" \
  --quiet

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Cloud Run deployment failed!"
    exit 1
fi

echo ""
echo "========================================="
echo "🎉 Complete Deployment Successful!"
echo "========================================="
echo "Your Go wait times service has been successfully deployed to Google Cloud Run."
echo ""
echo "Next steps:"
echo "1. Run the verification script to test the deployment:"
echo "   ./verify-deployment.sh"
echo ""
echo "2. Test the service endpoints:"
echo "   - Health check: Check the service URL + /health"
echo "   - Wait times data: Check the service URL + /wait-times"
echo ""
echo "The service will automatically collect Disney wait times data every 2 minutes."
echo "Database credentials are securely managed via Google Secret Manager."
