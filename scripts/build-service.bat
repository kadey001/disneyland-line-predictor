@echo off
REM Manual Cloud Build trigger script for individual services
REM Usage: scripts\build-service.bat <service-name>
REM Example: scripts\build-service.bat live-data-collector-service

if "%~1"=="" (
    echo Usage: %0 ^<service-name^>
    echo Available services: live-data-collector-service, wait-times-api
    goto :eof
)

set SERVICE_NAME=%~1
set PROJECT_ID=theme-park-wait-times-app
set REGION=us-west2
set TRIGGER_NAME=%SERVICE_NAME%-build

echo 🚀 Triggering Cloud Build for %SERVICE_NAME%...
echo Project: %PROJECT_ID%
echo Trigger: %TRIGGER_NAME%

REM Trigger Cloud Build
gcloud builds triggers run %TRIGGER_NAME% --project=%PROJECT_ID% --region=%REGION% --branch=master

echo ✅ Cloud Build triggered successfully!
echo 🔍 Check build status: https://console.cloud.google.com/cloud-build/builds?project=%PROJECT_ID%
