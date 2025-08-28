package repository

import (
	"context"
	"fmt"
	"go-services/shared/db"
	"go-services/shared/models"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RideDataHistoryRepository handles database operations for ride data history
type RideDataHistoryRepository struct {
	pool *pgxpool.Pool
}

// NewRideDataHistoryRepository creates a new repository instance
func NewRideDataHistoryRepository() (*RideDataHistoryRepository, error) {
	// Create connection using Supabase configuration
	pool, err := db.NewSupabaseConnection(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to create database connection: %w", err)
	}

	return &RideDataHistoryRepository{
		pool: pool,
	}, nil
}

// InsertRideDataHistoryWithCounts inserts new ride data history records and returns counts of inserted/skipped
func (r *RideDataHistoryRepository) InsertRideDataHistoryWithCounts(ctx context.Context, records []*models.RideDataHistoryRecord) (inserted int, skipped int, err error) {
	if len(records) == 0 {
		return 0, 0, nil
	}

	// Begin transaction
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	for _, record := range records {
		// Check if a record with the same external_id and park_id exists
		// Get the MOST RECENT record (by last_updated) for this ride
		checkQuery := `
			SELECT id, last_updated 
			FROM ride_data_history 
			WHERE external_id = $1 AND park_id = $2 
			ORDER BY last_updated DESC 
			LIMIT 1`

		var existingID int64
		var existingTime time.Time
		err := tx.QueryRow(ctx, checkQuery, record.ExternalID, record.ParkID).Scan(&existingID, &existingTime)

		if err != nil && err != pgx.ErrNoRows {
			return 0, 0, fmt.Errorf("failed to check existing record for ride %s: %w", record.Name, err)
		}

		// Ensure both times are in UTC for comparison
		newTime := record.LastUpdated.UTC()
		shouldInsert := false

		if err == pgx.ErrNoRows {
			// New record - insert it
			shouldInsert = true
		} else if newTime.Sub(existingTime.UTC()) >= 5*time.Minute {
			// Existing record found and new data is at least 5 minutes newer - insert new record
			shouldInsert = true
		} else {
			// Existing record is newer or same or less than 5 minutes newer - skip
			skipped++
			continue
		}

		if shouldInsert {
			record.UpdatedAt = time.Now()

			insertQuery := `
				INSERT INTO ride_data_history (
					ride_id, external_id, park_id, entity_type, name, status, last_updated,
					created_at, updated_at, operating_hours, standby_wait_time,
					return_time_state, return_start, return_end, forecast
				) VALUES (
					$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
				)`

			_, err := tx.Exec(ctx, insertQuery,
				record.RideID, record.ExternalID, record.ParkID, record.EntityType,
				record.Name, record.Status, record.LastUpdated, record.CreatedAt,
				record.UpdatedAt, record.OperatingHours, record.StandbyWaitTime,
				record.ReturnTimeState, record.ReturnStart, record.ReturnEnd, record.Forecast,
			)

			if err != nil {
				return 0, 0, fmt.Errorf("failed to insert record for ride %s: %w", record.Name, err)
			}
			inserted++
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

// GetLatestRideDataForAllRides retrieves the most recent entry for each ride
func (r *RideDataHistoryRepository) GetLatestRideDataForAllRides(ctx context.Context) ([]*models.RideDataHistoryRecord, error) {
	var records []*models.RideDataHistoryRecord

	// Use pgx directly to avoid prepared statement caching issues
	query := `
		SELECT id, ride_id, external_id, park_id, entity_type, name, status, last_updated,
		       created_at, updated_at, operating_hours, standby_wait_time,
		       return_time_state, return_start, return_end, forecast
		FROM ride_data_history
		WHERE (ride_id, last_updated) IN (
			SELECT ride_id, MAX(last_updated)
			FROM ride_data_history
			GROUP BY ride_id
		)
		ORDER BY park_id ASC, name ASC`

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
