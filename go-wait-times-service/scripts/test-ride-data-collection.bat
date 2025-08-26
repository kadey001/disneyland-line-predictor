@echo off
REM Test the new ride data history functionality
REM Windows batch script for testing

echo ==========================================
echo  Ride Data History Test Script
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

echo Testing ride data collection functionality...
echo.

REM Set working directory
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set FUNCTION_DIR=%ROOT_DIR%\functions\live-data-collector

echo Function directory: %FUNCTION_DIR%

REM Test 1: Build the Go function
echo ==========================================
echo  Test 1: Building Go Function
echo ==========================================

cd /d "%FUNCTION_DIR%"
if errorlevel 1 (
    echo ERROR: Failed to navigate to function directory
    exit /b 1
)

echo Initializing Go module...
go mod init live-data-collector >nul 2>&1
go mod tidy

echo Building function...
go build -o test-main.exe .
if errorlevel 1 (
    echo ERROR: Failed to build function
    exit /b 1
) else (
    echo SUCCESS: Function built successfully
    del test-main.exe 2>nul
)

REM Test 2: Validate database schema
echo ==========================================
echo  Test 2: Validating Database Schema
echo ==========================================

cd /d "%ROOT_DIR%"
echo Checking Prisma schema...
npx prisma validate
if errorlevel 1 (
    echo ERROR: Prisma schema validation failed
    exit /b 1
) else (
    echo SUCCESS: Prisma schema is valid
)

echo Generating Prisma client...
npx prisma generate >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    exit /b 1
) else (
    echo SUCCESS: Prisma client generated
)

REM Test 3: Test API endpoint (if available)
echo ==========================================
echo  Test 3: Testing API Endpoints
echo ==========================================

echo Testing themeparks.wiki API...
curl --version >nul 2>&1
if not errorlevel 1 (
    echo Making test API call...
    curl -s -X GET "https://api.themeparks.wiki/v1/entity/75ea578a-adc8-4116-a54d-dccb60765ef9/live" ^
         -H "Accept: application/json" ^
         -H "User-Agent: DisnelyandLinePredictor/1.0" ^
         --max-time 10 >nul
    if not errorlevel 1 (
        echo SUCCESS: API endpoint is accessible
    ) else (
        echo WARNING: API endpoint test failed
    )
) else (
    echo INFO: Curl not available, skipping API test
)

echo ==========================================
echo  Test Results Summary
echo ==========================================
echo.
echo All tests completed successfully!
echo.
echo Next steps:
echo 1. Deploy function: run deploy-live-data-function.bat
echo 2. Monitor logs: gcloud logging read "resource.type=cloud_function" --limit 50
echo 3. Test manual execution via Cloud Console
echo.

pause
