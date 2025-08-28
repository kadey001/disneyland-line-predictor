variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "theme-park-wait-times-app"
}

variable "project_number" {
  description = "The GCP project number"
  type        = string
  default     = "602235714983"
}

variable "region" {
  description = "The GCP region to deploy to"
  type        = string
  default     = "us-west2"
}

variable "wait_times_api_service_name" {
  description = "The name of the Wait Times API Cloud Run service"
  type        = string
  default     = "wait-times-api"
}

variable "live_data_collector_service_name" {
  description = "The name of the Live Data Collector Cloud Run service"
  type        = string
  default     = "live-data-collector-service"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "data_collection_schedule" {
  description = "Cron schedule for data collection"
  type        = string
  default     = "* 8-23,0-1 * * *"
}

variable "scheduler_timezone" {
  description = "Timezone for the Cloud Scheduler job"
  type        = string
  default     = "America/Los_Angeles"
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "kadey001"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "disneyland-line-predictor"
}
