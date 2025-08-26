# Ride Data History Collection System

This system provides serverless collection and storage of live ride data from the themeparks.wiki API.

## Overview

The system consists of:

1. **Database Table**: `ride_data_history` - Stores historical ride data with proper JSON array fields
2. **Go Repository**: `RideDataHistoryRepository` - Handles database operations
3. **Go Service**: `RideDataHistoryService` - Manages API calls and data processing
4. **Cloud Function**: `live-data-collector` - Serverless function for automated data collection
5. **Cloud Scheduler**: Automatically triggers data collection every 5 minutes

## Database Schema

The `ride_data_history` table includes:

- **Basic Info**: ID, external ID, park ID, entity type, name, status
- **Timestamps**: Last updated, created at, updated at
- **Operating Hours**: JSON array of operating hours
- **Queue Data**: Standby wait time, return time information
- **Forecast**: JSON array of forecast data points

## API Integration

### Data Source
- **API**: `https://api.themeparks.wiki/v1/entity/{parkId}/live`
- **Format**: JSON with ride/attraction data
- **Types**: Attractions, Shows, Restaurants

### Default Parks
- Magic Kingdom: `75ea578a-adc8-4116-a54d-dccb60765ef9`
- EPCOT: `47f90d2c-e191-4239-a466-5892ef59a88b`
- Hollywood Studios: `288747d1-8b4f-4a64-867e-ea7c9b27bad8`
- Animal Kingdom: `1c84a229-8862-4648-9c71-378ddd2c7693`

## Deployment

### Prerequisites
1. Google Cloud Project with APIs enabled
2. Supabase/PostgreSQL database
3. Environment variables:
   - `PROJECT_ID`: Your Google Cloud project ID
   - `REGION`: Deployment region (default: us-east1)
   - `DATABASE_URL`: Database connection string

### Windows Deployment
```batch
# Set environment variables
set PROJECT_ID=your-project-id
set REGION=us-east1

# Test the system
cd go-wait-times-service\scripts
test-ride-data-collection.bat

# Deploy to production
deploy-live-data-function.bat
```

### Linux/Mac Deployment
```bash
# Set environment variables
export PROJECT_ID=your-project-id
export REGION=us-east1

# Test the system
cd go-wait-times-service/scripts
./test-ride-data-collection.sh

# Deploy to production
./deploy-live-data-function.sh
```

## Architecture

### Serverless Design
- **Cloud Function**: Handles data collection requests
- **Auto-scaling**: Scales from 0 to 10 instances based on demand
- **Scheduled Execution**: Runs every 5 minutes via Cloud Scheduler
- **Error Handling**: Graceful error handling with partial success support

### Database Design
- **Upsert Operations**: Prevents duplicate data while updating existing records
- **JSON Arrays**: Proper handling of operating hours and forecast data
- **Indexing**: Optimized for common query patterns
- **Cleanup**: Automatic removal of old data (configurable retention period)

## Monitoring & Maintenance

### Logging
```bash
# View function logs
gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=live-data-collector" --limit 50

# View error logs only
gcloud logging read "resource.type=cloud_function AND severity>=ERROR" --limit 20
```

### Manual Testing
```bash
# Test function via HTTP
curl -X POST "https://REGION-PROJECT_ID.cloudfunctions.net/live-data-collector" \
     -H "Content-Type: application/json" \
     -d '{"parkIds": ["75ea578a-adc8-4116-a54d-dccb60765ef9"], "cleanupOlderThan": "24h"}'
```

### Database Queries
```sql
-- View recent data
SELECT * FROM ride_data_history 
WHERE last_updated > NOW() - INTERVAL '1 hour' 
ORDER BY last_updated DESC;

-- Count records by park
SELECT park_id, COUNT(*) as record_count 
FROM ride_data_history 
GROUP BY park_id;

-- View operating status
SELECT status, COUNT(*) as count 
FROM ride_data_history 
WHERE last_updated > NOW() - INTERVAL '1 hour'
GROUP BY status;
```

## Configuration

### Function Configuration
- **Memory**: 256Mi
- **Timeout**: 300 seconds
- **Concurrency**: 1 request per instance
- **CPU**: 0.167 (1/6 of a vCPU)

### Scheduling
- **Frequency**: Every 5 minutes
- **Timezone**: America/New_York
- **Retry**: 3 attempts on failure
- **Deadline**: 300 seconds

### Data Retention
- **Default**: 24 hours
- **Configurable**: Via `cleanupOlderThan` parameter
- **Format**: Go duration strings (e.g., "24h", "7d", "168h")

## Cost Optimization

- **Serverless**: Pay per execution, not idle time
- **Efficient Queries**: Optimized database operations
- **Minimal Resources**: Right-sized function resources
- **Data Cleanup**: Automatic removal of old data

## Security

- **IAM**: Proper service account permissions
- **Secret Management**: Database credentials in Secret Manager
- **Network**: Private communication between services
- **CORS**: Configured for browser requests

## Future Enhancements

1. **Real-time Analytics**: Stream processing for live insights
2. **Predictive Modeling**: ML-based wait time predictions
3. **Alert System**: Notifications for unusual patterns
4. **Data Export**: Automated data exports for analysis
5. **Multi-park Support**: Easy addition of new theme parks
