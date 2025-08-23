@echo off
REM Terraform deployment script for Google Cloud

echo Deploying Wait Times service to Google Cloud...

REM Change to terraform directory (relative to script location)
cd /d "%~dp0\..\terraform"

REM Check if terraform.tfvars exists
if not exist "terraform.tfvars" (
    echo Creating terraform.tfvars template...
    echo database_connection_string = "postgres://username:password@host:port/database?sslmode=require" > terraform.tfvars
    echo Please update terraform.tfvars with your actual database connection string
    echo Then run this script again.
    pause
    exit /b 1
)

REM Initialize Terraform
echo Initializing Terraform...
terraform init

if %ERRORLEVEL% neq 0 (
    echo Terraform init failed!
    pause
    exit /b 1
)

REM Plan the deployment
echo Planning Terraform deployment...
terraform plan

if %ERRORLEVEL% neq 0 (
    echo Terraform plan failed!
    pause
    exit /b 1
)

REM Ask for confirmation
set /p CONFIRM="Do you want to apply these changes? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

REM Apply the deployment
echo Applying Terraform deployment...
terraform apply -auto-approve

if %ERRORLEVEL% neq 0 (
    echo Terraform apply failed!
    pause
    exit /b 1
)

echo Deployment completed successfully!
echo Check the outputs above for function URLs and other details.

REM Return to scripts directory
cd /d "%~dp0"
pause
