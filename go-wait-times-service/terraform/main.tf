# Cloud Run deployment configuration for wait times service
# 
# This configuration deploys a self-scheduling Cloud Run service that:
# - Runs continuously with min_instance_count = 1
# - Collects Disney wait times data every 2 minutes using internal scheduler
# - No longer requires Cloud Scheduler as scheduling is handled internally
# - Includes graceful shutdown handling for data collection

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

# Create Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "wait_times_repo" {
  location      = var.region
  repository_id = "wait-times-repo"
  description   = "Docker repository for wait times service"
  format        = "DOCKER"

  depends_on = [google_project_service.artifact_registry]
}

# Reference existing Secret Manager secret for database connection string
data "google_secret_manager_secret" "database_connection_string" {
  project   = var.project_id
  secret_id = "database-connection-string"

  depends_on = [google_project_service.secret_manager]
}

# Create a service account for the Cloud Run service
resource "google_service_account" "cloud_run_sa" {
  account_id   = "wait-times-cloud-run-sa"
  display_name = "Wait Times Cloud Run Service Account"
  description  = "Service account for the wait times Cloud Run service"
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

# Deploy Cloud Run service
resource "google_cloud_run_v2_service" "wait_times_service" {
  name     = var.service_name
  location = var.region
  project  = var.project_id

  template {
    service_account = google_service_account.cloud_run_sa.email
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.wait_times_repo.repository_id}/wait-times-service:latest"
      
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
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    scaling {
      min_instance_count = 1
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

# Allow public access to the Cloud Run service (for manual testing)
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  name     = google_cloud_run_v2_service.wait_times_service.name
  location = google_cloud_run_v2_service.wait_times_service.location
  project  = google_cloud_run_v2_service.wait_times_service.project
  role     = "roles/run.invoker"
  member   = "allUsers"
}
