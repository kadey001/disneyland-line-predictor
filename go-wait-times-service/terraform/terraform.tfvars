# Terraform variables file
# Updated configuration for self-scheduling service

# GCP Project Configuration
project_id     = "theme-park-wait-times-app"
project_number = "602235714983"
region         = "us-west2"

# Service Configuration
service_name = "wait-times-service"
environment  = "dev"

# Database Configuration
# The database connection string is stored securely in Google Secret Manager
# and referenced directly by the Terraform configuration
