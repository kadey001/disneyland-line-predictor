@echo off
REM Deploy Live Data Collector Cloud Function
REM Production-grade deployment script for Windows

echo ==========================================
echo  Live Data Collector Deployment Script
echo ==========================================

REM Check if required environment variables are set
if not defined PROJECT_ID (
    echo ERROR: PROJECT_ID environment variable not set
    echo Please set PROJECT_ID to your Google Cloud project ID
    exit /b 1
)

if not defined REGION (
    set REGION=us-east1
    echo INFO: Using default region: %REGION%
)

REM Set working directory
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set FUNCTION_DIR=%ROOT_DIR%\functions\live-data-collector
set TERRAFORM_DIR=%ROOT_DIR%\terraform

echo Current directory: %cd%
echo Function directory: %FUNCTION_DIR%
echo Terraform directory: %TERRAFORM_DIR%

REM Check if Go is installed
go version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Go is not installed or not in PATH
    exit /b 1
)

REM Check if Terraform is installed
terraform version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Terraform is not installed or not in PATH
    exit /b 1
)

REM Check if gcloud is installed and authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>&1
if errorlevel 1 (
    echo ERROR: gcloud is not authenticated
    echo Please run: gcloud auth login
    exit /b 1
)

echo ==========================================
echo  Step 1: Preparing Function Code
echo ==========================================

REM Navigate to function directory
cd /d "%FUNCTION_DIR%"
if errorlevel 1 (
    echo ERROR: Failed to navigate to function directory
    exit /b 1
)

REM Initialize Go module and download dependencies
echo Initializing Go module...
go mod init live-data-collector >nul 2>&1
go mod tidy
if errorlevel 1 (
    echo ERROR: Failed to initialize Go module
    exit /b 1
)

REM Build and test the function
echo Building function...
go build -o main.exe .
if errorlevel 1 (
    echo ERROR: Failed to build function
    exit /b 1
)

REM Clean up build artifacts
del main.exe 2>nul

echo ==========================================
echo  Step 2: Deploying with Terraform
echo ==========================================

REM Navigate to Terraform directory
cd /d "%TERRAFORM_DIR%"
if errorlevel 1 (
    echo ERROR: Failed to navigate to Terraform directory
    exit /b 1
)

REM Initialize Terraform
echo Initializing Terraform...
terraform init
if errorlevel 1 (
    echo ERROR: Failed to initialize Terraform
    exit /b 1
)

REM Plan deployment
echo Planning deployment...
terraform plan -var="project_id=%PROJECT_ID%" -var="region=%REGION%"
if errorlevel 1 (
    echo ERROR: Terraform plan failed
    exit /b 1
)

REM Apply deployment
echo Applying deployment...
terraform apply -auto-approve -var="project_id=%PROJECT_ID%" -var="region=%REGION%"
if errorlevel 1 (
    echo ERROR: Terraform apply failed
    exit /b 1
)

echo ==========================================
echo  Step 3: Verifying Deployment
echo ==========================================

REM Get function URL
for /f "delims=" %%i in ('terraform output -raw live_data_collector_url 2^>nul') do set FUNCTION_URL=%%i

if not defined FUNCTION_URL (
    echo WARNING: Could not retrieve function URL from Terraform output
    echo You can find the function URL in the Google Cloud Console
) else (
    echo Function URL: %FUNCTION_URL%
    echo Testing function...
    
    REM Test the function with curl (if available)
    curl --version >nul 2>&1
    if not errorlevel 1 (
        curl -X POST "%FUNCTION_URL%" -H "Content-Type: application/json" -d "{\"parkIds\": [\"75ea578a-adc8-4116-a54d-dccb60765ef9\"]}" --max-time 30
        echo.
    ) else (
        echo Curl not available, skipping function test
    )
)

echo ==========================================
echo  Deployment Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Monitor the function logs: gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=live-data-collector" --limit 50
echo 2. View function metrics in Cloud Console
echo 3. Test manual execution via Cloud Console or HTTP request
echo.
echo Scheduled execution: Every 5 minutes via Cloud Scheduler
echo.

pause
