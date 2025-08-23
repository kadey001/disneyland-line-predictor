@echo off
REM Script to build and deploy Docker image to Google Cloud Artifact Registry

echo Building and deploying Docker image to Google Cloud Artifact Registry...

REM Configuration variables
set PROJECT_ID=theme-park-wait-times-app
set REGION=us-west2
set REPOSITORY=wait-times-repo
set IMAGE_NAME=wait-times-service
set TAG=latest

REM Full image name
set FULL_IMAGE_NAME=%REGION%-docker.pkg.dev/%PROJECT_ID%/%REPOSITORY%/%IMAGE_NAME%:%TAG%

echo Project ID: %PROJECT_ID%
echo Region: %REGION%
echo Repository: %REPOSITORY%
echo Image Name: %IMAGE_NAME%
echo Tag: %TAG%
echo Full Image: %FULL_IMAGE_NAME%
echo.

REM Change to the go-wait-times-service directory (where Dockerfile is located)
cd /d "%~dp0\.."

REM Check if Dockerfile exists
if not exist "Dockerfile" (
    echo ERROR: Dockerfile not found in current directory!
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Configure Docker to use gcloud as a credential helper
echo Configuring Docker authentication...
gcloud auth configure-docker %REGION%-docker.pkg.dev

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to configure Docker authentication!
    pause
    exit /b 1
)

REM Build the Docker image
echo.
echo Building Docker image...
docker build -t %FULL_IMAGE_NAME% .

if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)

REM Push the Docker image to Artifact Registry
echo.
echo Pushing Docker image to Artifact Registry...
docker push %FULL_IMAGE_NAME%

if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker push failed!
    pause
    exit /b 1
)

echo.
echo ✅ Successfully built and deployed Docker image!
echo Image: %FULL_IMAGE_NAME%
echo.
echo You can now update your Cloud Run service to use this image.
echo.

pause
