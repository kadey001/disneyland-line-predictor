output "wait_times_api_service_name" {
  description = "Name of the Wait Times API Cloud Run service"
  value       = google_cloud_run_v2_service.wait_times_api.name
}

output "wait_times_api_service_url" {
  description = "URL of the Wait Times API Cloud Run service"
  value       = google_cloud_run_v2_service.wait_times_api.uri
}

output "live_data_collector_service_name" {
  description = "Name of the Live Data Collector Cloud Run service"
  value       = google_cloud_run_v2_service.live_data_collector.name
}

output "live_data_collector_service_url" {
  description = "URL of the Live Data Collector Cloud Run service"
  value       = google_cloud_run_v2_service.live_data_collector.uri
}

output "artifact_registry_repo" {
  description = "Artifact Registry repository for Docker images"
  value       = google_artifact_registry_repository.wait_times_repo.name
}

output "service_account_email" {
  description = "Email of the service account used by the Cloud Run services"
  value       = google_service_account.cloud_run_sa.email
}

output "scheduler_job_name" {
  description = "Name of the Cloud Scheduler job for data collection"
  value       = google_cloud_scheduler_job.data_collection_job.name
}

output "scheduler_service_account_email" {
  description = "Email of the service account used by Cloud Scheduler"
  value       = google_service_account.scheduler_sa.email
}

output "cost_optimization_notes" {
  description = "Cost optimization measures implemented"
  value = <<EOF
DEV ENVIRONMENT COST OPTIMIZATIONS:
- CPU: 0.5 cores, Memory: 256Mi per service
- Min instances: 0 (pay-per-request)
- Data collection: Every 5 minutes
- Region: us-west2
- Timeout: 5 minutes per request
- CPU idle optimization: Enabled

Estimated monthly cost: ~$5-15 for light dev usage
Monitor costs in GCP Console > Billing
EOF
}
