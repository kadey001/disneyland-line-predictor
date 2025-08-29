# Main Terraform configuration for Disney Wait Times services
# Deploys Wait Times API and Live Data Collector services to Cloud Run

# Enable required APIs
resource "google_project_service" "cloud_run" {
  project = var.project_id
  service = "run.googleapis.com"
}

resource "google_project_service" "cloud_build" {
  project = var.project_id
  service = "cloudbuild.googleapis.com"
}

resource "google_project_service" "artifact_registry" {
  project = var.project_id
  service = "artifactregistry.googleapis.com"
}

resource "google_project_service" "secret_manager" {
  project = var.project_id
  service = "secretmanager.googleapis.com"
}

resource "google_project_service" "cloud_scheduler" {
  project = var.project_id
  service = "cloudscheduler.googleapis.com"
}

# Grant Cloud Build service account permission to write to Artifact Registry
resource "google_project_iam_member" "cloudbuild_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
}

# Create Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "wait_times_repo" {
  location      = var.region
  repository_id = "wait-times-repo"
  description   = "Docker repository for wait times services"
  format        = "DOCKER"

  depends_on = [google_project_service.artifact_registry]
}

# Reference existing Secret Manager secret for database connection string
data "google_secret_manager_secret" "database_connection_string" {
  project   = var.project_id
  secret_id = "database-connection-string"

  depends_on = [google_project_service.secret_manager]
}

# Create a service account for the Cloud Run services
resource "google_service_account" "cloud_run_sa" {
  account_id   = "wait-times-cloud-run-sa"
  display_name = "Wait Times Cloud Run Service Account"
  description  = "Service account for the wait times Cloud Run services"
}

# Grant necessary permissions to the service account
resource "google_project_iam_member" "cloud_run_sa_cloudsql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_sa_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_sa_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant access to Secret Manager for the service account
resource "google_secret_manager_secret_iam_member" "database_secret_access" {
  project   = var.project_id
  secret_id = data.google_secret_manager_secret.database_connection_string.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Deploy Wait Times API Cloud Run service
resource "google_cloud_run_v2_service" "wait_times_api" {
  name     = var.wait_times_api_service_name
  location = var.region
  project  = var.project_id

  template {
    service_account = google_service_account.cloud_run_sa.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.wait_times_repo.repository_id}/wait-times-api:${var.wait_times_api_image_tag}"

      ports {
        container_port = 8080
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.database_connection_string.name
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "0.5"
          memory = "256Mi"
        }
        cpu_idle = true
      }
    }

    timeout = "300s"

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.cloud_run,
    google_service_account.cloud_run_sa
  ]
}

# Deploy Live Data Collector Service Cloud Run service
resource "google_cloud_run_v2_service" "live_data_collector" {
  name     = var.live_data_collector_service_name
  location = var.region
  project  = var.project_id

  template {
    service_account = google_service_account.cloud_run_sa.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.wait_times_repo.repository_id}/live-data-collector-service:${var.live_data_collector_image_tag}"

      ports {
        container_port = 8080
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.database_connection_string.name
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "0.5"
          memory = "256Mi"
        }
        cpu_idle = true
      }
    }

    timeout = "300s"

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [
    google_project_service.cloud_run,
    google_service_account.cloud_run_sa
  ]
}

# Allow public access to the Wait Times API service
resource "google_cloud_run_service_iam_member" "wait_times_api_public_access" {
  service  = google_cloud_run_v2_service.wait_times_api.name
  location = google_cloud_run_v2_service.wait_times_api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow public access to the Live Data Collector service (for manual testing)
resource "google_cloud_run_service_iam_member" "live_data_collector_public_access" {
  service  = google_cloud_run_v2_service.live_data_collector.name
  location = google_cloud_run_v2_service.live_data_collector.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Create a service account for Cloud Scheduler
resource "google_service_account" "scheduler_sa" {
  account_id   = "wait-times-scheduler-sa"
  display_name = "Wait Times Cloud Scheduler Service Account"
  description  = "Service account for Cloud Scheduler to invoke live data collector"
}

# Grant Cloud Scheduler service account permission to invoke Cloud Run services
resource "google_cloud_run_service_iam_member" "scheduler_invoker" {
  service  = google_cloud_run_v2_service.live_data_collector.name
  location = google_cloud_run_v2_service.live_data_collector.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler_sa.email}"
}

# Create Cloud Scheduler job to collect data
resource "google_cloud_scheduler_job" "data_collection_job" {
  name             = "live-data-collection-job"
  description      = "Collects live wait time data from Disney parks"
  schedule         = var.data_collection_schedule
  time_zone        = var.scheduler_timezone
  attempt_deadline = "320s"  # 5 minutes and 20 seconds deadline
  region           = var.region

  retry_config {
    retry_count = 3
  }

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.live_data_collector.uri}/collect"
    
    body = base64encode(jsonencode({
      parkIds = [
        "7340550b-c14d-4def-80bb-acdb51d49a66",  # Disneyland
        "832fcd51-ea19-4e77-85c7-75d5843b127c"   # Disney California Adventure
      ]
    }))

    headers = {
      "Content-Type" = "application/json"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
      audience              = google_cloud_run_v2_service.live_data_collector.uri
    }
  }

  depends_on = [
    google_project_service.cloud_scheduler,
    google_service_account.scheduler_sa,
    google_cloud_run_v2_service.live_data_collector
  ]
}
