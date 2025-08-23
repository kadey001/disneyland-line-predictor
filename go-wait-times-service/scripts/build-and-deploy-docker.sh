#!/bin/bash

# Script to build and deploy Docker image to Google Cloud Artifact Registry

set -e

echo "Building and deploying Docker image to Google Cloud Artifact Registry..."

# Configuration variables
PROJECT_ID="theme-park-wait-times-app"
REGION="us-west2"
REPOSITORY="wait-times-repo"
IMAGE_NAME="wait-times-service"
TAG="latest"

# Full image name
FULL_IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${TAG}"

echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Repository: $REPOSITORY"
echo "Image Name: $IMAGE_NAME"
echo "Tag: $TAG"
echo "Full Image: $FULL_IMAGE_NAME"
echo ""

# Change to the go-wait-times-service directory (where Dockerfile is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "ERROR: Dockerfile not found in current directory!"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Configure Docker to use gcloud as a credential helper
echo "Configuring Docker authentication..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build the Docker image
echo ""
echo "Building Docker image..."
docker build -t "$FULL_IMAGE_NAME" .

# Push the Docker image to Artifact Registry
echo ""
echo "Pushing Docker image to Artifact Registry..."
docker push "$FULL_IMAGE_NAME"

echo ""
echo "✅ Successfully built and deployed Docker image!"
echo "Image: $FULL_IMAGE_NAME"
echo ""
echo "You can now update your Cloud Run service to use this image."
echo ""
