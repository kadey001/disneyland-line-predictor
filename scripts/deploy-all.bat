@echo off
REM Full deployment script for all Go services
REM Usage: scripts\deploy-all.bat

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_ID=theme-park-wait-times-app
set REGION=us-west2
set REPO_NAME=wait-times-repo

echo ====================================
echo   Disney Wait Times Full Deployment
echo ====================================
echo Project: %PROJECT_ID%
echo Region: %REGION%
echo.

REM Check if we're in the right directory
if not exist "go-services\go.mod" (
    echo Error: Must run from project root directory
    exit /b 1
)

REM Check if terraform directory exists
if not exist "terraform\main.tf" (
    echo Error: Terraform configuration not found
    exit /b 1
)

echo Step 1: Initializing Terraform...
cd terraform
terraform init

if errorlevel 1 (
    echo Error: Terraform init failed
    exit /b 1
)

echo.
echo Step 2: Planning Terraform deployment...
terraform plan

if errorlevel 1 (
    echo Error: Terraform plan failed
    exit /b 1
)

echo.
echo Step 3: Applying Terraform configuration...
terraform apply -auto-approve

if errorlevel 1 (
    echo Error: Terraform apply failed
    exit /b 1
)

cd ..

echo.
echo Step 4: Building and deploying services...
cd go-services

REM Build Live Data Collector Service
set LDC_IMAGE_NAME=%REGION%-docker.pkg.dev/%PROJECT_ID%/%REPO_NAME%/live-data-collector-service:latest

echo Building Docker image for Live Data Collector Service...
docker build -f live-data-collector-service\Dockerfile -t %LDC_IMAGE_NAME% .

if errorlevel 1 (
    echo Error: Docker build failed for Live Data Collector Service
    exit /b 1
)

echo Pushing Live Data Collector Service image...
docker push %LDC_IMAGE_NAME%

if errorlevel 1 (
    echo Error: Docker push failed for Live Data Collector Service
    exit /b 1
)

REM Build Wait Times API Service
set API_IMAGE_NAME=%REGION%-docker.pkg.dev/%PROJECT_ID%/%REPO_NAME%/wait-times-api:latest

echo Building Docker image for Wait Times API...
docker build -f wait-times-api\Dockerfile -t %API_IMAGE_NAME% .

if errorlevel 1 (
    echo Error: Docker build failed for Wait Times API
    exit /b 1
)

echo Pushing Wait Times API image...
docker push %API_IMAGE_NAME%

if errorlevel 1 (
    echo Error: Docker push failed for Wait Times API
    exit /b 1
)

cd ..

echo.
echo Step 5: Deploying services to Cloud Run...

REM Deploy Live Data Collector Service
gcloud run deploy live-data-collector-service ^
    --image=%LDC_IMAGE_NAME% ^
    --region=%REGION% ^
    --project=%PROJECT_ID% ^
    --platform=managed ^
    --allow-unauthenticated ^
    --memory=512Mi ^
    --cpu=1 ^
    --max-instances=2 ^
    --min-instances=1

if errorlevel 1 (
    echo Error: Cloud Run deployment failed for Live Data Collector Service
    exit /b 1
)

REM Deploy Wait Times API
gcloud run deploy wait-times-api ^
    --image=%API_IMAGE_NAME% ^
    --region=%REGION% ^
    --project=%PROJECT_ID% ^
    --platform=managed ^
    --allow-unauthenticated ^
    --memory=512Mi ^
    --cpu=1 ^
    --max-instances=3 ^
    --min-instances=1

if errorlevel 1 (
    echo Error: Cloud Run deployment failed for Wait Times API
    exit /b 1
)

echo.
echo ====================================
echo      Deployment Complete!
echo ====================================

REM Get and display service URLs
echo.
echo Service URLs:
for /f "delims=" %%i in ('gcloud run services describe live-data-collector-service --region=%REGION% --project=%PROJECT_ID% --format="value(status.url)"') do set LDC_URL=%%i
for /f "delims=" %%i in ('gcloud run services describe wait-times-api --region=%REGION% --project=%PROJECT_ID% --format="value(status.url)"') do set API_URL=%%i

echo Live Data Collector Service: %LDC_URL%
echo Wait Times API: %API_URL%

echo.
echo Test the services:
echo Live Data Collector Health: %LDC_URL%/health
echo Live Data Collector Collect: %LDC_URL%/collect (POST request)
echo Wait Times API Health: %API_URL%/health
echo Wait Times API Data: %API_URL%/wait-times

endlocal
