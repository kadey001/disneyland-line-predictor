#!/bin/bash

# Script to verify Cloud Run service status and image version

set -e

echo ""
echo "================================================"
echo "   Cloud Run Service Verification"
echo "================================================"
echo ""

# Configuration variables
PROJECT_ID="theme-park-wait-times-app"
REGION="us-west2"
SERVICE_NAME="wait-times-service"
EXPECTED_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/wait-times-repo/$SERVICE_NAME:latest"

echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Expected Image: $EXPECTED_IMAGE"
echo ""

echo "Checking service status..."
echo "================================================"

# Get service URL
echo "Getting service URL..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)" 2>/dev/null || echo "")

if [ -z "$SERVICE_URL" ]; then
    echo "ERROR: Service '$SERVICE_NAME' not found in region '$REGION'"
    exit 1
fi

echo "Service URL: $SERVICE_URL"

# Get current image
echo ""
echo "Getting current image..."
CURRENT_IMAGE=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(spec.template.spec.containers[0].image)" 2>/dev/null || echo "")

echo "Current Image: $CURRENT_IMAGE"

# Check if using expected image
echo ""
if [ "$CURRENT_IMAGE" = "$EXPECTED_IMAGE" ]; then
    echo "✅ SUCCESS: Service is using the expected image!"
else
    echo "⚠️  WARNING: Image mismatch!"
    echo "   Expected: $EXPECTED_IMAGE"
    echo "   Current:  $CURRENT_IMAGE"
fi

# Get service ready condition
echo ""
echo "Getting service status..."
SERVICE_STATUS=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.conditions[0].status)" 2>/dev/null || echo "Unknown")

if [ "$SERVICE_STATUS" = "True" ]; then
    echo "✅ SUCCESS: Service is ready and serving traffic!"
else
    echo "⚠️  WARNING: Service status: $SERVICE_STATUS"
fi

# Get latest revision name and status
echo ""
echo "Getting latest revision info..."
LATEST_REVISION=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.latestReadyRevisionName)" 2>/dev/null || echo "Unknown")
echo "Latest Ready Revision: $LATEST_REVISION"

# Test health endpoint
echo ""
echo "Testing health endpoint..."
echo "================================================"

HEALTH_URL="$SERVICE_URL/health"
echo "Health Check URL: $HEALTH_URL"

# Use curl to test the health endpoint
if command -v curl &> /dev/null; then
    echo "Testing with curl..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ SUCCESS: Health check passed (HTTP $HTTP_STATUS)"
        
        # Show the health response
        echo ""
        echo "Health check response:"
        curl -s "$HEALTH_URL" | head -c 200
        echo ""
    else
        echo "❌ FAILED: Health check failed (HTTP $HTTP_STATUS)"
    fi
else
    echo "curl not available, skipping health check test"
    echo "You can manually test: $HEALTH_URL"
fi

# Test wait-times endpoint
echo ""
echo "Testing wait-times endpoint (first 200 chars)..."
echo "================================================"

WAIT_TIMES_URL="$SERVICE_URL/wait-times"
echo "Wait Times URL: $WAIT_TIMES_URL"

if command -v curl &> /dev/null; then
    echo "Testing with curl..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WAIT_TIMES_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ SUCCESS: Wait times endpoint responded (HTTP $HTTP_STATUS)"
        
        # Show first part of the response
        echo ""
        echo "Wait times response preview:"
        curl -s "$WAIT_TIMES_URL" | head -c 200
        echo "..."
        echo ""
    else
        echo "❌ FAILED: Wait times endpoint failed (HTTP $HTTP_STATUS)"
    fi
else
    echo "curl not available, skipping wait times test"
    echo "You can manually test: $WAIT_TIMES_URL"
fi

# Summary
echo ""
echo "================================================"
echo "   Verification Summary"
echo "================================================"
echo ""
echo "Service URL: $SERVICE_URL"
echo "Health Check: $SERVICE_URL/health"
echo "Wait Times: $SERVICE_URL/wait-times"
echo "Manual Collection: $SERVICE_URL/collect (POST)"
echo ""
echo "Cloud Run Console:"
echo "https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
echo ""
echo "Logs:"
echo "gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=20"
