#!/usr/bin/env bash
set -euo pipefail

# Usage: ./deploy-live-data-collector.sh PROJECT REGION IMAGE_TAG
# Example: ./deploy-live-data-collector.sh my-project us-west1 v1

PROJECT=${1:-}
REGION=${2:-us-west1}
IMAGE_TAG=${3:-latest}

if [ -z "$PROJECT" ]; then
  echo "Usage: $0 PROJECT [REGION] [IMAGE_TAG]"
  exit 1
fi

IMAGE_LOCATION=${REGION}-docker.pkg.dev
# Terraform expects images in the wait-times repo
IMAGE="${IMAGE_LOCATION}/${PROJECT}/wait-times-repo/live-data-collector:${IMAGE_TAG}"

# Build and push with Cloud Build
gcloud builds submit --config cloudbuild.yaml --substitutions=_IMAGE=${IMAGE}

# Deploy to Cloud Run
gcloud run deploy live-data-collector \
  --image ${IMAGE} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="${DATABASE_URL:-}" \
  --project ${PROJECT}

echo "Deployed ${IMAGE} to Cloud Run in ${REGION}"
