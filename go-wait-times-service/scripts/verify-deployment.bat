@echo off
REM Script to verify Cloud Run service status and image version

echo.
echo ================================================
echo   Cloud Run Service Verification
echo ================================================
echo.

REM Configuration variables
set PROJECT_ID=theme-park-wait-times-app
set REGION=us-west2
set SERVICE_NAME=wait-times-service
set EXPECTED_IMAGE=%REGION%-docker.pkg.dev/%PROJECT_ID%/wait-times-repo/%SERVICE_NAME%:latest

echo Project ID: %PROJECT_ID%
echo Region: %REGION%
echo Service Name: %SERVICE_NAME%
echo Expected Image: %EXPECTED_IMAGE%
echo.

echo Checking service status...
echo ================================================

REM Get service URL
echo Getting service URL...
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)" 2^>nul') do set SERVICE_URL=%%i

if "%SERVICE_URL%"=="" (
    echo ERROR: Service '%SERVICE_NAME%' not found in region '%REGION%'
    pause
    exit /b 1
)

echo Service URL: %SERVICE_URL%

REM Get current image
echo.
echo Getting current image...
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(spec.template.spec.containers[0].image)" 2^>nul') do set CURRENT_IMAGE=%%i

echo Current Image: %CURRENT_IMAGE%

REM Check if using expected image
echo.
if "%CURRENT_IMAGE%"=="%EXPECTED_IMAGE%" (
    echo ✅ SUCCESS: Service is using the expected image!
) else (
    echo ⚠️  WARNING: Image mismatch!
    echo   Expected: %EXPECTED_IMAGE%
    echo   Current:  %CURRENT_IMAGE%
)

REM Get latest revision
echo.
echo Getting latest revision...
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.latestCreatedRevisionName)" 2^>nul') do set LATEST_REVISION=%%i

echo Latest Revision: %LATEST_REVISION%

REM Test health endpoint
echo.
echo Testing health endpoint...
echo URL: %SERVICE_URL%/health

REM Use PowerShell for HTTP request (more reliable than curl on Windows)
powershell -Command "try { $response = Invoke-RestMethod -Uri '%SERVICE_URL%/health' -Method GET -TimeoutSec 10; Write-Host '✅ Health check passed!'; Write-Host 'Response:' $response } catch { Write-Host '❌ Health check failed:' $_.Exception.Message }"

echo.
echo ================================================
echo   Useful Commands
echo ================================================
echo.
echo Test wait-times API:
echo   powershell -Command "Invoke-RestMethod -Uri '%SERVICE_URL%/wait-times'"
echo.
echo View recent logs:
echo   gcloud logging read "resource.type=cloud_run_revision" --limit=10
echo.
echo Force redeploy with latest image:
echo   gcloud run deploy %SERVICE_NAME% --image %EXPECTED_IMAGE% --region %REGION%
echo.
echo View service in Google Cloud Console:
echo   https://console.cloud.google.com/run/detail/%REGION%/%SERVICE_NAME%/metrics?project=%PROJECT_ID%
echo.

pause
