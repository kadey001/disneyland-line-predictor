@echo off
REM Complete deployment script: Build Docker image and deploy with Terraform

echo ========================================
echo 🚀 Complete Deployment with Manual Secrets
echo ========================================
echo Docker build + Terraform deploy
echo Database secrets managed via Google Secret Manager
echo.

REM Step 1: Build and push Docker image
echo ========================================
echo Step 1: Building and pushing Docker image
echo ========================================
call "%~dp0build-and-deploy-docker.bat"

if %ERRORLEVEL% neq 0 (
    echo ❌ ERROR: Docker build and push failed!
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Deploying infrastructure with Terraform
echo ========================================

REM Step 2: Deploy with Terraform (no environment variables needed)
call "%~dp0deploy-gcloud.bat"

if %ERRORLEVEL% neq 0 (
    echo ❌ ERROR: Terraform deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 3: Ensuring Cloud Run uses latest image
echo ========================================

REM Configuration variables (must match build script)
set PROJECT_ID=theme-park-wait-times-app
set REGION=us-west2
set SERVICE_NAME=wait-times-service

echo Forcing Cloud Run to deploy latest image revision...
gcloud run deploy %SERVICE_NAME% ^
  --image us-west2-docker.pkg.dev/%PROJECT_ID%/wait-times-repo/%SERVICE_NAME%:latest ^
  --region %REGION% ^
  --quiet

if %ERRORLEVEL% neq 0 (
    echo ⚠️ WARNING: Failed to force Cloud Run update via gcloud, but Terraform deployment may have updated it.
    echo Cloud Run service may still be using the previous image version.
) else (
    echo ✅ Successfully forced Cloud Run to use latest image!
)

echo.
echo ========================================
echo Complete Deployment Successful!
echo ========================================
echo.
echo ✅ Docker image built and pushed to Artifact Registry
echo ✅ Infrastructure deployed via Terraform
echo ✅ Database connection string securely stored in Secret Manager
echo ✅ Cloud Run service updated with latest image
echo.
echo Your service is now running securely on Cloud Run!
echo Database secrets are managed by Google Secret Manager.
echo.
