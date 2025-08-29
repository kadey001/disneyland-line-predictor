# GitHub Actions Workflows

This directory contains automated deployment workflows for the Disneyland Line Predictor application.

## Current Workflow: Build and Deploy (`build-and-deploy.yml`)

**Triggers:**
- Push to main/master when go-services or terraform files change
- Manual trigger with environment selection

**Features:**
- Builds Docker images with SHA-based tags for version control
- Pushes to Google Artifact Registry
- Deploys infrastructure via Terraform
- Supports development, staging, and production environments
- Generates deployment summaries
- Optional Slack notifications

## Setup Requirements

### Required Secrets (GitHub Repository Settings > Secrets and variables > Actions)
- `GCP_SA_KEY` - Google Cloud Service Account JSON key

### Required Variables (GitHub Repository Settings > Secrets and variables > Actions > Variables)
- `GCP_PROJECT_ID` - Google Cloud Project ID

### Optional Variables
- `GCP_REGION` - Google Cloud region (default: us-west2)
- `ARTIFACT_REGISTRY_REPO` - Artifact Registry repository name (default: wait-times-repo)
- `SLACK_WEBHOOK` - Slack webhook URL for notifications

## Google Cloud Service Account Permissions
The service account needs these roles:
- Cloud Run Admin
- Artifact Registry Writer
- Storage Admin
- Service Account User

## Usage

### Automatic Deployment
Pushes to main/master automatically trigger deployment when:
- Go services code changes (`go-services/**`)
- Terraform configuration changes (`terraform/**`)
- Workflow file changes (`.github/workflows/build-and-deploy.yml`)

### Manual Deployment
1. Go to Actions tab in GitHub
2. Select "Build and Deploy with Terraform"
3. Click "Run workflow"
4. Choose environment (development/staging/production)
5. Optionally skip Docker build step

## Key Features

- **SHA-based Versioning**: Every deployment uses commit SHA for image tags
- **Cost Optimized**: Cloud Run services configured for minimal resource usage
- **Rollback Ready**: Easy rollback to any previous commit SHA
- **Multi-environment**: Separate deployments for dev/staging/production
- **Deployment Tracking**: Automatic generation of deployment summaries

## Troubleshooting

### Common Issues
- **Authentication**: Verify GCP_SA_KEY is valid and has required permissions
- **Build Failures**: Check Dockerfiles and ensure base images are accessible
- **Terraform Errors**: Review plan output and verify variable values

### Debug Mode
Set `ACTIONS_RUNNER_DEBUG=true` as a repository secret for detailed logs.
