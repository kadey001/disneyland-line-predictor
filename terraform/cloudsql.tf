# Cloud SQL PostgreSQL instance — minimal cost configuration
# Replaces Supabase as the primary database

# Enable Cloud SQL Admin API
resource "google_project_service" "sqladmin" {
  project = var.project_id
  service = "sqladmin.googleapis.com"
}

# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "wait_times_db" {
  name             = "wait-times-db"
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier              = "db-f1-micro" # Shared-core, ~$8-10/month
    edition           = "ENTERPRISE"
    availability_type = "ZONAL" # Single zone, cheapest option

    disk_size             = 10  # 10 GB SSD (minimum)
    disk_type             = "PD_SSD"
    disk_autoresize       = true
    disk_autoresize_limit = 50 # Cap at 50 GB to control costs

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = false # Saves cost
      start_time                     = "03:00" # 3 AM UTC

      backup_retention_settings {
        retained_backups = 7
      }
    }

    ip_configuration {
      ipv4_enabled = true # Public IP for Cloud Run access

      # Cloud Run connects via Cloud SQL Auth Proxy (no authorized networks needed)
      # But allow for local development access
      authorized_networks {
        name  = "allow-all"
        value = "0.0.0.0/0"
      }
    }

    maintenance_window {
      day          = 7 # Sunday
      hour         = 4 # 4 AM UTC
      update_track = "stable"
    }

    database_flags {
      name  = "max_connections"
      value = "50"
    }
  }

  deletion_protection = true

  depends_on = [google_project_service.sqladmin]
}

# Application database
resource "google_sql_database" "wait_times" {
  name     = "wait_times"
  instance = google_sql_database_instance.wait_times_db.name
}

# Database user for the application
resource "random_password" "db_password" {
  length  = 24
  special = false # Avoid special chars that cause connection string issues
}

resource "google_sql_user" "app_user" {
  name     = "app"
  instance = google_sql_database_instance.wait_times_db.name
  password = random_password.db_password.result
}

# Store the connection string in Secret Manager (replaces the existing Supabase connection string)
# Note: Update the existing "database-connection-string" secret after provisioning
# The Cloud Run services already reference this secret
