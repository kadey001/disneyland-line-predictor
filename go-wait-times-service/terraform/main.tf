# Cloud Run deployment configuration for wait times service

# Enable required APIs
resource "google_project_service" "cloud_run" {
  project = var.project_id
  service = "run.googleapis.com"
}

resource "google_project_service" "cloud_build" {
  project = var.project_id
  service = "cloudbuild.googleapis.com"
}

resource "google_project_service" "cloud_scheduler" {
  project = var.project_id
  service = "cloudscheduler.googleapis.com"
}

resource "google_project_service" "artifact_registry" {
  project = var.project_id
  service = "artifactregistry.googleapis.com"
}

# Create Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "wait_times_repo" {
  location      = var.region
  repository_id = "wait-times-repo"
  description   = "Docker repository for wait times service"
  format        = "DOCKER"

  depends_on = [google_project_service.artifact_registry]
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
        name  = "DATABASE_URL"
        value = var.database_connection_string
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

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

# Create Cloud Scheduler job to trigger the Cloud Run service
resource "google_cloud_scheduler_job" "wait_times_schedule" {
  name         = "wait-times-schedule"
  project      = var.project_id
  region       = var.region
  schedule     = var.schedule_cron
  time_zone    = "America/Los_Angeles"
  description  = "Scheduled job to collect wait times data"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.wait_times_service.uri}/collect"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run_sa.email
    }
  }

  depends_on = [
    google_project_service.cloud_scheduler,
    google_cloud_run_v2_service.wait_times_service
  ]
}

# Allow public access to the Cloud Run service (for manual testing)
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_v2_service.wait_times_service.name
  location = google_cloud_run_v2_service.wait_times_service.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
