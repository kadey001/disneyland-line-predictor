#!/bin/bash

# Terraform deployment script for Google Cloud

set -e

echo "Deploying Wait Times service to Google Cloud..."
echo "Database connection string will be read from Google Secret Manager"
echo ""

# Change to terraform directory (relative to script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../terraform"

# Check if terraform.tfvars exists and update it if needed
if [ ! -f "terraform.tfvars" ]; then
    echo "Creating terraform.tfvars from template..."
    if [ -f "terraform.tfvars.example" ]; then
        cp terraform.tfvars.example terraform.tfvars
    else
        echo "Warning: terraform.tfvars.example not found"
    fi
    echo ""
    echo "⚠️  Please review terraform.tfvars and update any required settings"
    echo "The database connection string will be securely managed via environment variable"
    echo ""
fi

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

if [ $? -ne 0 ]; then
    echo "Terraform init failed!"
    exit 1
fi

# Plan and apply the deployment automatically
echo "Planning and applying Terraform deployment..."
terraform apply -auto-approve

if [ $? -ne 0 ]; then
    echo "❌ Terraform apply failed!"
    exit 1
fi

echo "✅ Deployment completed successfully!"
echo "The database connection string is securely stored in Google Secret Manager"
echo "Check the outputs above for service URLs and other details."

# Return to scripts directory
cd "$SCRIPT_DIR"
