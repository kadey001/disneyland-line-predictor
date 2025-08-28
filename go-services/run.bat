@echo off
REM Run script for Go services
REM Usage: run.bat <service-name>
REM Example: run.bat live-data-collector-service

if "%~1"=="" (
    echo Error: Please provide a service name
    echo Usage: run.bat ^<service-name^>
    echo Example: run.bat live-data-collector-service
    exit /b 1
)

REM Set environment to development
set ENV=development

echo Starting %~1 in development mode...
echo ENV=%ENV%

REM Run the Go service
go run .\%~1
