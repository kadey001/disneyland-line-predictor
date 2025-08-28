#!/bin/bash
# Build and deploy script for Wait Times API Service
# Usage: ./scripts/deploy-wait-times-api.sh

set -e

# Configuration
PROJECT_ID=${PROJECT_ID:-"theme-park-wait-times-app"}
REGION=${REGION:-"us-west2"}
SERVICE_NAME=${SERVICE_NAME:-"wait-times-api"}
REPO_NAME=${REPO_NAME:-"wait-times-repo"}
IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest"

echo "Building and deploying Wait Times API Service..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Image: $IMAGE_NAME"

# Check if we're in the right directory
if [ ! -f "go-services/go.mod" ]; then
    echo "Error: Must run from project root directory"
    exit 1
fi

# Build and push Docker image
echo "Building Docker image..."
cd go-services

docker build -f wait-times-api/Dockerfile -t "$IMAGE_NAME" .

echo "Pushing Docker image to Artifact Registry..."
docker push "$IMAGE_NAME"

echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --max-instances=10 \
    --min-instances=0 \
    --port=8080 \
    --set-env-vars="GO_DATABASE_URL=${GO_DATABASE_URL}" \

echo "Deployment completed successfully!"

# Get and display service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --project="$PROJECT_ID" --format="value(status.url)")
echo "Service URL: $SERVICE_URL"
echo "Health Check: $SERVICE_URL/health"
echo "Wait Times Endpoint: $SERVICE_URL/wait-times"
