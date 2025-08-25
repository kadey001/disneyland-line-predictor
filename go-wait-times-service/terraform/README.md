# Terraform Deployment - Wait Times Service

This Terraform configuration deploys the Disney wait times service to Google Cloud Platform using Cloud Run.

## 🏗️ Architecture Overview

The deployment creates:

- **Cloud Run Service**: Self-scheduling container that collects Disney wait times every 2 minutes
- **Artifact Registry**: Docker repository for storing container images
- **Service Account**: IAM identity with minimal required permissions
- **Secret Manager Integration**: Secure database connection string storage
- **Auto-scaling**: 1-2 instances based on demand

### Key Features

- ✅ **Self-scheduling**: No external scheduler needed - runs continuously with internal 2-minute intervals
- ✅ **Graceful shutdown**: Proper handling of data collection interruptions
- ✅ **Minimal permissions**: Service account with only necessary IAM roles
- ✅ **Public access**: Service endpoint available for testing and monitoring

## 📋 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Terraform** installed (>= 1.0)
3. **Google Cloud CLI** (`gcloud`) installed and authenticated
4. **Database**: PostgreSQL database with connection string stored in Secret Manager

### Required GCP APIs

The following APIs will be automatically enabled:
- Cloud Run API
- Cloud Build API
- Artifact Registry API
- Secret Manager API

## 🚀 Quick Start

### 1. Setup Configuration

```bash
# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
```

### 2. Configure Variables

Edit `terraform.tfvars`:

```hcl
project_id     = "your-gcp-project-id"
project_number = "your-project-number"
region         = "us-west2"
environment    = "dev"
```

### 3. Authenticate with GCP

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project your-gcp-project-id
```

### 4. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the changes
terraform apply
```

## 🛠️ Common Commands

### Initial Setup
```bash
# Initialize Terraform backend and download providers
terraform init

# Validate configuration syntax
terraform validate

# Format Terraform files
terraform fmt
```

### Deployment
```bash
# Preview changes before applying
terraform plan

# Apply changes with auto-approval
terraform apply -auto-approve

# Apply with specific variable file
terraform apply -var-file="prod.tfvars"
```

### Management
```bash
# Show current state
terraform show

# List all resources
terraform state list

# Get specific resource info
terraform state show google_cloud_run_v2_service.wait_times_service

# Show outputs
terraform output
```

### Cleanup
```bash
# Destroy all resources
terraform destroy

# Destroy with auto-approval
terraform destroy -auto-approve
```

## 📝 Configuration Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `project_id` | GCP Project ID | `theme-park-wait-times-app` | Yes |
| `project_number` | GCP Project Number | `602235714983` | Yes |
| `region` | GCP Region | `us-west2` | Yes |
| `service_name` | Cloud Run service name | `wait-times-service` | No |
| `environment` | Environment (dev/staging/prod) | `dev` | No |

## 🔐 Security Setup

### 1. Database Secret

The service requires a database connection string stored in Secret Manager:

```bash
# Create the secret (replace with your actual connection string)
gcloud secrets create database-connection-string \
    --data-file=- <<< "postgresql://user:password@host:port/database"
```

### 2. Service Account Permissions

The deployment creates a service account with these roles:
- `roles/cloudsql.client` - Database access
- `roles/logging.logWriter` - Write logs
- `roles/monitoring.metricWriter` - Write metrics
- `roles/secretmanager.secretAccessor` - Read database secret

## 📊 Outputs

After deployment, you'll get:

```bash
terraform output
```

- `cloud_run_service_name` - Name of the deployed service
- `cloud_run_service_url` - Public URL of the service
- `artifact_registry_repo` - Docker repository name
- `service_account_email` - Service account email

## 🔄 Container Deployment

The Terraform configuration expects a Docker image at:
```
{region}-docker.pkg.dev/{project_id}/wait-times-repo/wait-times-service:latest
```

To build and push the container:

```bash
# Build and tag the image
docker build -t {region}-docker.pkg.dev/{project_id}/wait-times-repo/wait-times-service:latest .

# Push to Artifact Registry
docker push {region}-docker.pkg.dev/{project_id}/wait-times-repo/wait-times-service:latest

# Update Cloud Run service
terraform apply
```

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   gcloud auth application-default login
   ```

2. **API Not Enabled**
   - APIs are automatically enabled, but may take a few minutes
   - Re-run `terraform apply` if you get API errors

3. **Secret Not Found**
   ```bash
   gcloud secrets create database-connection-string --data-file=-
   ```

4. **Image Not Found**
   - Ensure Docker image is built and pushed to Artifact Registry
   - Check image tag matches the expected format

### Logs and Monitoring

```bash
# View Cloud Run logs
gcloud logs read --filter="resource.labels.service_name=wait-times-service" --limit=50

# Check service status
gcloud run services describe wait-times-service --region=us-west2
```

## 🔄 State Management

For production environments, consider using remote state:

1. Uncomment the backend configuration in `providers.tf`
2. Create a GCS bucket for state storage
3. Run `terraform init` to migrate state

```hcl
backend "gcs" {
  bucket = "theme-park-wait-times-terraform-state"
  prefix = "terraform/state"
}
```

## 📚 Additional Resources

- [Terraform Google Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
