# Terraform Infrastructure

This directory contains Terraform configurations for deploying the Disneyland Line Predictor application to Google Cloud Platform.

## Overview

The Terraform configuration manages the following resources:
- Google Cloud Functions for the Go microservices
- Cloud Storage buckets for function source code
- IAM roles and permissions
- API Gateway (if needed)
- Cloud Build triggers for CI/CD

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) v1.0+
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Authenticated Google Cloud account with appropriate permissions

## Quick Start

1. **Authenticate with Google Cloud:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Initialize Terraform:**
   ```bash
   cd terraform
   terraform init
   ```

3. **Review the plan:**
   ```bash
   terraform plan
   ```

4. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Configuration

Create a `terraform.tfvars` file with your specific values:

```hcl
project_id = "your-gcp-project-id"
region     = "us-central1"
```

## Resources Created

### Live Data Collector Function
- **Function Name**: `live-data-collector`
- **Trigger**: HTTP requests
- **Runtime**: Go 1.21
- **Purpose**: Collects live wait time data from external APIs

### Wait Times API Function
- **Function Name**: `wait-times-api`
- **Trigger**: HTTP requests
- **Runtime**: Go 1.21
- **Purpose**: Serves wait time data via REST API

### Storage Buckets
- Source code storage for Cloud Functions
- Automatic versioning enabled

## Deployment Scripts

The `../scripts/` directory contains deployment scripts that work with this Terraform configuration:

- `deploy-live-data-collector.sh` - Deploy the live data collector function
- `deploy-wait-times-api.sh` - Deploy the wait times API function
- `deploy-all.sh` - Deploy all services

## Environment Variables

The functions require the following environment variables:
- `DATABASE_URL` - PostgreSQL connection string

## Monitoring

After deployment, you can monitor your functions in the Google Cloud Console:
- [Cloud Functions](https://console.cloud.google.com/functions)
- [Cloud Logging](https://console.cloud.google.com/logs)
- [Cloud Monitoring](https://console.cloud.google.com/monitoring)

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure your account has the necessary IAM roles
2. **Function Timeout**: Check function logs and consider increasing timeout limits
3. **Database Connection**: Verify DATABASE_URL is correctly set and accessible

### Logs

View function logs:
```bash
gcloud functions logs read FUNCTION_NAME --region=REGION
```

## Cost Optimization

- Functions are billed per invocation and compute time
- Consider function memory allocation based on your needs
- Use appropriate timeout values to avoid unnecessary costs

## Security

- Functions use least-privilege IAM roles
- Database credentials are stored as environment variables
- Consider using Secret Manager for sensitive data in production
