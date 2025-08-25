@echo off
REM Terraform deployment script for Google Cloud

echo Deploying Wait Times service to Google Cloud...
echo Database connection string will be read from Google Secret Manager
echo.

REM Change to terraform directory (relative to script location)
cd /d "%~dp0\..\terraform"

REM Check if terraform.tfvars exists and update it if needed
if not exist "terraform.tfvars" (
    echo Creating terraform.tfvars from template...
    copy terraform.tfvars.example terraform.tfvars
    echo.
    echo ⚠️  Please review terraform.tfvars and update any required settings
    echo The database connection string will be securely managed via environment variable
    echo.
)

REM Initialize Terraform
echo Initializing Terraform...
terraform init

if %ERRORLEVEL% neq 0 (
    echo Terraform init failed!
    exit /b 1
)

REM Plan and apply the deployment automatically
echo Planning and applying Terraform deployment...
terraform apply -auto-approve

if %ERRORLEVEL% neq 0 (
    echo ❌ Terraform apply failed!
    exit /b 1
)

echo ✅ Deployment completed successfully!
echo The database connection string is securely stored in Google Secret Manager
echo Check the outputs above for service URLs and other details.

REM Return to scripts directory
cd /d "%~dp0"
