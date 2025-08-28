#!/bin/bash

# Build and deploy script for Live Data Collector Service
# Usage: ./scripts/deploy-live-data-collector.sh

set -e

# Configuration
PROJECT_ID="theme-park-wait-times-app"
REGION="us-west2"
SERVICE_NAME="live-data-collector-service"
REPO_NAME="wait-times-repo"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

echo "Building and deploying Live Data Collector Service..."
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo "Image: ${IMAGE_NAME}"

# Check if we're in the right directory
if [ ! -f "go-services/go.mod" ]; then
    echo "Error: Must run from project root directory"
    exit 1
fi

# Build and push Docker image
echo "Building Docker image..."
cd go-services
docker build -f live-data-collector-service/Dockerfile -t ${IMAGE_NAME} .

echo "Pushing Docker image to Artifact Registry..."
docker push ${IMAGE_NAME}

echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image=${IMAGE_NAME} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --max-instances=2 \
    --min-instances=1

echo "Deployment completed successfully!"
echo "Service URL: $(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format='value(status.url)')"
