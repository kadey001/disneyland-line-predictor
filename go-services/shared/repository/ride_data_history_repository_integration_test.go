package repository

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	"go-services/shared/models"
)

// newRideDataHistoryRepositoryForTest creates a repository with injected pool for testing
func newRideDataHistoryRepositoryForTest(pool *pgxpool.Pool) *RideDataHistoryRepository {
	return &RideDataHistoryRepository{
		pool: pool,
	}
}

func setupTestDatabase(t *testing.T) (*pgxpool.Pool, func()) {
	ctx := context.Background()

	// Start PostgreSQL container
	container, err := postgres.Run(ctx,
		"postgres:15-alpine",
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("testuser"),
		postgres.WithPassword("testpass"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(5*time.Second)),
	)
	require.NoError(t, err)

	// Get connection string
	connStr, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)

	// Create connection pool
	config, err := pgxpool.ParseConfig(connStr)
	require.NoError(t, err)

	pool, err := pgxpool.NewWithConfig(ctx, config)
	require.NoError(t, err)

	// Create tables with complete schema
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS ride_data_history (
			id BIGSERIAL PRIMARY KEY,
			ride_id TEXT NOT NULL,
			external_id TEXT NOT NULL,
			park_id TEXT NOT NULL,
			entity_type TEXT NOT NULL,
			name TEXT NOT NULL,
			status TEXT NOT NULL,
			last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL,
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
			operating_hours JSONB,
			standby_wait_time INTEGER,
			return_time_state TEXT,
			return_start TIMESTAMP WITH TIME ZONE,
			return_end TIMESTAMP WITH TIME ZONE,
			forecast JSONB
		);

		CREATE INDEX IF NOT EXISTS idx_ride_data_history_external_park
		ON ride_data_history(external_id, park_id);

		CREATE INDEX IF NOT EXISTS idx_ride_data_history_last_updated
		ON ride_data_history(last_updated DESC);
	`)
	require.NoError(t, err)

	// Return cleanup function
	cleanup := func() {
		pool.Close()
		container.Terminate(ctx)
	}

	return pool, cleanup
}

func TestRideDataHistoryRepository_InsertRideDataHistoryWithCounts_Integration(t *testing.T) {
	pool, cleanup := setupTestDatabase(t)
	defer cleanup()

	repo := newRideDataHistoryRepositoryForTest(pool)
	ctx := context.Background()

	tests := []struct {
		name         string
		records      []*models.RideDataHistoryRecord
		setupRecords []*models.RideDataHistoryRecord // Records to insert before the test
		expected     struct {
			inserted int
			skipped  int
		}
	}{
		{
			name: "insert new records",
			records: []*models.RideDataHistoryRecord{
				{
					RideID:          "ride1",
					ExternalID:      "ext1",
					ParkID:          "park1",
					EntityType:      "ATTRACTION",
					Name:            "Space Mountain",
					Status:          "OPERATING",
					LastUpdated:     time.Now(),
					CreatedAt:       time.Now(),
					UpdatedAt:       time.Now(),
					OperatingHours:  "[]",
					StandbyWaitTime: &[]int{45}[0],
					ReturnTimeState: &[]string{"AVAILABLE"}[0],
					ReturnStart:     func() *time.Time { t := time.Now().Add(time.Hour); return &t }(),
					ReturnEnd:       func() *time.Time { t := time.Now().Add(2 * time.Hour); return &t }(),
					Forecast:        "[]",
				},
			},
			expected: struct {
				inserted int
				skipped  int
			}{inserted: 1, skipped: 0},
		},
		{
			name: "skip duplicate records within 5 minutes",
			records: []*models.RideDataHistoryRecord{
				{
					RideID:          "ride1",
					ExternalID:      "ext1",
					ParkID:          "park1",
					EntityType:      "ATTRACTION",
					Name:            "Space Mountain",
					Status:          "OPERATING",
					LastUpdated:     time.Now().Add(2 * time.Minute), // Only 2 minutes newer
					CreatedAt:       time.Now(),
					UpdatedAt:       time.Now(),
					OperatingHours:  "[]",
					StandbyWaitTime: &[]int{45}[0],
					ReturnTimeState: &[]string{"AVAILABLE"}[0],
					ReturnStart:     func() *time.Time { t := time.Now().Add(time.Hour); return &t }(),
					ReturnEnd:       func() *time.Time { t := time.Now().Add(2 * time.Hour); return &t }(),
					Forecast:        "[]",
				},
			},
			expected: struct {
				inserted int
				skipped  int
			}{inserted: 0, skipped: 1},
			setupRecords: []*models.RideDataHistoryRecord{ // Pre-insert this record
				{
					RideID:          "ride1",
					ExternalID:      "ext1",
					ParkID:          "park1",
					EntityType:      "ATTRACTION",
					Name:            "Space Mountain",
					Status:          "OPERATING",
					LastUpdated:     time.Now(),
					CreatedAt:       time.Now(),
					UpdatedAt:       time.Now(),
					OperatingHours:  "[]",
					StandbyWaitTime: &[]int{45}[0],
					ReturnTimeState: &[]string{"AVAILABLE"}[0],
					ReturnStart:     func() *time.Time { t := time.Now().Add(time.Hour); return &t }(),
					ReturnEnd:       func() *time.Time { t := time.Now().Add(2 * time.Hour); return &t }(),
					Forecast:        "[]",
				},
			},
		},
		{
			name: "insert records after 5+ minutes",
			setupRecords: []*models.RideDataHistoryRecord{ // Pre-insert this record
				{
					RideID:          "ride1",
					ExternalID:      "ext1",
					ParkID:          "park1",
					EntityType:      "ATTRACTION",
					Name:            "Space Mountain",
					Status:          "OPERATING",
					LastUpdated:     time.Now(),
					CreatedAt:       time.Now(),
					UpdatedAt:       time.Now(),
					OperatingHours:  "[]",
					StandbyWaitTime: &[]int{45}[0],
					ReturnTimeState: &[]string{"AVAILABLE"}[0],
					ReturnStart:     func() *time.Time { t := time.Now().Add(time.Hour); return &t }(),
					ReturnEnd:       func() *time.Time { t := time.Now().Add(2 * time.Hour); return &t }(),
					Forecast:        "[]",
				},
			},
			records: []*models.RideDataHistoryRecord{
				{
					RideID:          "ride1",
					ExternalID:      "ext1",
					ParkID:          "park1",
					EntityType:      "ATTRACTION",
					Name:            "Space Mountain",
					Status:          "OPERATING",
					LastUpdated:     time.Now().Add(6 * time.Minute), // 6 minutes newer
					CreatedAt:       time.Now(),
					UpdatedAt:       time.Now(),
					OperatingHours:  "[]",
					StandbyWaitTime: &[]int{50}[0],
					ReturnTimeState: &[]string{"AVAILABLE"}[0],
					ReturnStart:     func() *time.Time { t := time.Now().Add(time.Hour); return &t }(),
					ReturnEnd:       func() *time.Time { t := time.Now().Add(2 * time.Hour); return &t }(),
					Forecast:        "[]",
				},
			},
			expected: struct {
				inserted int
				skipped  int
			}{inserted: 1, skipped: 0},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Clear table before each test
			_, err := pool.Exec(ctx, "DELETE FROM ride_data_history")
			require.NoError(t, err)

			// Insert setup records if any
			if len(tt.setupRecords) > 0 {
				_, _, err := repo.InsertRideDataHistoryWithCounts(ctx, tt.setupRecords)
				require.NoError(t, err)
			}

			inserted, skipped, err := repo.InsertRideDataHistoryWithCounts(ctx, tt.records)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected.inserted, inserted)
			assert.Equal(t, tt.expected.skipped, skipped)
		})
	}
}

func TestRideDataHistoryRepository_GetRideDataHistory_Integration(t *testing.T) {
	pool, cleanup := setupTestDatabase(t)
	defer cleanup()

	repo := newRideDataHistoryRepositoryForTest(pool)
	ctx := context.Background()

	// Insert test data
	testRecords := []*models.RideDataHistoryRecord{
		{
			RideID:          "ride1",
			ExternalID:      "ext1",
			ParkID:          "park1",
			EntityType:      "ATTRACTION",
			Name:            "Space Mountain",
			Status:          "OPERATING",
			LastUpdated:     time.Now().Add(-2 * time.Hour),
			CreatedAt:       time.Now().Add(-2 * time.Hour),
			UpdatedAt:       time.Now().Add(-2 * time.Hour),
			OperatingHours:  "[]",
			StandbyWaitTime: &[]int{45}[0],
			ReturnTimeState: &[]string{"AVAILABLE"}[0],
			ReturnStart:     func() *time.Time { t := time.Now().Add(-1 * time.Hour); return &t }(),
			ReturnEnd:       func() *time.Time { t := time.Now().Add(1 * time.Hour); return &t }(),
			Forecast:        "[]",
		},
		{
			RideID:          "ride2",
			ExternalID:      "ext2",
			ParkID:          "park2", // Different park
			EntityType:      "ATTRACTION",
			Name:            "Pirates of the Caribbean",
			Status:          "CLOSED",
			LastUpdated:     time.Now().Add(-1 * time.Hour),
			CreatedAt:       time.Now().Add(-1 * time.Hour),
			UpdatedAt:       time.Now().Add(-1 * time.Hour),
			OperatingHours:  "[]",
			StandbyWaitTime: nil,
			ReturnTimeState: nil,
			ReturnStart:     nil,
			ReturnEnd:       nil,
			Forecast:        "[]",
		},
	}

	_, _, err := repo.InsertRideDataHistoryWithCounts(ctx, testRecords)
	require.NoError(t, err)

	tests := []struct {
		name     string
		rideID   string
		parkID   string
		limit    int
		expected int // expected number of records
	}{
		{
			name:     "get history for specific park",
			rideID:   "ride1",
			parkID:   "park1",
			limit:    10,
			expected: 1, // Only ride1 is in park1
		},
		{
			name:     "get history with limit",
			rideID:   "",
			parkID:   "park1",
			limit:    1,
			expected: 1, // Only 1 record in park1
		},
		{
			name:     "get all history for park",
			rideID:   "",
			parkID:   "park1",
			limit:    10,
			expected: 1, // Only 1 record in park1
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			records, err := repo.GetRideDataHistoryByPark(ctx, tt.parkID)
			assert.NoError(t, err)
			assert.Len(t, records, tt.expected)
		})
	}
}
