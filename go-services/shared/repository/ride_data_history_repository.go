package repository

import (
	"context"
	"fmt"
	"go-services/shared/db"
	"go-services/shared/models"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RideDataHistoryRepository handles database operations for ride data history
type RideDataHistoryRepository struct {
	pool *pgxpool.Pool
}

// NewRideDataHistoryRepository creates a new repository instance
func NewRideDataHistoryRepository() (*RideDataHistoryRepository, error) {
	// Create connection using Cloud SQL configuration
	pool, err := db.NewCloudSQLConnection(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to create database connection: %w", err)
	}

	return &RideDataHistoryRepository{
		pool: pool,
	}, nil
}

// Helper functions to check pointer equality for various types
func intPtrEqual(a, b *int) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return *a == *b
}

func stringPtrEqual(a, b *string) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return *a == *b
}

func timePtrEqual(a, b *time.Time) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return a.Equal(*b)
}

// isRideStateIdentical checks if two records are identical in wait time, status, and return time state.
func isRideStateIdentical(r1, r2 *models.RideDataHistoryRecord) bool {
	if r1.Status != r2.Status {
		return false
	}
	if !intPtrEqual(r1.StandbyWaitTime, r2.StandbyWaitTime) {
		return false
	}
	if !stringPtrEqual(r1.ReturnTimeState, r2.ReturnTimeState) {
		return false
	}
	if !timePtrEqual(r1.ReturnStart, r2.ReturnStart) {
		return false
	}
	if !timePtrEqual(r1.ReturnEnd, r2.ReturnEnd) {
		return false
	}
	return true
}

// InsertRideDataHistoryWithCounts inserts new ride data history records and returns counts of inserted/skipped
func (r *RideDataHistoryRepository) InsertRideDataHistoryWithCounts(ctx context.Context, records []*models.RideDataHistoryRecord) (inserted int, skipped int, err error) {
	if len(records) == 0 {
		return 0, 0, nil
	}

	// Fetch the latest database record for each ride to check state differences and age
	latestDBRecords, err := r.GetLatestRideDataForAllRides(ctx)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to fetch latest ride data: %w", err)
	}
	dbLatestMap := make(map[string]*models.RideDataHistoryRecord)
	for _, rec := range latestDBRecords {
		dbLatestMap[rec.RideID] = rec
	}

		// Deduplicate by RideID in the input batch, keeping the most recent
	latestRecords := make(map[string]*models.RideDataHistoryRecord)
	for _, record := range records {
		key := record.RideID
		if existing, ok := latestRecords[key]; ok {
			if record.LastUpdated.After(existing.LastUpdated) {
				latestRecords[key] = record
			}
		} else {
			latestRecords[key] = record
		}
	}

	// Set updated timestamp
	for _, record := range latestRecords {
		record.UpdatedAt = time.Now()
	}

	// Begin transaction
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	for _, record := range latestRecords {
		// Throttle logic: check if the state is identical and it has been less than 5 minutes since the last insert
		if dbRec, exists := dbLatestMap[record.RideID]; exists {
			if isRideStateIdentical(dbRec, record) {
				age := record.LastUpdated.Sub(dbRec.LastUpdated)
				if age < 5*time.Minute {
					skipped++
					continue
				}
			}
		}

		insertQuery := `
			INSERT INTO ride_data_history (
				ride_id, external_id, park_id, entity_type, name, status, last_updated,
				created_at, updated_at, operating_hours, standby_wait_time,
				return_time_state, return_start, return_end, forecast
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
			) ON CONFLICT (ride_id, last_updated) DO NOTHING`

		tag, err := tx.Exec(ctx, insertQuery,
			record.RideID, record.ExternalID, record.ParkID, record.EntityType,
			record.Name, record.Status, record.LastUpdated, record.CreatedAt,
			record.UpdatedAt, record.OperatingHours, record.StandbyWaitTime,
			record.ReturnTimeState, record.ReturnStart, record.ReturnEnd, record.Forecast,
		)

		if err != nil {
			return 0, 0, fmt.Errorf("failed to insert record for ride %s: %w", record.Name, err)
		}
		
		if tag.RowsAffected() > 0 {
			inserted++
			dbLatestMap[record.RideID] = record
		} else {
			skipped++
		}
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return 0, 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return inserted, skipped, nil
}

// InsertRideDataHistory inserts new ride data history records if they don't exist or if the new record's LastUpdated is newer
func (r *RideDataHistoryRepository) InsertRideDataHistory(ctx context.Context, records []*models.RideDataHistoryRecord) error {
	_, _, err := r.InsertRideDataHistoryWithCounts(ctx, records)
	return err
}

// GetRideDataHistoryByPark retrieves all ride data history for a specific park
func (r *RideDataHistoryRepository) GetRideDataHistoryByPark(ctx context.Context, parkID string) ([]*models.RideDataHistoryRecord, error) {
	query := `
		SELECT id, ride_id, external_id, park_id, entity_type, name, status, last_updated,
		       created_at, updated_at, operating_hours, standby_wait_time,
		       return_time_state, return_start, return_end, forecast
		FROM ride_data_history
		WHERE park_id = $1
		ORDER BY name ASC`

	rows, err := r.pool.Query(ctx, query, parkID)
	if err != nil {
		return nil, fmt.Errorf("failed to get ride data history for park %s: %w", parkID, err)
	}
	defer rows.Close()

	var records []*models.RideDataHistoryRecord
	for rows.Next() {
		record := &models.RideDataHistoryRecord{}
		err := rows.Scan(
			&record.ID, &record.RideID, &record.ExternalID, &record.ParkID, &record.EntityType,
			&record.Name, &record.Status, &record.LastUpdated, &record.CreatedAt, &record.UpdatedAt,
			&record.OperatingHours, &record.StandbyWaitTime, &record.ReturnTimeState,
			&record.ReturnStart, &record.ReturnEnd, &record.Forecast,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return records, nil
}

// GetRideDataHistoryByType retrieves all ride data history for a specific entity type
func (r *RideDataHistoryRepository) GetRideDataHistoryByType(ctx context.Context, entityType string) ([]*models.RideDataHistoryRecord, error) {
	query := `
		SELECT id, ride_id, external_id, park_id, entity_type, name, status, last_updated,
		       created_at, updated_at, operating_hours, standby_wait_time,
		       return_time_state, return_start, return_end, forecast
		FROM ride_data_history
		WHERE entity_type = $1
		ORDER BY park_id ASC, name ASC`

	rows, err := r.pool.Query(ctx, query, entityType)
	if err != nil {
		return nil, fmt.Errorf("failed to get ride data history for type %s: %w", entityType, err)
	}
	defer rows.Close()

	var records []*models.RideDataHistoryRecord
	for rows.Next() {
		record := &models.RideDataHistoryRecord{}
		err := rows.Scan(
			&record.ID, &record.RideID, &record.ExternalID, &record.ParkID, &record.EntityType,
			&record.Name, &record.Status, &record.LastUpdated, &record.CreatedAt, &record.UpdatedAt,
			&record.OperatingHours, &record.StandbyWaitTime, &record.ReturnTimeState,
			&record.ReturnStart, &record.ReturnEnd, &record.Forecast,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return records, nil
}

// GetAllRideDataHistory retrieves all ride data history
func (r *RideDataHistoryRepository) GetAllRideDataHistory(ctx context.Context) ([]*models.RideDataHistoryRecord, error) {
	query := `
		SELECT id, ride_id, external_id, park_id, entity_type, name, status, last_updated, 
		       created_at, updated_at, operating_hours, standby_wait_time, 
		       return_time_state, return_start, return_end, forecast
		FROM ride_data_history 
		ORDER BY park_id ASC, entity_type ASC, name ASC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all ride data history: %w", err)
	}
	defer rows.Close()

	var records []*models.RideDataHistoryRecord
	for rows.Next() {
		record := &models.RideDataHistoryRecord{}
		err := rows.Scan(
			&record.ID, &record.RideID, &record.ExternalID, &record.ParkID, &record.EntityType,
			&record.Name, &record.Status, &record.LastUpdated, &record.CreatedAt, &record.UpdatedAt,
			&record.OperatingHours, &record.StandbyWaitTime, &record.ReturnTimeState,
			&record.ReturnStart, &record.ReturnEnd, &record.Forecast,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return records, nil
}

// GetRideDataHistorySince retrieves ride data history since a specific time
func (r *RideDataHistoryRepository) GetRideDataHistorySince(ctx context.Context, since time.Time) ([]*models.RideDataHistoryRecord, error) {
	query := `
		SELECT id, ride_id, external_id, park_id, entity_type, name, status, last_updated, 
		       created_at, updated_at, operating_hours, standby_wait_time, 
		       return_time_state, return_start, return_end, forecast
		FROM ride_data_history 
		WHERE last_updated >= $1 
		ORDER BY last_updated DESC, park_id ASC, name ASC`

	rows, err := r.pool.Query(ctx, query, since)
	if err != nil {
		return nil, fmt.Errorf("failed to get ride data history since %v: %w", since, err)
	}
	defer rows.Close()

	var records []*models.RideDataHistoryRecord
	for rows.Next() {
		record := &models.RideDataHistoryRecord{}
		err := rows.Scan(
			&record.ID, &record.RideID, &record.ExternalID, &record.ParkID, &record.EntityType,
			&record.Name, &record.Status, &record.LastUpdated, &record.CreatedAt, &record.UpdatedAt,
			&record.OperatingHours, &record.StandbyWaitTime, &record.ReturnTimeState,
			&record.ReturnStart, &record.ReturnEnd, &record.Forecast,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return records, nil
}

// GetRideDataHistorySinceForRide retrieves ride data history since a specific time for a specific ride
func (r *RideDataHistoryRepository) GetRideDataHistorySinceForRide(ctx context.Context, since time.Time, rideID string) ([]*models.RideDataHistoryRecord, error) {
	query := `
		SELECT id, ride_id, external_id, park_id, entity_type, name, status, last_updated, 
		       created_at, updated_at, operating_hours, standby_wait_time, 
		       return_time_state, return_start, return_end, forecast
		FROM ride_data_history 
		WHERE last_updated >= $1 AND ride_id = $2
		ORDER BY last_updated DESC`

	rows, err := r.pool.Query(ctx, query, since, rideID)
	if err != nil {
		return nil, fmt.Errorf("failed to get ride data history for ride %s since %v: %w", rideID, since, err)
	}
	defer rows.Close()

	var records []*models.RideDataHistoryRecord
	for rows.Next() {
		record := &models.RideDataHistoryRecord{}
		err := rows.Scan(
			&record.ID, &record.RideID, &record.ExternalID, &record.ParkID, &record.EntityType,
			&record.Name, &record.Status, &record.LastUpdated, &record.CreatedAt, &record.UpdatedAt,
			&record.OperatingHours, &record.StandbyWaitTime, &record.ReturnTimeState,
			&record.ReturnStart, &record.ReturnEnd, &record.Forecast,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return records, nil
}

// GetLatestRideDataForAllRides retrieves the most recent entry for each ride
func (r *RideDataHistoryRepository) GetLatestRideDataForAllRides(ctx context.Context) ([]*models.RideDataHistoryRecord, error) {
	var records []*models.RideDataHistoryRecord

	// Use pgx directly to avoid prepared statement caching issues
	// Added a 24-hour bounding window to prevent full table scans and timeouts
	query := `
		SELECT DISTINCT ON (ride_id) id, ride_id, external_id, park_id, entity_type, name, status, last_updated,
		       created_at, updated_at, operating_hours, standby_wait_time,
		       return_time_state, return_start, return_end, forecast
		FROM ride_data_history
		WHERE last_updated >= NOW() - INTERVAL '24 hours'
		ORDER BY ride_id, last_updated DESC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var record models.RideDataHistoryRecord
		err := rows.Scan(
			&record.ID, &record.RideID, &record.ExternalID, &record.ParkID, &record.EntityType,
			&record.Name, &record.Status, &record.LastUpdated, &record.CreatedAt, &record.UpdatedAt,
			&record.OperatingHours, &record.StandbyWaitTime, &record.ReturnTimeState,
			&record.ReturnStart, &record.ReturnEnd, &record.Forecast,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		records = append(records, &record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return records, nil
}

// Close closes the database connection
func (r *RideDataHistoryRepository) Close() error {
	if r.pool != nil {
		r.pool.Close()
	}
	return nil
}

// HealthCheck verifies the database connection
func (r *RideDataHistoryRepository) HealthCheck(ctx context.Context) error {
	return db.HealthCheck(ctx, r.pool)
}

func init() {
	// Set the default timezone to UTC
	time.Local = time.UTC
}
