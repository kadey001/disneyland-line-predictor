@echo off
REM Usage: deploy-live-data-collector.bat PROJECT REGION IMAGE_TAG
SETLOCAL ENABLEDELAYEDEXPANSION

SET PROJECT=%1
IF "%PROJECT%"=="" (
  ECHO Usage: %~nx0 PROJECT [REGION] [IMAGE_TAG]
  EXIT /B 1
)
SET REGION=%2
IF "%REGION%"=="" SET REGION=us-west1
SET IMAGE_TAG=%3
IF "%IMAGE_TAG%"=="" SET IMAGE_TAG=latest

SET IMAGE_LOCATION=%REGION%-docker.pkg.dev
SET IMAGE=%IMAGE_LOCATION%/%PROJECT%/wait-times-repo/live-data-collector:%IMAGE_TAG%

ECHO Building and pushing image: %IMAGE%
gcloud builds submit --config cloudbuild.yaml --substitutions=_IMAGE=%IMAGE%

ECHO Deploying to Cloud Run
gcloud run deploy live-data-collector --image %IMAGE% --region %REGION% --platform managed --allow-unauthenticated --set-env-vars DATABASE_URL="%DATABASE_URL%" --project %PROJECT%

ECHO Deployed %IMAGE% to %REGION%
