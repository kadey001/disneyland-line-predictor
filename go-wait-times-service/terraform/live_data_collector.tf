// Cloud Run service for live-data-collector
// Reuses existing Artifact Registry repo and Secret Manager secret created for the wait-times service

data "google_secret_manager_secret" "database_connection_string" {
  project   = var.project_id
  secret_id = "database-connection-string"
}

resource "google_service_account" "live_data_run_sa" {
  account_id   = "live-data-run-sa"
  display_name = "Live Data Collector Cloud Run Service Account"
}

resource "google_project_iam_member" "live_data_sa_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.live_data_run_sa.email}"
}

resource "google_project_iam_member" "live_data_sa_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.live_data_run_sa.email}"
}

resource "google_project_iam_member" "live_data_sa_cloudsql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.live_data_run_sa.email}"
}

// Grant access to the existing Secret Manager secret
resource "google_secret_manager_secret_iam_member" "live_data_secret_access" {
  project   = var.project_id
  secret_id = data.google_secret_manager_secret.database_connection_string.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.live_data_run_sa.email}"
}

// Cloud Run service for live-data-collector
resource "google_cloud_run_v2_service" "live_data_collector" {
  name     = "live-data-collector"
  location = var.region
  project  = var.project_id

  template {
    service_account = google_service_account.live_data_run_sa.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.wait_times_repo.repository_id}/live-data-collector:latest"

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
    google_artifact_registry_repository.wait_times_repo,
    google_project_service.artifact_registry,
    google_project_service.secret_manager,
  ]
}

// Allow unauthenticated access for testing (optional)
resource "google_cloud_run_service_iam_member" "live_data_public" {
  service  = google_cloud_run_v2_service.live_data_collector.name
  location = google_cloud_run_v2_service.live_data_collector.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "live_data_collector_url" {
  value = google_cloud_run_v2_service.live_data_collector.template[0].containers[0].image
}
