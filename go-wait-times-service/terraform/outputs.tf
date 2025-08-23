output "cloud_run_service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.wait_times_service.name
}

output "cloud_run_service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.wait_times_service.uri
}

output "scheduler_job_name" {
  description = "Name of the Cloud Scheduler job"
  value       = google_cloud_scheduler_job.wait_times_schedule.name
}

output "artifact_registry_repo" {
  description = "Artifact Registry repository for Docker images"
  value       = google_artifact_registry_repository.wait_times_repo.name
}

output "service_account_email" {
  description = "Email of the service account used by the Cloud Run service"
  value       = google_service_account.cloud_run_sa.email
}
