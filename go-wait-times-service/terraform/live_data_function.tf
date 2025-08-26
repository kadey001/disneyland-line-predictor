# Cloud Function for Live Data Collection
# 
# This configuration deploys a serverless Cloud Function that:
# - Fetches live ride data from themeparks.wiki API
# - Stores data in the database
# - Can be triggered via HTTP or Cloud Scheduler
# - Automatically cleans up old data

# Zip the function source code
data "archive_file" "live_data_collector_zip" {
  type        = "zip"
  output_path = "${path.module}/../functions/live-data-collector.zip"
  source_dir  = "${path.module}/../functions/live-data-collector"
}

# Upload the function to Cloud Storage
resource "google_storage_bucket_object" "live_data_collector_zip" {
  name   = "live-data-collector-${data.archive_file.live_data_collector_zip.output_md5}.zip"
  bucket = google_storage_bucket.functions_bucket.name
  source = data.archive_file.live_data_collector_zip.output_path
}

# Create a Cloud Storage bucket for function deployments
resource "google_storage_bucket" "functions_bucket" {
  name                        = "${var.project_id}-live-data-functions"
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true
}

# Create the Cloud Function
resource "google_cloudfunctions2_function" "live_data_collector" {
  name        = "live-data-collector"
  location    = var.region
  description = "Collects live ride data from themeparks.wiki API"

  build_config {
    runtime     = "go121"
    entry_point = "LiveDataCollector"
    source {
      storage_source {
        bucket = google_storage_bucket.functions_bucket.name
        object = google_storage_bucket_object.live_data_collector_zip.name
      }
    }
  }

  service_config {
    max_instance_count               = 10
    min_instance_count               = 0
    available_memory                 = "256Mi"
    timeout_seconds                  = 300
    max_instance_request_concurrency = 1
    available_cpu                    = "0.167"

    environment_variables = {
      DATABASE_URL = "projects/${var.project_id}/secrets/database-connection-string/versions/latest"
    }

    ingress_settings               = "ALLOW_ALL"
    all_traffic_on_latest_revision = true
    service_account_email          = google_service_account.function_sa.email
  }

  depends_on = [
    google_project_service.cloud_functions,
    google_project_service.cloud_build,
    google_storage_bucket_object.live_data_collector_zip,
  ]
}

# Service account for the Cloud Function
resource "google_service_account" "function_sa" {
  account_id   = "live-data-collector-sa"
  display_name = "Live Data Collector Function Service Account"
  description  = "Service account for the live data collector Cloud Function"
}

# IAM permissions for the function service account
resource "google_project_iam_member" "function_sa_cloudsql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.function_sa.email}"
}

resource "google_project_iam_member" "function_sa_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.function_sa.email}"
}

resource "google_project_iam_member" "function_sa_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.function_sa.email}"
}

# Grant access to Secret Manager for the function
resource "google_secret_manager_secret_iam_member" "function_database_secret_access" {
  project   = var.project_id
  secret_id = data.google_secret_manager_secret.database_connection_string.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.function_sa.email}"
}

# Enable Cloud Functions API
resource "google_project_service" "cloud_functions" {
  project = var.project_id
  service = "cloudfunctions.googleapis.com"
}

# Cloud Scheduler job to trigger the function every 5 minutes
resource "google_cloud_scheduler_job" "live_data_collection" {
  name             = "live-data-collection"
  description      = "Triggers live data collection every 5 minutes"
  schedule         = "*/5 * * * *" # Every 5 minutes
  time_zone        = "America/New_York"
  attempt_deadline = "300s"

  retry_config {
    retry_count = 3
  }

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.live_data_collector.service_config[0].uri

    body = base64encode(jsonencode({
      parkIds          = ["75ea578a-adc8-4116-a54d-dccb60765ef9", "47f90d2c-e191-4239-a466-5892ef59a88b", "288747d1-8b4f-4a64-867e-ea7c9b27bad8", "1c84a229-8862-4648-9c71-378ddd2c7693"]
      cleanupOlderThan = "24h"
    }))

    headers = {
      "Content-Type" = "application/json"
    }

    oidc_token {
      service_account_email = google_service_account.function_sa.email
    }
  }

  depends_on = [google_project_service.cloud_scheduler]
}

# Enable Cloud Scheduler API
resource "google_project_service" "cloud_scheduler" {
  project = var.project_id
  service = "cloudscheduler.googleapis.com"
}

# Make the Cloud Function publicly accessible (for manual testing)
resource "google_cloudfunctions2_function_iam_member" "live_data_collector_public" {
  project        = google_cloudfunctions2_function.live_data_collector.project
  location       = google_cloudfunctions2_function.live_data_collector.location
  cloud_function = google_cloudfunctions2_function.live_data_collector.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}
