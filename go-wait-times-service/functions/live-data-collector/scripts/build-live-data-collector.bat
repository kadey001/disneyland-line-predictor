@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0\.."

echo Tidying modules...
go mod tidy

authority>nul 2>&1 || (
  rem ensure bin dir exists
)
if not exist bin mkdir bin

echo Building live-data-collector...
go build -o bin\live-data-collector.exe main.go
echo Built: %cd%\bin\live-data-collector.exe
