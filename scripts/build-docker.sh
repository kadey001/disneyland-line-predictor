#!/bin/bash

# Build Docker image locally for testing
set -e

# Configuration
PROJECT_ID="theme-park-wait-times-app"
REGION="us-west2"
REPO_NAME="nextjs-repo"
IMAGE_NAME="nextjs-app"

echo "🏗️  Building Docker image for local testing..."

# Build the Docker image
docker build -f Dockerfile.production -t $IMAGE_NAME:local .

echo "✅ Docker image built successfully!"
echo "🚀 To run locally: docker run -p 3000:3000 $IMAGE_NAME:local"
echo "🔗 To tag for registry: docker tag $IMAGE_NAME:local $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest"
