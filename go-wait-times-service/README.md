# Disneyland Wait Times - Go Microservice

This Go microservice handles wait time data collection and serves as the backend API for the Disneyland Line Predictor application. It fetches wait time data from the queue-times.com API, processes and filters important rides, stores historical data in PostgreSQL, and provides API endpoints for the frontend.

## Quick Start

1. **Complete Deployment (Recommended)**:
   ```batch
   # Deploy everything: Docker build + Terraform + Cloud Run
   .\scripts\full-deploy.bat
   ```

2. **Verify Deployment**:
   ```batch
   # Check service status and test health endpoint
   .\scripts\verify-deployment.bat
   ```

3. **Test the API**:
   - Health: `https://your-service-url/health`
   - Wait Times: `https://your-service-url/wait-times`

## Features

- **Data Collection**: Fetches current wait times for Disneyland rides from queue-times.com API
- **Smart Filtering**: Filters and processes only the most important/popular rides
- **Historical Storage**: Stores wait time snapshots with intelligent deduplication (prevents duplicate entries within 10 minutes)
- **Cloud Run Deployment**: Self-scheduling service deployed on Google Cloud Run
- **Database Management**: Uses GORM with PostgreSQL for efficient data storage and retrieval
- **Health Monitoring**: Built-in health check endpoints and comprehensive error handling
- **Clean Architecture**: Organized with repository pattern and clear separation of concerns

## Architecture

```
go-wait-times-service/
├── server/              # HTTP server entry point (deployed on Cloud Run)
├── config/              # Configuration and ride definitions
├── models/              # Data models and types
├── repository/          # Data access layer (database operations)
├── service/             # Business logic layer
├── terraform/           # Infrastructure as Code for Google Cloud
├── scripts/             # Deployment and build scripts
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (automatically loaded from Google Secret Manager in production)
  - Example: `postgresql://username:password@host:port/database?sslmode=disable`
  - **Production**: Stored securely in Google Secret Manager as `database-connection-string`
  - **Local Development**: Set as environment variable
- `PORT`: HTTP server port (default: 8080, for server mode only)

## Deployment Options

### Google Cloud Run (Current Deployment)

Self-scheduling containerized service with automatic scaling and secure secret management:

1. **Prerequisites**: 
   - Google Cloud CLI installed and authenticated
   - Terraform installed (version >= 1.0)
   - Docker installed
   - Database connection string stored in Google Secret Manager

2. **Setup**: 
   - Configure `terraform/terraform.tfvars` with your project settings (database URL no longer needed in config)
   - Ensure database connection string is stored in Google Secret Manager as `database-connection-string`
   - Ensure your database is accessible from Google Cloud

3. **Deploy**: 
   - Windows: Run `scripts/full-deploy.bat` (complete deployment)
   - Windows: Run `scripts/build-and-deploy-docker.bat` (Docker build & push only)
   - Linux/macOS: Run `scripts/build-and-deploy-docker.sh`

4. **What gets deployed**:
   - Self-scheduling Cloud Run service (collects data every 2 minutes internally)
   - Docker image stored in Artifact Registry
   - IAM service account with minimal permissions including Secret Manager access
   - Secure database connection via Google Secret Manager
   - Health check and HTTP endpoints for monitoring

See [terraform/README.md](terraform/README.md) for detailed deployment instructions.

### GitHub Actions CI/CD (Available for Production)

Automated deployment using GitHub Actions with secure credential management:

1. **Setup Required**:
   - Configure GitHub repository secrets for Google Cloud authentication
   - Set up Terraform state backend in Google Cloud Storage
   - See main project documentation for CI/CD setup details

2. **Automated Deployments**:
   - **Pull Requests**: Automatically runs `terraform plan` and posts results as comments
   - **Merge to main/master**: Automatically runs `terraform apply` to deploy changes
   - **Manual Triggers**: Use GitHub Actions tab to manually run plan, apply, or destroy

3. **Key Features**:
   - Secure credential handling via GitHub Secrets
   - Terraform state management with Google Cloud Storage backend
   - Plan review workflow for safe deployments
   - Format checking and validation

### Local Development & Testing

For quick local development and testing:

1. **Build and Run Locally**:
   ```batch
   # Build the Docker image
   .\scripts\build-and-deploy-docker.bat
   
   # OR run directly with Go
   cd server
   go run main.go
   ```

2. **Complete Deployment**:
   ```batch
   # Deploy everything (Docker + Terraform + Cloud Run)
   .\scripts\full-deploy.bat
   ```

3. **Verify Deployment**:
   ```batch
   # Check service status and test endpoints
   .\scripts\verify-deployment.bat
   ```

See [scripts/README-DOCKER.md](scripts/README-DOCKER.md) for detailed deployment instructions.

### HTTP Server Deployment

For containerized deployment, local development, or traditional server hosting:

1. **Local Development**:
```bash
cd server
go run main.go
# OR build and run
go build -o server main.go
./server
```

2. **Docker Deployment**:
```bash
# Build the Docker image
docker build -t disneyland-wait-times .

# Run with environment variables
docker run -e DATABASE_URL="your_postgres_url" -p 8080:8080 disneyland-wait-times
```

3. **Available Endpoints**:
   - `GET /wait-times` - Fetches and returns current wait times with historical data
   - `GET /health` - Health check endpoint
   - `POST /collect` - Manual data collection trigger (for testing/manual runs)

### Development with Docker Compose

The service is integrated with the main application's Docker Compose setup:

```bash
# From the root project directory
npm run docker:up
```

This starts the Go service alongside PostgreSQL and the Next.js frontend.

## API Response Format

The `/wait-times` endpoint returns a comprehensive JSON object with:

```json
{
  "all_rides": [...],              // All rides from the queue-times.com API
  "filtered_rides": [...],         // Only the important/monitored rides
  "sorted_rides": [...],           // Important rides sorted by wait time (lowest first)
  "flat_rides_history": [...],     // Historical wait time entries for important rides
  "sorted_ride_history": [...]     // Historical entries sorted by timestamp (newest first)
}
```

Each ride object contains:
- `id`: Disney ride identifier
- `name`: Name of the ride
- `is_open`: Boolean indicating if ride is currently operating
- `wait_time`: Current wait time in minutes
- `last_updated`: Timestamp of last data update

Historical entries include:
- `ride_id`, `ride_name`, `is_open`, `wait_time`: Same as current data
- `snapshot_time`: When the data point was recorded

## Database Schema

The service uses a PostgreSQL database with the primary table `ride_wait_time_snapshots`:

```sql
CREATE TABLE ride_wait_time_snapshots (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL,
    ride_name VARCHAR NOT NULL,
    is_open BOOLEAN NOT NULL,
    wait_time INTEGER NOT NULL,
    snapshot_time TIMESTAMP NOT NULL
);
```

**Data Deduplication**: The service automatically prevents duplicate entries within a 10-minute window for the same ride to maintain data quality and reduce storage overhead.

## Monitored Rides

The service filters and stores data for these key Disneyland attractions:

**Thrill Rides:**
- Space Mountain
- Big Thunder Mountain Railroad
- Indiana Jones™ Adventure

**New & Popular:**
- Tiana's Bayou Adventure
- Mickey & Minnie's Runaway Railway

**Star Wars Galaxy's Edge:**
- Star Wars: Rise of the Resistance
- Millennium Falcon: Smugglers Run

**Classic Attractions:**
- Jungle Cruise
- Pirates of the Caribbean
- Haunted Mansion
- Buzz Lightyear Astro Blasters

This curated list focuses on the most popular attractions that typically have the longest wait times and highest guest demand.

## Dependencies

**Core Dependencies:**
- `gorm.io/gorm` - Modern ORM for database operations
- `gorm.io/driver/postgres` - PostgreSQL driver for GORM
- `github.com/lib/pq` - Pure Go PostgreSQL driver

**Development Dependencies:**
- Go 1.21+ - Core language runtime
- Docker - For containerized development and deployment

## Performance Considerations

### Cloud Run Deployment
- **Always-Warm Instance**: Minimum instance count ensures no cold starts during active hours
- **Execution Time**: Data collection typically completes within 5-10 seconds including API calls and database operations
- **Memory Allocation**: 512MB allocated for optimal performance
- **Automatic Scaling**: Scales up to handle traffic spikes, down to minimum instances during low usage
- **Connection Pooling**: GORM automatically manages database connection pooling

### Traditional Server Deployment
- **Connection Pooling**: GORM automatically manages database connection pooling
- **Concurrent Safety**: All operations are thread-safe for high-traffic scenarios
- **Resource Usage**: Minimal memory footprint (~20-50MB typical usage)
- **Horizontal Scaling**: Stateless design allows for easy horizontal scaling

### Database Optimization
- **Efficient Queries**: Uses indexed queries for historical data retrieval
- **Batch Operations**: Processes multiple ride updates in efficient batches
- **Deduplication Logic**: Smart time-based deduplication reduces unnecessary database writes

## Error Handling & Monitoring

The service includes comprehensive error handling and logging:

**Network Resilience:**
- Automatic retry logic for API calls
- Graceful handling of queue-times.com API failures
- Timeout management for external requests

**Database Reliability:**
- Connection retry logic with exponential backoff
- Transaction safety for data consistency
- Graceful degradation when database is temporarily unavailable

**Logging & Monitoring:**
- Structured JSON logging for production environments
- Request/response logging for debugging
- Performance metrics and timing information
- Error tracking with stack traces

**Health Checks:**
- `/health` endpoint for load balancer health checks
- Database connectivity verification
- External API availability checks

## Security Considerations

- **Environment Variables**: All sensitive configuration via environment variables or secure secret management
- **Secret Management**: Database URLs stored securely in Google Secret Manager (no credentials in code/config)
- **Database Connections**: Uses connection strings with SSL/TLS support
- **API Keys**: No API keys required for queue-times.com (public API)
- **IAM Roles**: Minimal permission sets for cloud deployments including Secret Manager access
- **Network Security**: Compatible with VPCs and private subnets
- **Credential Isolation**: Production secrets never stored in version control or configuration files

## Development & Testing

**Local Development:**
```bash
# Set up environment
export DATABASE_URL="postgresql://username:password@localhost:5432/disneyland?sslmode=disable"

# Run directly
cd server
go run main.go

# Or build first
go build -o server main.go
./server
```

**Testing:**
```bash
# Test the health endpoint
curl http://localhost:8080/health

# Test wait times endpoint
curl http://localhost:8080/wait-times

# Test manual data collection (POST)
curl -X POST http://localhost:8080/collect
```

**Docker Development:**
```bash
# Use the project's Docker Compose setup
cd ../..  # Back to project root
npm run docker:up
```

This starts the complete development environment with PostgreSQL, the Go service, and the Next.js frontend.

## Current Deployment Status

The service is currently deployed and configured as follows:

- **Platform**: Google Cloud Run (self-scheduling service)
- **Region**: us-west2
- **Service URL**: `https://wait-times-service-fhixrynusa-wl.a.run.app`
- **Image**: `us-west2-docker.pkg.dev/theme-park-wait-times-app/wait-times-repo/wait-times-service:latest`
- **Data Collection**: Every 2 minutes internally (no external scheduler needed)
- **Database**: PostgreSQL (connection string securely stored in Google Secret Manager)
- **Secret Management**: Database credentials stored as `database-connection-string` secret

### Key Endpoints:
- **Health Check**: `/health` - Returns service status
- **Wait Times**: `/wait-times` - Fetches current wait times and historical data  
- **Manual Collection**: `POST /collect` - Manually triggers data collection (for testing)

### Secret Management:
```bash
# View secret (for administrators)
gcloud secrets versions access latest --secret="database-connection-string"

# Update secret (if database credentials change)
echo "new_connection_string" | gcloud secrets versions add database-connection-string --data-file=-
```

### Monitoring & Logs:
```batch
# View service status and health
.\scripts\verify-deployment.bat

# View logs in Google Cloud Console (Cloud Run)
gcloud run services logs read wait-times-service --region=us-west2 --limit=20
```
