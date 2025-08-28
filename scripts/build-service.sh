#!/bin/bash

# Manual Cloud Build trigger script for individual services
# Usage: ./scripts/build-service.sh <service-name>
# Example: ./scripts/build-service.sh live-data-collector-service

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <service-name>"
    echo "Available services: live-data-collector-service, wait-times-api"
    exit 1
fi

SERVICE_NAME=$1
PROJECT_ID="theme-park-wait-times-app"
REGION="us-west2"
TRIGGER_NAME="${SERVICE_NAME}-build"

echo "🚀 Triggering Cloud Build for ${SERVICE_NAME}..."
echo "Project: ${PROJECT_ID}"
echo "Trigger: ${TRIGGER_NAME}"

# Trigger Cloud Build
gcloud builds triggers run ${TRIGGER_NAME} \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --branch=master

echo "✅ Cloud Build triggered successfully!"
echo "🔍 Check build status: https://console.cloud.google.com/cloud-build/builds?project=${PROJECT_ID}"
