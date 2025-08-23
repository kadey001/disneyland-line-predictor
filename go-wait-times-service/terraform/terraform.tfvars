# Example Terraform variables file
# Copy this file to terraform.tfvars and update with your actual values

# GCP Project Configuration
project_id     = "theme-park-wait-times-app"
project_number = "602235714983"
region         = "us-west2"

# Function Configuration
function_name = "wait-times-collector"
environment   = "dev"

# Schedule Configuration (cron format)
# Examples:
# "*/1 * * * *"     = Every minute
# "0 * * * *"       = Every hour
# "0 */2 * * *"     = Every 2 hours
# "0 0 * * *"       = Every day at midnight
schedule_cron = "*/5 * * * *"

# Database Configuration
# Update this with your actual PostgreSQL connection string
database_connection_string = "postgres://b93b395a97c4363333f090a994669ebfa7511a28daf5c4d4e765f9ac6ecc0c99:sk_esJPgjLHd3TUU5JRy9A3U@db.prisma.io:5432/?sslmode=require"
