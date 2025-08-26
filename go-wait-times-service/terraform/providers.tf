terraform {
  required_version = ">= 1.0"

  # Remote state backend (uncomment and configure for production)
  # backend "gcs" {
  #   bucket = "theme-park-wait-times-terraform-state"
  #   prefix = "terraform/state"
  # }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}
