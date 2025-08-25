# Docker Build and Deploy Scripts (Secure Secret Management)

This directory contains scripts to build and deploy the Go wait times service Docker image to Google Cloud Artifact Registry with secure secret management via Google Secret Manager.

## Scripts Overview

| Script | Purpose | Platform |
|--------|---------|----------|
| `build-and-deploy-docker.bat` | Build and push Docker image | Windows (Batch) |
| `build-and-deploy-docker.sh` | Build and push Docker image | Linux/macOS (Bash) |
| `deploy-gcloud.bat` | Terraform deployment only | Windows (Batch) |
| `deploy-gcloud.sh` | Terraform deployment only | Linux/macOS (Bash) |
| `full-deploy.bat` | Complete deployment (Docker + Terraform + Cloud Run) | Windows (Batch) |
| `full-deploy.sh` | Complete deployment (Docker + Terraform + Cloud Run) | Linux/macOS (Bash) |
| `verify-deployment.bat` | Check Cloud Run service status and test endpoints | Windows (Batch) |
| `verify-deployment.sh` | Check Cloud Run service status and test endpoints | Linux/macOS (Bash) |

## 🔐 Security Features

- **Google Secret Manager Integration**: Database connection strings are stored securely in Google Secret Manager
- **No Hardcoded Secrets**: No database credentials in code, configuration files, or environment variables
- **Encrypted Storage**: All secrets are encrypted at rest and in transit
- **Access Control**: Only authorized service accounts can access secrets
- **Terraform Integration**: Secrets are referenced directly from Secret Manager in infrastructure code

## Prerequisites

1. **Google Cloud CLI** installed and authenticated:
   ```bash
   gcloud auth login
   gcloud config set project theme-park-wait-times-app
   ```

2. **Docker** installed and running

3. **Terraform** installed (for infrastructure deployment)

4. **Database Connection String** stored in Google Secret Manager:
   ```bash
   # Create or update the secret
   echo "postgresql://user:password@host:port/database?sslmode=require" | gcloud secrets create database-connection-string --data-file=-
   
   # Or update existing secret
   echo "postgresql://user:password@host:port/database?sslmode=require" | gcloud secrets versions add database-connection-string --data-file=-
   ```

5. **Artifact Registry repository** must exist (created by Terraform)

## Platform-Specific Usage

### Windows (PowerShell/Command Prompt)
All `.bat` files can be run directly:
```batch
.\full-deploy.bat
.\verify-deployment.bat
.\build-and-deploy-docker.bat
.\deploy-gcloud.bat
```

### Linux/macOS/WSL (Bash)
All `.sh` files need to be executable and run with bash:
```bash
# Make scripts executable (one-time setup)
chmod +x *.sh

# Run the scripts
./full-deploy.sh
./verify-deployment.sh
./build-and-deploy-docker.sh
./deploy-gcloud.sh
```

### Cross-Platform Notes
- All scripts perform identical operations regardless of platform
- Windows scripts use `.bat` extension, Linux/macOS use `.sh`
- Both script sets are maintained in parallel for convenience
- Choose the appropriate script for your operating system

## 🚀 Usage

### Option 1: Complete Deployment (Recommended)

For users with database connection string already stored in Google Secret Manager:

```batch
# Windows
.\full-deploy.bat

# Linux/macOS
./full-deploy.sh
```

### Option 2: First-Time Setup

If you haven't stored your database connection string in Secret Manager yet:

```bash
# 1. Store database connection string in Secret Manager
echo "postgresql://user:password@host:port/database?sslmode=require" | gcloud secrets create database-connection-string --data-file=-

# 2. Run complete deployment
# Windows
.\full-deploy.bat

# Linux/macOS
./full-deploy.sh
```

### Option 3: Verify Deployment

Check if your Cloud Run service is running correctly:

```batch
# Windows
.\verify-deployment.bat

# Linux/macOS
./verify-deployment.sh
```

### Option 4: Docker Build Only

If you only want to build and push the Docker image:

```batch
# Windows
.\build-and-deploy-docker.bat

# Linux/macOS
./build-and-deploy-docker.sh
```

### Option 5: Terraform Only

If you only want to run the Terraform deployment:

```batch
# Windows
.\deploy-gcloud.bat

# Linux/macOS
./deploy-gcloud.sh
```

## Configuration

The scripts use these default values:

- **Project ID**: `theme-park-wait-times-app`
- **Region**: `us-west2`
- **Repository**: `wait-times-repo`
- **Image Name**: `wait-times-service`
- **Tag**: `latest`

## Deployment Flow

1. **First Time Setup** (Database secret not yet stored):
   ```bash
   # 1. Store database connection string in Secret Manager
   echo "postgresql://user:password@host:port/database" | gcloud secrets create database-connection-string --data-file=-
   
   # 2. Run complete deployment
   # Windows
   .\full-deploy.bat
   
   # Linux/macOS
   ./full-deploy.sh
   ```

2. **Subsequent Deployments**:
   ```bash
   # Windows
   .\full-deploy.bat
   
   # Linux/macOS
   ./full-deploy.sh
   ```

3. **Update Database Credentials** (if needed):
   ```bash
   # Update the secret with new credentials
   echo "new_postgresql_connection_string" | gcloud secrets versions add database-connection-string --data-file=-
   
   # Redeploy to pick up new credentials
   # Windows
   .\full-deploy.bat
   
   # Linux/macOS
   ./full-deploy.sh
   ```

4. **Verify Deployment**:
   ```bash
   # Windows
   .\verify-deployment.bat
   
   # Linux/macOS
   ./verify-deployment.sh
   ```

## Generated Image

The Docker image will be available at:
```
us-west2-docker.pkg.dev/theme-park-wait-times-app/wait-times-repo/wait-times-service:latest
```

## Troubleshooting

### Secret Not Found Error
```
Secret projects/602235714983/secrets/database-connection-string/versions/latest was not found
```
**Solution**: Create the database connection string secret:
```bash
echo "postgresql://user:password@host:port/database" | gcloud secrets create database-connection-string --data-file=-
```

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
gcloud auth configure-docker us-west2-docker.pkg.dev
```

### Database Connection Issues
```
failed to parse as URL (parse "...": net/url: invalid control character in URL)
```
**Solution**: Update the secret without extra whitespace:
```bash
# Use -n flag to prevent newline characters
echo -n "postgresql://user:password@host:port/database" | gcloud secrets versions add database-connection-string --data-file=-
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
   go build ./server
   ```

## Integration with Cloud Run

After the deployment, your Cloud Run service will automatically:

- **Load Database Credentials**: Securely fetch the database connection string from Google Secret Manager
- **Use Latest Image**: Deploy the latest Docker image from Artifact Registry
- **Scale Automatically**: Handle traffic spikes with automatic scaling
- **Monitor Health**: Provide health check endpoints for monitoring

The service configuration includes:
```hcl
# Terraform automatically configures the service with:
image = "us-west2-docker.pkg.dev/theme-park-wait-times-app/wait-times-repo/wait-times-service:latest"

env {
  name = "DATABASE_URL"
  value_source {
    secret_key_ref {
      secret  = "database-connection-string"
      version = "latest"
    }
  }
}
```

The image includes:
- Built Go binary (`wait-times-service`)
- Alpine Linux base for minimal size
- Exposed port 8080
- Health check endpoint at `/health`
- Automatic data collection every 2 minutes
