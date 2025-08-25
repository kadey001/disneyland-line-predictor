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

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
  default     = "wait-times-service"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}
