# Terraform Infrastructure

This directory contains Terraform configurations for deploying the Disneyland Line Predictor application to Google Cloud Platform.

## Overview

The Terraform configuration manages the following resources:
- Google Cloud Run services for the Go microservices
- Cloud SQL PostgreSQL instance for data storage
- Artifact Registry for Docker images
- IAM roles and permissions
- Cloud Scheduler for periodic data collection
- Secret Manager for database credentials

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

### Cloud SQL Instance
- **Instance Name**: `wait-times-db`
- **Database Version**: PostgreSQL 15
- **Tier**: `db-f1-micro` (cost-optimized)

### Live Data Collector Service (Cloud Run)
- **Service Name**: `live-data-collector-service`
- **Purpose**: Collects live wait time data from external APIs

### Wait Times API Service (Cloud Run)
- **Service Name**: `wait-times-api`
- **Purpose**: Serves wait time data via REST API

### Artifact Registry
- Docker repository for service images

## Deployment Scripts

The `../scripts/` directory contains deployment scripts that work with this Terraform configuration:

- `deploy-live-data-collector.sh` - Deploy the live data collector function
- `deploy-wait-times-api.sh` - Deploy the wait times API function
- `deploy-all.sh` - Deploy all services

## Local Database Access

For security, the database is not accessible via public IP without the Cloud SQL Auth Proxy. To connect from your local machine:

1. **Install the Cloud SQL Auth Proxy**:
   Download it from [Google Cloud documentation](https://cloud.google.com/sql/docs/postgres/sql-proxy#install).

2. **Start the Proxy**:
   ```bash
   # Replace PROJECT_ID and REGION with your values
   ./cloud-sql-proxy PROJECT_ID:REGION:wait-times-db
   ```

3. **Connect via Localhost**:
   The proxy will listen on `127.0.0.1:5432`. You can now use your `DATABASE_URL` from `.env`:
   `postgresql://app:PASSWORD@localhost:5432/wait_times`

## Environment Variables

The services require the following environment variables:
- `DATABASE_URL` - PostgreSQL connection string

## Monitoring

After deployment, you can monitor your services in the Google Cloud Console:
- [Cloud Run](https://console.cloud.google.com/run)
- [Cloud SQL](https://console.cloud.google.com/sql/instances)
- [Cloud Logging](https://console.cloud.google.com/logs)
- [Cloud Monitoring](https://console.cloud.google.com/monitoring)

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure your account has the `roles/cloudsql.client` role.
2. **Connection Refused**: Ensure the Cloud SQL Auth Proxy is running locally.
3. **Database Connection**: Verify `DATABASE_URL` in Secret Manager is correctly formatted for Cloud Run (using the UNIX socket).

### Logs

View service logs:
```bash
gcloud beta run services logs read SERVICE_NAME --region=REGION
```

## Cost Optimization

- Functions are billed per invocation and compute time
- Consider function memory allocation based on your needs
- Use appropriate timeout values to avoid unnecessary costs

## Security

- Functions use least-privilege IAM roles
- Database credentials are stored as environment variables
- Consider using Secret Manager for sensitive data in production
