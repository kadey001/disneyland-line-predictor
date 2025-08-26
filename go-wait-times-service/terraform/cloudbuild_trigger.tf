// Cloud Build trigger for live-data-collector
// Triggers when code under functions/live-data-collector changes in the GitHub repo

resource "google_project_iam_member" "cloudbuild_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
}

resource "google_cloudbuild_trigger" "live_data_collector_trigger" {
  name = "live-data-collector-trigger"

  github {
    owner = "kadey001"
    name  = "disneyland-line-predictor"

    push {
      branch = "^master$"
    }
  }

  filename = "go-wait-times-service/functions/live-data-collector/cloudbuild.yaml"

  included_files = [
    "go-wait-times-service/functions/live-data-collector/**",
  ]

  substitutions = {
    _IMAGE = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.wait_times_repo.repository_id}/live-data-collector:${"$"}COMMIT_SHA"
  }

  depends_on = [
    google_project_service.cloud_build,
    google_artifact_registry_repository.wait_times_repo,
  ]
}
