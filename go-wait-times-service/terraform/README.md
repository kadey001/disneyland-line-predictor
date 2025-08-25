# Google Cloud Deployment

This directory contains the Terraform configuration and deployment scripts for deploying the Disneyland wait times collector service to Google Cloud Platform. The infrastructure includes Cloud Functions, Cloud Scheduler, and supporting services for automated data collection.

## Prerequisites

1. **Google Cloud CLI**: Install and configure the Google Cloud CLI
   ```bash
   # Install gcloud (if not already installed)
   # Download from: https://cloud.google.com/sdk/docs/install
   
   # Authenticate with Google Cloud
   gcloud auth login
   gcloud auth application-default login
   
   # Set your project (replace with your actual project ID)
   gcloud config set project theme-park-wait-times-app
   ```

2. **Terraform**: Install Terraform (version >= 1.0)
   ```bash
   # Download from: https://www.terraform.io/downloads
   # Or use package managers:
   # Windows (Chocolatey): choco install terraform
   # macOS (Homebrew): brew install terraform
   # Linux: Follow official instructions
   ```

3. **Go**: Install Go (version >= 1.21)
   ```bash
   # Download from: https://golang.org/dl/
   # Verify installation: go version
   ```

4. **Database**: Ensure you have a PostgreSQL database accessible from Google Cloud
   - Can be Google Cloud SQL, external hosted database, or on-premises with proper networking

## Setup

1. **Configure Terraform variables**:
   ```bash
   # Copy the example configuration
   cp terraform.tfvars.example terraform.tfvars
   
   # Edit with your actual values
   # Windows: notepad terraform.tfvars
   # macOS/Linux: nano terraform.tfvars
   ```

   **Key variables to configure:**
   - `project_id`: Your Google Cloud project ID
   - `project_number`: Your Google Cloud project number (found in project settings)
   - `region`: Preferred deployment region (default: us-west2)
   - `database_url`: PostgreSQL connection string (will be stored securely in Secret Manager)
   - `schedule_cron`: Cron schedule for data collection (default: every 5 minutes)

2. **Example terraform.tfvars:**
   ```hcl
   project_id = "your-project-id"
   project_number = "123456789012"
   region = "us-west2"
   # Note: For security, set database_url via environment variable instead
   database_url = ""
   schedule_cron = "*/5 * * * *"  # Every 5 minutes
   ```

3. **⚠️ IMPORTANT - Secure Database Configuration:**
   For security, the database connection string should NOT be stored in terraform.tfvars.
   Instead, use an environment variable:
   
   **Windows PowerShell:**
   ```powershell
   $env:TF_VAR_database_url = "postgresql://user:password@host:5432/database?sslmode=require"
   ```
   
   **Linux/macOS:**
   ```bash
   export TF_VAR_database_url="postgresql://user:password@host:5432/database?sslmode=require"
   ```

3. **Verify Google Cloud permissions**: Ensure your account has the following IAM roles:
   - Cloud Functions Admin
   - Cloud Scheduler Admin  
   - Pub/Sub Admin
   - Storage Admin
   - Service Account Admin
   - IAM Admin (for service account creation)

## Deployment

### Option 1: Secure deployment script (Recommended)

Use the secure deployment script that ensures your database credentials are handled safely:

**Windows:**
```cmd
# Set the database URL as an environment variable (replace with your actual connection string)
set TF_VAR_database_url=postgresql://user:password@host:5432/database?sslmode=require

# Run the secure deployment script from the go-wait-times-service directory
scripts\secure-deploy-terraform.bat
```

The secure deployment script will:
1. Verify that the database URL is set as an environment variable
2. Initialize Terraform if needed
3. Show you the planned changes
4. Ask for confirmation before applying
5. Store the database URL securely in Google Secret Manager
6. Deploy all infrastructure

### Option 2: Manual deployment with environment variables

```cmd
# Set environment variable
set TF_VAR_database_url=your_database_connection_string

# Navigate to terraform directory
cd terraform

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

### Option 3: Using deployment scripts (Legacy)

**Windows:**
```cmd
# From the go-wait-times-service directory
scripts\deploy-gcloud.bat
```

**Linux/macOS:**
```bash
# From the go-wait-times-service directory
chmod +x scripts/deploy-gcloud.sh
scripts/deploy-gcloud.sh
```

**What the scripts do:**
1. Build the Go function for Cloud Functions
2. Create a clean deployment package
3. Initialize Terraform (if needed)
4. Plan the deployment (show what will be created)
5. Apply the deployment (create resources)
6. Display important outputs (function URLs, etc.)

### Option 2: Manual deployment

1. **Prepare the function source**:
   ```bash
   # From the go-wait-times-service directory
   cd scripts
   # Windows:
   .\create-clean-source.ps1
   # Linux/macOS:
   chmod +x create-clean-source.sh && ./create-clean-source.sh
   ```

2. **Initialize Terraform**:
   ```bash
   cd terraform
   terraform init
   ```

3. **Plan the deployment**:
   ```bash
   terraform plan
   ```

4. **Apply the deployment**:
   ```bash
   terraform apply
   ```

### Option 3: Step-by-step manual process

1. **Build the Cloud Function**:
   ```bash
   cd cmd/cloudfunc
   go mod tidy
   cd ../../scripts
   # Run the appropriate build script for your platform
   ```

2. **Deploy with Terraform**:
   ```bash
   cd ../terraform
   terraform init
   terraform plan -out=tfplan
   terraform apply tfplan
   ```
## What gets deployed

The Terraform configuration creates the following Google Cloud resources:

### Core Infrastructure

1. **Google Cloud APIs**: Automatically enables required APIs
   - Cloud Functions API
   - Cloud Build API  
   - Cloud Scheduler API
   - Eventarc API
   - Pub/Sub API
   - Cloud Storage API

2. **Cloud Storage Bucket**: 
   - Stores the function source code
   - Regional bucket in specified region
   - Versioned for deployment tracking

3. **IAM Service Account**:
   - Dedicated service account: `wait-times-collector@your-project.iam.gserviceaccount.com`
   - Minimal required permissions for function execution
   - Database access permissions (if using Cloud SQL)

### Function Deployment

4. **Cloud Function (Scheduled)**:
   - **Name**: `wait-times-collector-scheduled`
   - **Runtime**: Go 1.21
   - **Memory**: 256MB (configurable)
   - **Timeout**: 60 seconds (configurable)
   - **Trigger**: Pub/Sub message from Cloud Scheduler
   - **Environment**: `DATABASE_URL` configured automatically

5. **Cloud Function (HTTP)**:
   - **Name**: `wait-times-collector-http`
   - **Runtime**: Go 1.21
   - **Same configuration as scheduled function**
   - **Trigger**: HTTP requests (for manual testing)
   - **URL**: Publicly accessible (printed in outputs)

### Scheduling Infrastructure

6. **Pub/Sub Topic**:
   - **Name**: `wait-times-trigger`
   - Used for decoupling scheduler from function
   - Ensures reliable message delivery

7. **Cloud Scheduler Job**:
   - **Name**: `wait-times-schedule`
   - **Schedule**: Configurable cron expression (default: every minute)
   - **Target**: Pub/Sub topic
   - **Timezone**: UTC (configurable)
   - **Retry Policy**: Automatic retries on failure

## Configuration

### Schedule Configuration

The data collection frequency is controlled by the `schedule_cron` variable in `terraform.tfvars`:

```hcl
# Common cron expressions:
schedule_cron = "*/1 * * * *"    # Every minute (default, recommended)
schedule_cron = "*/5 * * * *"    # Every 5 minutes
schedule_cron = "0 * * * *"      # Every hour at the top of the hour
schedule_cron = "0 */2 * * *"    # Every 2 hours
schedule_cron = "0 0 * * *"      # Every day at midnight UTC
schedule_cron = "0 8-22 * * *"   # Every hour from 8 AM to 10 PM UTC
```

**Recommendation**: Use `*/1 * * * *` (every minute) for real-time data collection during park hours.

### Database Configuration

The service requires a PostgreSQL connection string in the `database_connection_string` variable:

```hcl
# Google Cloud SQL example
database_connection_string = "postgresql://user:password@/database?host=/cloudsql/project:region:instance"

# External database example  
database_connection_string = "postgresql://user:password@host:5432/database?sslmode=require"

# Local development (not recommended for production)
database_connection_string = "postgresql://user:password@host:5432/database?sslmode=disable"
```

### Advanced Configuration

Additional variables you can configure in `terraform.tfvars`:

```hcl
# Resource sizing
function_memory = 256          # Function memory in MB (128, 256, 512, 1024, etc.)
function_timeout = 60          # Function timeout in seconds

# Naming and location
service_name = "wait-times-service"
function_name = "wait-times-collector"
region = "us-central1"

# Scheduler settings
schedule_timezone = "America/Los_Angeles"  # Timezone for cron schedule
```

## Testing & Verification

After deployment, verify the system is working correctly:

### 1. Check Deployment Outputs
```bash
# View important information from Terraform
terraform output

# Expected outputs:
# - http_function_url: URL for manual testing
# - scheduled_function_name: Name of the scheduled function
# - scheduler_job_name: Name of the Cloud Scheduler job
```

### 2. Test the HTTP Function
```bash
# Test the HTTP-triggered function
curl "$(terraform output -raw http_function_url)"

# Should return JSON with wait times data
```

### 3. Verify Scheduled Function
```bash
# Check if the scheduler job is created and enabled
gcloud scheduler jobs describe wait-times-schedule --location=us-central1

# Manually trigger the scheduled function for testing
gcloud scheduler jobs run wait-times-schedule --location=us-central1
```

### 4. Monitor Function Execution
```bash
# View recent function executions
gcloud functions logs read wait-times-collector-scheduled --limit=10

# Stream live logs
gcloud functions logs tail wait-times-collector-scheduled
```

### 5. Database Verification
Connect to your database and verify data is being collected:
```sql
-- Check if data is being inserted
SELECT COUNT(*) FROM ride_wait_time_snapshots;

-- View recent entries
SELECT * FROM ride_wait_time_snapshots 
ORDER BY snapshot_time DESC 
LIMIT 10;
```

## Monitoring & Observability

### Cloud Console Monitoring

1. **Function Metrics**:
   - Go to Cloud Functions → Select your function → Metrics tab
   - Monitor: Invocations, Duration, Memory usage, Errors

2. **Scheduler Monitoring**:
   - Go to Cloud Scheduler → View job execution history
   - Monitor: Success rate, Execution times, Failures

3. **Logs Analysis**:
   - Cloud Logging → Logs Explorer
   - Filter by resource: `cloud_function` and function name
   - Set up log-based alerts for errors

### Setting Up Alerts

Create alerting policies for critical issues:

```bash
# Example: Alert on function failures
gcloud alpha monitoring policies create \
    --policy-from-file=monitoring/function-error-policy.yaml
```

### Cost Monitoring

Expected costs for typical usage:
- **Cloud Functions**: ~$0.01-0.10/day (depends on execution frequency)
- **Cloud Scheduler**: $0.10/month per job
- **Pub/Sub**: Minimal costs for low-volume messaging
- **Storage**: <$0.01/month for source code storage

**Total estimated cost**: $3-10/month depending on execution frequency

### Performance Optimization

**Cold Start Reduction**:
- Keep functions warm with higher frequency execution
- Consider using Cloud Run for always-on scenarios

**Cost Optimization**:
- Adjust memory allocation based on actual usage
- Use regional deployment to reduce network costs
- Monitor and optimize execution duration

## Maintenance & Updates

### Updating the Function Code

When you make changes to the Go code:

1. **Option 1: Use deployment script**:
   ```bash
   # Re-run the deployment script
   scripts/deploy-gcloud.bat  # Windows
   scripts/deploy-gcloud.sh   # Linux/macOS
   ```

2. **Option 2: Manual update**:
   ```bash
   # Rebuild and redeploy
   cd scripts && ./create-clean-source.ps1  # or .sh
   cd ../terraform && terraform apply
   ```

### Scaling Considerations

**Increasing Data Collection Frequency**:
- Update `schedule_cron` in `terraform.tfvars`
- Run `terraform apply` to update the scheduler

**Multi-Region Deployment**:
- Duplicate the Terraform configuration for additional regions
- Use different `region` variables for each deployment

**High Availability Setup**:
- Deploy to multiple regions
- Use a load balancer or database failover strategy
- Consider Cloud Run for always-available endpoints

### Backup & Recovery

**Database Backups**:
- Set up automated backups for your PostgreSQL database
- Test recovery procedures regularly

**Configuration Backup**:
- Store `terraform.tfvars` securely (exclude from git)
- Document your configuration choices

**State Management**:
- Consider using Terraform Cloud or GCS backend for state storage
- Regularly backup Terraform state files

## Cleanup

To remove all deployed resources:

```bash
# Destroy all Terraform-managed resources
cd terraform
terraform destroy

# Confirm the destruction when prompted
# This will remove:
# - Both Cloud Functions
# - Cloud Scheduler job
# - Pub/Sub topic  
# - Storage bucket and contents
# - Service account
```

**Note**: This does NOT delete:
- Your database or its data
- Google Cloud project
- Manually created resources outside of Terraform

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   ```bash
   # Ensure you have the necessary IAM permissions
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
       --member="user:your-email@domain.com" \
       --role="roles/cloudfunctions.admin"
   ```

2. **API Not Enabled Errors**:
   ```bash
   # Terraform should enable APIs automatically, but you can manually enable:
   gcloud services enable cloudfunctions.googleapis.com
   gcloud services enable cloudscheduler.googleapis.com
   ```

3. **Database Connection Issues**:
   - Verify the connection string format
   - Check firewall rules for external databases
   - Ensure the database accepts connections from Google Cloud IPs

4. **Function Timeout Errors**:
   - Increase `function_timeout` in `terraform.tfvars`
   - Check database performance and connection latency

5. **Build Failures**:
   ```bash
   # Clean and rebuild
   cd cmd/cloudfunc
   go clean -cache
   go mod tidy
   cd ../../scripts
   # Re-run build script
   ```

### Getting Help

- **Google Cloud Documentation**: https://cloud.google.com/functions/docs
- **Terraform Google Provider**: https://registry.terraform.io/providers/hashicorp/google/latest/docs
- **Project Issues**: Create an issue in the project repository

### Debug Commands

```bash
# Check Terraform state
terraform show
terraform state list

# Validate Terraform configuration
terraform validate

# Check Google Cloud authentication
gcloud auth list
gcloud config list

# Verify API enablement
gcloud services list --enabled
```
