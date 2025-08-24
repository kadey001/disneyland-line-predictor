@echo off
REM Build Docker image locally for testing

REM Configuration
set PROJECT_ID=theme-park-wait-times-app
set REGION=us-west2
set REPO_NAME=nextjs-repo
set IMAGE_NAME=nextjs-app

echo 🏗️  Building Docker image for local testing...

REM Build the Docker image
docker build -f Dockerfile.production -t %IMAGE_NAME%:local .

if %errorlevel% neq 0 (
    echo ❌ Docker build failed
    exit /b 1
)

echo ✅ Docker image built successfully!
echo 🚀 To run locally: docker run -p 3000:3000 %IMAGE_NAME%:local
echo 🔗 To tag for registry: docker tag %IMAGE_NAME%:local %REGION%-docker.pkg.dev/%PROJECT_ID%/%REPO_NAME%/%IMAGE_NAME%:latest
