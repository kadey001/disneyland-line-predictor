#!/bin/bash

# Script to set up Terraform state bucket and service account for GitHub Actions
# Run this script once to prepare your GCP project for CI/CD

set -e

# Configuration
PROJECT_ID="theme-park-wait-times-app"
BUCKET_NAME="theme-park-wait-times-terraform-state"
SA_NAME="github-terraform-sa"
REGION="us-west2"

echo "🚀 Setting up Terraform backend and GitHub Actions service account..."
echo "Project ID: $PROJECT_ID"
echo "Bucket Name: $BUCKET_NAME"
echo "Service Account: $SA_NAME"
echo "Region: $REGION"
echo

# Set the project
echo "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable storage.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# Create storage bucket for Terraform state
echo "🪣 Creating Terraform state bucket..."
if gsutil ls gs://$BUCKET_NAME >/dev/null 2>&1; then
    echo "   ✅ Bucket $BUCKET_NAME already exists"
else
    gsutil mb -l $REGION gs://$BUCKET_NAME
    echo "   ✅ Created bucket $BUCKET_NAME"
fi

# Enable versioning on the bucket
echo "📝 Enabling versioning on state bucket..."
gsutil versioning set on gs://$BUCKET_NAME

# Create service account for GitHub Actions
echo "👤 Creating service account for GitHub Actions..."
if gcloud iam service-accounts describe $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com >/dev/null 2>&1; then
    echo "   ✅ Service account $SA_NAME already exists"
else
    gcloud iam service-accounts create $SA_NAME \
        --display-name="GitHub Terraform Service Account" \
        --description="Service account for GitHub Actions Terraform deployments"
    echo "   ✅ Created service account $SA_NAME"
fi

# Grant necessary permissions
echo "🔐 Granting permissions to service account..."
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# Grant roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/editor" \
    --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.admin" \
    --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudscheduler.admin" \
    --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin" \
    --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/artifactregistry.admin" \
    --quiet

echo "   ✅ Granted necessary permissions"

# Create and download service account key
echo "🔑 Creating service account key..."
KEY_FILE="github-sa-key.json"
if [ -f "$KEY_FILE" ]; then
    echo "   ⚠️  Key file $KEY_FILE already exists. Skipping key creation."
    echo "   ℹ️  If you need a new key, delete the existing file and run this script again."
else
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=$SA_EMAIL
    echo "   ✅ Created service account key: $KEY_FILE"
fi

echo
echo "🎉 Setup complete!"
echo
echo "📋 Next steps:"
echo "1. Add the following secrets to your GitHub repository:"
echo "   - GCP_SA_KEY: Copy the entire content of $KEY_FILE"
echo "   - GCP_PROJECT_ID: $PROJECT_ID"
echo "   - GCP_PROJECT_NUMBER: $(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')"
echo "   - DATABASE_CONNECTION_STRING: Your PostgreSQL connection string"
echo "   - GCP_REGION: $REGION (optional, defaults to us-central1)"
echo
echo "2. To enable remote state backend, uncomment the backend configuration in providers.tf"
echo
echo "3. Keep the $KEY_FILE file secure and do not commit it to version control!"
echo
echo "ℹ️  See .github/TERRAFORM_SETUP.md for detailed instructions."
