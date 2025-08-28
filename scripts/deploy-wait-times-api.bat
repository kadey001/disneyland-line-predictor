@echo off
REM Build and deploy script for Wait Times API Service
REM Usage: .\scripts\deploy-wait-times-api.bat

setlocal enabledelayedexpansion

REM Configuration - Set defaults if not provided via environment variables
if "%PROJECT_ID%"=="" set PROJECT_ID=theme-park-wait-times-app
if "%REGION%"=="" set REGION=us-west2
if "%SERVICE_NAME%"=="" set SERVICE_NAME=wait-times-api
if "%REPO_NAME%"=="" set REPO_NAME=wait-times-repo
set IMAGE_NAME=%REGION%-docker.pkg.dev/%PROJECT_ID%/%REPO_NAME%/%SERVICE_NAME%:latest

echo Building and deploying Wait Times API Service...
echo Project: %PROJECT_ID%
echo Region: %REGION%
echo Service: %SERVICE_NAME%
echo Image: %IMAGE_NAME%

REM Check if we're in the right directory
if not exist "go-services\go.mod" (
    echo Error: Must run from project root directory
    echo Current directory: %CD%
    exit /b 1
)

REM Build and push Docker image
echo.
echo Building Docker image...
cd go-services

docker build -f wait-times-api\Dockerfile -t "%IMAGE_NAME%" .
if errorlevel 1 (
    echo Error: Docker build failed
    exit /b 1
)

echo.
echo Pushing Docker image to Artifact Registry...
docker push "%IMAGE_NAME%"
if errorlevel 1 (
    echo Error: Docker push failed
    exit /b 1
)

echo.
echo Deploying to Cloud Run...
gcloud run deploy "%SERVICE_NAME%" ^
    --image="%IMAGE_NAME%" ^
    --region="%REGION%" ^
    --project="%PROJECT_ID%" ^
    --platform=managed ^
    --allow-unauthenticated ^
    --memory=512Mi ^
    --cpu=1 ^
    --max-instances=10 ^
    --min-instances=0 ^
    --port=8080 ^
    --set-env-vars="GO_DATABASE_URL=%GO_DATABASE_URL%"

if errorlevel 1 (
    echo Error: Cloud Run deployment failed
    exit /b 1
)

echo.
echo Deployment completed successfully!

REM Get and display service URL
echo.
echo Getting service information...
for /f "tokens=*" %%i in ('gcloud run services describe "%SERVICE_NAME%" --region="%REGION%" --project="%PROJECT_ID%" --format="value(status.url)"') do set SERVICE_URL=%%i

echo Service URL: %SERVICE_URL%
echo Health Check: %SERVICE_URL%/health
echo Wait Times Endpoint: %SERVICE_URL%/wait-times

goto :eof
