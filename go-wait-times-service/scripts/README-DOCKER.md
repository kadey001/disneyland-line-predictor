# Docker Build and Deploy Scripts

This directory contains scripts to build and deploy the Go wait times service Docker image to Google Cloud Artifact Registry.

## Scripts Overview

| Script | Purpose | Platform |
|--------|---------|----------|
| `build-and-deploy-docker.bat` | Build and push Docker image | Windows (Batch) |
| `build-and-deploy-docker.sh` | Build and push Docker image | Linux/macOS (Bash) |
| `full-deploy.bat` | Complete deployment (Docker + Terraform + Cloud Run update) | Windows (Batch) |
| `verify-deployment.bat` | Check Cloud Run service status and image version | Windows (Batch) |

## Prerequisites

1. **Google Cloud CLI** installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project theme-park-wait-times-app
   ```

2. **Docker** installed and running

3. **Terraform** installed (for infrastructure deployment)

4. **Artifact Registry repository** must exist (created by Terraform)

## Usage

### Option 1: Complete Deployment (Recommended)

Run the full deployment script that handles Docker build, Terraform deployment, and Cloud Run update:

```batch
# Windows - Complete deployment
.\full-deploy.bat
```

### Option 2: Verify Deployment

Check if your Cloud Run service is using the latest image:

```batch
# Check service status and image version
.\verify-deployment.bat
```

### Option 2: Docker Build Only

If you just want to build and push the Docker image:

```batch
# Windows (Batch)
.\build-and-deploy-docker.bat

# Windows (PowerShell)
.\build-and-deploy-docker.ps1

# Linux/macOS
./build-and-deploy-docker.sh
```

### Option 3: Custom Parameters

You can modify the batch files directly to change default parameters like project ID, region, etc.

Edit the variables at the top of any script:
```batch
set PROJECT_ID=your-project-id
set REGION=your-region
set SERVICE_NAME=your-service-name
```

## Configuration

The scripts use these default values:

- **Project ID**: `theme-park-wait-times-app`
- **Region**: `us-west2`
- **Repository**: `wait-times-repo`
- **Image Name**: `wait-times-service`
- **Tag**: `latest`

## Deployment Flow

1. **First Time Setup**:
   ```batch
   # 1. Run Terraform to create infrastructure (including Artifact Registry)
   .\deploy-gcloud.bat
   
   # 2. Build and push Docker image
   .\build-and-deploy-docker.bat
   
   # 3. Update Terraform to deploy with the new image
   .\deploy-gcloud.bat
   ```

2. **Subsequent Deployments**:
   ```batch
   # Use the complete deployment script
   .\full-deploy.bat
   ```

3. **Verify Deployment**:
   ```batch
   # Check if Cloud Run is using the latest image
   .\verify-deployment.bat
   ```

## Generated Image

The Docker image will be available at:
```
us-west2-docker.pkg.dev/theme-park-wait-times-app/wait-times-repo/wait-times-service:latest
```

## Troubleshooting

### Repository Not Found Error
```
error from registry: Repository "wait-times-repo" not found
```
**Solution**: Run Terraform first to create the Artifact Registry repository:
```batch
.\deploy-gcloud.bat
```

### Authentication Error
```
ERROR: Failed to configure Docker authentication!
```
**Solution**: Ensure you're logged into Google Cloud:
```bash
gcloud auth login
```bash
gcloud auth configure-docker us-west2-docker.pkg.dev
```
```

### Docker Build Failed
```
ERROR: Docker build failed!
```
**Solution**: 
1. Ensure Docker is running
2. Check that you're in the correct directory (should contain Dockerfile)
3. Verify Go code builds successfully:
   ```bash
   go build ./cmd/server
   ```

## Integration with Cloud Run

After pushing the image, your Terraform configuration will automatically use it:

```hcl
image = "us-west2-docker.pkg.dev/theme-park-wait-times-app/wait-times-repo/wait-times-service:latest"
```

The image includes:
- Built Go binary (`wait-times-service`)
- Alpine Linux base for minimal size
- Exposed port 8080
- Health check endpoint at `/health`
