package repository

import (
	"context"
	"log"
	"testing"
	"time"

	"go-services/shared/models"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

// TestRideDataHistoryRepository_Integration tests the repository with a real PostgreSQL database
func TestRideDataHistoryRepository_Integration(t *testing.T) {
	// Skip if not running integration tests
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	ctx := context.Background()

	// Start PostgreSQL container
	pgContainer, err := postgres.Run(ctx,
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
	defer func() {
		if err := testcontainers.TerminateContainer(pgContainer); err != nil {
			log.Printf("failed to terminate container: %s", err)
		}
	}()

	// Get connection string
	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err)

	// Create pgx pool
	config, err := pgxpool.ParseConfig(connStr)
	require.NoError(t, err)

	pool, err := pgxpool.NewWithConfig(ctx, config)
	require.NoError(t, err)
	defer pool.Close()

	// Create tables
	err = createTestTables(ctx, pool)
	require.NoError(t, err)

	// Test repository creation
	repo := &RideDataHistoryRepository{pool: pool}
	defer repo.Close()

	// Test HealthCheck
	t.Run("HealthCheck", func(t *testing.T) {
		err := repo.HealthCheck(ctx)
		assert.NoError(t, err)
	})

	// Test InsertRideDataHistoryWithCounts
	t.Run("InsertRideDataHistoryWithCounts", func(t *testing.T) {
		records := []*models.RideDataHistoryRecord{
			{
				RideID:          "ride1",
				ExternalID:      "ext1",
				ParkID:          "disneyland",
				EntityType:      "ATTRACTION",
				Name:            "Space Mountain",
				Status:          "OPERATING",
				LastUpdated:     time.Now(),
				CreatedAt:       time.Now(),
				UpdatedAt:       time.Now(),
				OperatingHours:  "{}",
				StandbyWaitTime: intPtr(30),
				Forecast:        "{}",
			},
			{
				RideID:          "ride2",
				ExternalID:      "ext2",
				ParkID:          "disneyland",
				EntityType:      "ATTRACTION",
				Name:            "Pirates of the Caribbean",
				Status:          "OPERATING",
				LastUpdated:     time.Now(),
				CreatedAt:       time.Now(),
				UpdatedAt:       time.Now(),
				OperatingHours:  "{}",
				StandbyWaitTime: intPtr(45),
				Forecast:        "{}",
			},
		}

		inserted, skipped, err := repo.InsertRideDataHistoryWithCounts(ctx, records)
		assert.NoError(t, err)
		assert.Equal(t, 2, inserted)
		assert.Equal(t, 0, skipped)
	})

	// Test GetLatestRideDataForAllRides
	t.Run("GetLatestRideDataForAllRides", func(t *testing.T) {
		records, err := repo.GetLatestRideDataForAllRides(ctx)
		assert.NoError(t, err)
		assert.Len(t, records, 2)

		// Verify records
		rideIDs := make(map[string]bool)
		for _, record := range records {
			rideIDs[record.RideID] = true
			assert.NotEmpty(t, record.RideID)
			assert.NotEmpty(t, record.Name)
			assert.NotZero(t, record.LastUpdated)
		}

		assert.True(t, rideIDs["ride1"])
		assert.True(t, rideIDs["ride2"])
	})

	// Test GetRideDataHistorySince
	t.Run("GetRideDataHistorySince", func(t *testing.T) {
		since := time.Now().Add(-1 * time.Hour)
		records, err := repo.GetRideDataHistorySince(ctx, since)
		assert.NoError(t, err)
		assert.Len(t, records, 2)

		for _, record := range records {
			assert.True(t, record.LastUpdated.After(since) || record.LastUpdated.Equal(since))
		}
	})

	// Test GetRideDataHistoryByPark
	t.Run("GetRideDataHistoryByPark", func(t *testing.T) {
		records, err := repo.GetRideDataHistoryByPark(ctx, "disneyland")
		assert.NoError(t, err)
		assert.Len(t, records, 2)

		for _, record := range records {
			assert.Equal(t, "disneyland", record.ParkID)
		}
	})

	// Test GetRideDataHistoryByType
	t.Run("GetRideDataHistoryByType", func(t *testing.T) {
		records, err := repo.GetRideDataHistoryByType(ctx, "ATTRACTION")
		assert.NoError(t, err)
		assert.Len(t, records, 2)

		for _, record := range records {
			assert.Equal(t, "ATTRACTION", record.EntityType)
		}
	})

	// Test GetAllRideDataHistory
	t.Run("GetAllRideDataHistory", func(t *testing.T) {
		records, err := repo.GetAllRideDataHistory(ctx)
		assert.NoError(t, err)
		assert.Len(t, records, 2)
	})

	// Test duplicate handling
	t.Run("InsertRideDataHistoryWithCounts_Duplicates", func(t *testing.T) {
		duplicateRecords := []*models.RideDataHistoryRecord{
			{
				RideID:          "ride1",
				ExternalID:      "ext1", // Same external ID as before
				ParkID:          "disneyland",
				EntityType:      "ATTRACTION",
				Name:            "Space Mountain Updated",
				Status:          "CLOSED",
				LastUpdated:     time.Now(),
				CreatedAt:       time.Now(),
				UpdatedAt:       time.Now(),
				OperatingHours:  "{}",
				StandbyWaitTime: intPtr(0),
				Forecast:        "{}",
			},
		}

		inserted, skipped, err := repo.InsertRideDataHistoryWithCounts(ctx, duplicateRecords)
		assert.NoError(t, err)
		assert.Equal(t, 0, inserted)
		assert.Equal(t, 1, skipped)
	})

	// Test with non-existent park
	t.Run("GetRideDataHistoryByPark_NonExistent", func(t *testing.T) {
		records, err := repo.GetRideDataHistoryByPark(ctx, "nonexistent")
		assert.NoError(t, err)
		assert.Len(t, records, 0)
	})

	// Test with non-existent type
	t.Run("GetRideDataHistoryByType_NonExistent", func(t *testing.T) {
		records, err := repo.GetRideDataHistoryByType(ctx, "NONEXISTENT")
		assert.NoError(t, err)
		assert.Len(t, records, 0)
	})
}

// createTestTables creates the necessary tables for testing
func createTestTables(ctx context.Context, pool *pgxpool.Pool) error {
	// Create ride_data_history table
	createTableSQL := `
		CREATE TABLE IF NOT EXISTS ride_data_history (
			id BIGSERIAL PRIMARY KEY,
			ride_id TEXT NOT NULL,
			external_id TEXT,
			park_id TEXT NOT NULL,
			entity_type TEXT NOT NULL,
			name TEXT NOT NULL,
			status TEXT,
			last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			operating_hours JSONB,
			standby_wait_time INTEGER,
			forecast JSONB
		);

		CREATE INDEX IF NOT EXISTS idx_ride_data_history_ride_id ON ride_data_history(ride_id);
		CREATE INDEX IF NOT EXISTS idx_ride_data_history_park_id ON ride_data_history(park_id);
		CREATE INDEX IF NOT EXISTS idx_ride_data_history_entity_type ON ride_data_history(entity_type);
		CREATE INDEX IF NOT EXISTS idx_ride_data_history_last_updated ON ride_data_history(last_updated);
		CREATE INDEX IF NOT EXISTS idx_ride_data_history_external_park ON ride_data_history(external_id, park_id);
	`

	_, err := pool.Exec(ctx, createTableSQL)
	return err
}

// Helper function to create int pointer
func intPtr(i int) *int {
	return &i
}

// Note: These tests require a database connection
// In a real scenario, you'd use testcontainers or a mock database

func TestNewRideDataHistoryRepository(t *testing.T) {
	// Test with mock repository instead of real database
	mockRepo := NewMockRideDataHistoryRepository()

	if mockRepo == nil {
		t.Fatal("Expected mock repository to be created")
	}

	if len(mockRepo.records) != 0 {
		t.Errorf("Expected empty records slice, got %d records", len(mockRepo.records))
	}

	// Test that it implements the expected interface
	ctx := context.Background()
	err := mockRepo.HealthCheck(ctx)
	if err != nil {
		t.Errorf("Health check failed: %v", err)
	}

	err = mockRepo.Close()
	if err != nil {
		t.Errorf("Close failed: %v", err)
	}
}

func TestRideDataHistoryRepository_GetLatestRideDataForAllRides(t *testing.T) {
	mockRepo := NewMockRideDataHistoryRepository()
	ctx := context.Background()

	// Test with empty repository
	records, err := mockRepo.GetLatestRideDataForAllRides(ctx)
	if err != nil {
		t.Fatalf("Failed to get latest ride data: %v", err)
	}

	if len(records) != 0 {
		t.Errorf("Expected 0 records for empty repository, got %d", len(records))
	}

	// Add test data
	baseTime := time.Now()
	testRecords := []*models.RideDataHistoryRecord{
		{
			RideID:      "ride1",
			ExternalID:  "ext1_1", // Different external ID for same ride
			ParkID:      "park1",
			Name:        "Test Ride 1",
			LastUpdated: baseTime.Add(-2 * time.Hour),
		},
		{
			RideID:      "ride1",  // Same ride, newer timestamp
			ExternalID:  "ext1_2", // Different external ID for same ride
			ParkID:      "park1",
			Name:        "Test Ride 1 Updated",
			LastUpdated: baseTime.Add(-1 * time.Hour),
		},
		{
			RideID:      "ride2",
			ExternalID:  "ext2",
			ParkID:      "park1",
			Name:        "Test Ride 2",
			LastUpdated: baseTime,
		},
	}

	_, _, err = mockRepo.InsertRideDataHistoryWithCounts(ctx, testRecords)
	if err != nil {
		t.Fatalf("Failed to insert test records: %v", err)
	}

	// Test getting latest data
	records, err = mockRepo.GetLatestRideDataForAllRides(ctx)
	if err != nil {
		t.Fatalf("Failed to get latest ride data: %v", err)
	}

	if len(records) != 2 {
		t.Errorf("Expected 2 latest records (one per ride), got %d", len(records))
	}

	// Verify we got the latest record for each ride
	ride1Found := false
	ride2Found := false
	for _, record := range records {
		if record.RideID == "ride1" {
			ride1Found = true
			if record.Name != "Test Ride 1 Updated" {
				t.Errorf("Expected latest ride1 name 'Test Ride 1 Updated', got '%s'", record.Name)
			}
		}
		if record.RideID == "ride2" {
			ride2Found = true
			if record.Name != "Test Ride 2" {
				t.Errorf("Expected ride2 name 'Test Ride 2', got '%s'", record.Name)
			}
		}
	}

	if !ride1Found {
		t.Error("Expected to find ride1 in results")
	}
	if !ride2Found {
		t.Error("Expected to find ride2 in results")
	}
}

func TestRideDataHistoryRepository_GetRideDataHistorySince(t *testing.T) {
	mockRepo := NewMockRideDataHistoryRepository()
	ctx := context.Background()

	// Add test data with different timestamps
	baseTime := time.Now()
	testRecords := []*models.RideDataHistoryRecord{
		{
			RideID:      "ride1",
			ExternalID:  "ext1",
			ParkID:      "park1",
			Name:        "Old Ride",
			LastUpdated: baseTime.Add(-48 * time.Hour), // 2 days ago
		},
		{
			RideID:      "ride2",
			ExternalID:  "ext2",
			ParkID:      "park1",
			Name:        "Recent Ride",
			LastUpdated: baseTime.Add(-2 * time.Hour), // 2 hours ago
		},
		{
			RideID:      "ride3",
			ExternalID:  "ext3",
			ParkID:      "park1",
			Name:        "Very Recent Ride",
			LastUpdated: baseTime.Add(-30 * time.Minute), // 30 minutes ago
		},
	}

	_, _, err := mockRepo.InsertRideDataHistoryWithCounts(ctx, testRecords)
	if err != nil {
		t.Fatalf("Failed to insert test records: %v", err)
	}

	// Test getting data since 24 hours ago
	since := baseTime.Add(-24 * time.Hour)
	records, err := mockRepo.GetRideDataHistorySince(ctx, since)
	if err != nil {
		t.Fatalf("Failed to get ride data history: %v", err)
	}

	// Should get 2 records (ride2 and ride3)
	if len(records) != 2 {
		t.Errorf("Expected 2 records since 24 hours ago, got %d", len(records))
	}

	// Verify all returned records are after the since time
	for _, record := range records {
		if record.LastUpdated.Before(since) {
			t.Errorf("Expected LastUpdated to be after %v, got %v", since, record.LastUpdated)
		}
	}

	// Test getting data since 1 hour ago
	since = baseTime.Add(-1 * time.Hour)
	records, err = mockRepo.GetRideDataHistorySince(ctx, since)
	if err != nil {
		t.Fatalf("Failed to get ride data history: %v", err)
	}

	// Should get 1 record (ride3)
	if len(records) != 1 {
		t.Errorf("Expected 1 record since 1 hour ago, got %d", len(records))
	}

	if len(records) > 0 && records[0].RideID != "ride3" {
		t.Errorf("Expected ride3, got %s", records[0].RideID)
	}
}

func TestRideDataHistoryRepository_InsertRideDataHistoryWithCounts(t *testing.T) {
	mockRepo := NewMockRideDataHistoryRepository()
	ctx := context.Background()

	// Test inserting new records
	testRecords := []*models.RideDataHistoryRecord{
		{
			RideID:          "test-ride-123",
			ExternalID:      "external-123",
			ParkID:          "test-park-123",
			EntityType:      "ATTRACTION",
			Name:            "Test Ride",
			Status:          "OPERATING",
			LastUpdated:     time.Now(),
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
			OperatingHours:  "{}",
			StandbyWaitTime: intPtr(30),
			Forecast:        "{}",
		},
		{
			RideID:          "test-ride-456",
			ExternalID:      "external-456",
			ParkID:          "test-park-123",
			EntityType:      "ATTRACTION",
			Name:            "Test Ride 2",
			Status:          "OPERATING",
			LastUpdated:     time.Now(),
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
			OperatingHours:  "{}",
			StandbyWaitTime: intPtr(45),
			Forecast:        "{}",
		},
	}

	inserted, skipped, err := mockRepo.InsertRideDataHistoryWithCounts(ctx, testRecords)
	if err != nil {
		t.Fatalf("Failed to insert ride data: %v", err)
	}

	if inserted != 2 {
		t.Errorf("Expected 2 inserted, got %d", inserted)
	}
	if skipped != 0 {
		t.Errorf("Expected 0 skipped, got %d", skipped)
	}

	// Verify records were added
	allRecords, err := mockRepo.GetAllRideDataHistory(ctx)
	if err != nil {
		t.Fatalf("Failed to get all records: %v", err)
	}

	if len(allRecords) != 2 {
		t.Errorf("Expected 2 records in repository, got %d", len(allRecords))
	}

	// Test inserting duplicate records (same external_id and park_id)
	duplicateRecords := []*models.RideDataHistoryRecord{
		{
			RideID:          "test-ride-789", // Different ride ID
			ExternalID:      "external-123",  // Same external ID
			ParkID:          "test-park-123", // Same park ID
			EntityType:      "ATTRACTION",
			Name:            "Duplicate Test Ride",
			Status:          "OPERATING",
			LastUpdated:     time.Now(),
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
			OperatingHours:  "{}",
			StandbyWaitTime: intPtr(60),
			Forecast:        "{}",
		},
	}

	inserted, skipped, err = mockRepo.InsertRideDataHistoryWithCounts(ctx, duplicateRecords)
	if err != nil {
		t.Fatalf("Failed to insert duplicate ride data: %v", err)
	}

	if inserted != 0 {
		t.Errorf("Expected 0 inserted for duplicate, got %d", inserted)
	}
	if skipped != 1 {
		t.Errorf("Expected 1 skipped for duplicate, got %d", skipped)
	}

	// Verify total count is still 2 (duplicate was skipped)
	allRecords, err = mockRepo.GetAllRideDataHistory(ctx)
	if err != nil {
		t.Fatalf("Failed to get all records: %v", err)
	}

	if len(allRecords) != 2 {
		t.Errorf("Expected still 2 records after duplicate insert, got %d", len(allRecords))
	}
}

// MockRideDataHistoryRepository implements the full repository interface for testing
type MockRideDataHistoryRepository struct {
	records []*models.RideDataHistoryRecord
}

func NewMockRideDataHistoryRepository() *MockRideDataHistoryRepository {
	return &MockRideDataHistoryRepository{
		records: []*models.RideDataHistoryRecord{},
	}
}

func (m *MockRideDataHistoryRepository) InsertRideDataHistoryWithCounts(ctx context.Context, records []*models.RideDataHistoryRecord) (inserted int, skipped int, err error) {
	for _, record := range records {
		// Check if record already exists (simple mock logic)
		exists := false
		for _, existing := range m.records {
			if existing.ExternalID == record.ExternalID && existing.ParkID == record.ParkID {
				exists = true
				break
			}
		}

		if !exists {
			m.records = append(m.records, record)
			inserted++
		} else {
			skipped++
		}
	}
	return inserted, skipped, nil
}

func (m *MockRideDataHistoryRepository) InsertRideDataHistory(ctx context.Context, records []*models.RideDataHistoryRecord) error {
	_, _, err := m.InsertRideDataHistoryWithCounts(ctx, records)
	return err
}

func (m *MockRideDataHistoryRepository) GetLatestRideDataForAllRides(ctx context.Context) ([]*models.RideDataHistoryRecord, error) {
	if len(m.records) == 0 {
		return []*models.RideDataHistoryRecord{}, nil
	}

	// Group by ride and get latest for each
	latestByRide := make(map[string]*models.RideDataHistoryRecord)
	for _, record := range m.records {
		if existing, exists := latestByRide[record.RideID]; !exists || record.LastUpdated.After(existing.LastUpdated) {
			latestByRide[record.RideID] = record
		}
	}

	result := make([]*models.RideDataHistoryRecord, 0, len(latestByRide))
	for _, record := range latestByRide {
		result = append(result, record)
	}

	return result, nil
}

func (m *MockRideDataHistoryRepository) GetRideDataHistorySince(ctx context.Context, since time.Time) ([]*models.RideDataHistoryRecord, error) {
	var filtered []*models.RideDataHistoryRecord
	for _, record := range m.records {
		if record.LastUpdated.After(since) || record.LastUpdated.Equal(since) {
			filtered = append(filtered, record)
		}
	}
	return filtered, nil
}

func (m *MockRideDataHistoryRepository) GetRideDataHistoryByPark(ctx context.Context, parkID string) ([]*models.RideDataHistoryRecord, error) {
	var filtered []*models.RideDataHistoryRecord
	for _, record := range m.records {
		if record.ParkID == parkID {
			filtered = append(filtered, record)
		}
	}
	return filtered, nil
}

func (m *MockRideDataHistoryRepository) GetRideDataHistoryByType(ctx context.Context, entityType string) ([]*models.RideDataHistoryRecord, error) {
	var filtered []*models.RideDataHistoryRecord
	for _, record := range m.records {
		if record.EntityType == entityType {
			filtered = append(filtered, record)
		}
	}
	return filtered, nil
}

func (m *MockRideDataHistoryRepository) GetAllRideDataHistory(ctx context.Context) ([]*models.RideDataHistoryRecord, error) {
	// Return a copy to prevent external modification
	result := make([]*models.RideDataHistoryRecord, len(m.records))
	copy(result, m.records)
	return result, nil
}

func (m *MockRideDataHistoryRepository) HealthCheck(ctx context.Context) error {
	return nil
}

func (m *MockRideDataHistoryRepository) Close() error {
	return nil
}

func TestRideDataHistoryRepository_GetRideDataHistoryByPark(t *testing.T) {
	mockRepo := NewMockRideDataHistoryRepository()
	ctx := context.Background()

	// Add test data for different parks
	testRecords := []*models.RideDataHistoryRecord{
		{
			RideID:      "ride1",
			ExternalID:  "ext1",
			ParkID:      "disneyland",
			Name:        "Space Mountain",
			EntityType:  "ATTRACTION",
			LastUpdated: time.Now(),
		},
		{
			RideID:      "ride2",
			ExternalID:  "ext2",
			ParkID:      "disneyland",
			Name:        "Pirates of the Caribbean",
			EntityType:  "ATTRACTION",
			LastUpdated: time.Now(),
		},
		{
			RideID:      "ride3",
			ExternalID:  "ext3",
			ParkID:      "dca",
			Name:        "Guardians of the Galaxy",
			EntityType:  "ATTRACTION",
			LastUpdated: time.Now(),
		},
	}

	_, _, err := mockRepo.InsertRideDataHistoryWithCounts(ctx, testRecords)
	if err != nil {
		t.Fatalf("Failed to insert test records: %v", err)
	}

	// Test filtering by Disneyland
	disneylandRecords, err := mockRepo.GetRideDataHistoryByPark(ctx, "disneyland")
	if err != nil {
		t.Fatalf("Failed to get Disneyland records: %v", err)
	}

	if len(disneylandRecords) != 2 {
		t.Errorf("Expected 2 Disneyland records, got %d", len(disneylandRecords))
	}

	for _, record := range disneylandRecords {
		if record.ParkID != "disneyland" {
			t.Errorf("Expected park ID 'disneyland', got '%s'", record.ParkID)
		}
	}

	// Test filtering by DCA
	dcaRecords, err := mockRepo.GetRideDataHistoryByPark(ctx, "dca")
	if err != nil {
		t.Fatalf("Failed to get DCA records: %v", err)
	}

	if len(dcaRecords) != 1 {
		t.Errorf("Expected 1 DCA record, got %d", len(dcaRecords))
	}

	if dcaRecords[0].ParkID != "dca" {
		t.Errorf("Expected park ID 'dca', got '%s'", dcaRecords[0].ParkID)
	}

	// Test filtering by non-existent park
	emptyRecords, err := mockRepo.GetRideDataHistoryByPark(ctx, "nonexistent")
	if err != nil {
		t.Fatalf("Failed to get records for non-existent park: %v", err)
	}

	if len(emptyRecords) != 0 {
		t.Errorf("Expected 0 records for non-existent park, got %d", len(emptyRecords))
	}
}

func TestRideDataHistoryRepository_GetRideDataHistoryByType(t *testing.T) {
	mockRepo := NewMockRideDataHistoryRepository()
	ctx := context.Background()

	// Add test data with different entity types
	testRecords := []*models.RideDataHistoryRecord{
		{
			RideID:      "ride1",
			ExternalID:  "ext1",
			ParkID:      "disneyland",
			Name:        "Space Mountain",
			EntityType:  "ATTRACTION",
			LastUpdated: time.Now(),
		},
		{
			RideID:      "ride2",
			ExternalID:  "ext2",
			ParkID:      "disneyland",
			Name:        "Pirates of the Caribbean",
			EntityType:  "ATTRACTION",
			LastUpdated: time.Now(),
		},
		{
			RideID:      "show1",
			ExternalID:  "ext3",
			ParkID:      "disneyland",
			Name:        "Fantasmic",
			EntityType:  "SHOW",
			LastUpdated: time.Now(),
		},
		{
			RideID:      "restaurant1",
			ExternalID:  "ext4",
			ParkID:      "disneyland",
			Name:        "Blue Bayou",
			EntityType:  "RESTAURANT",
			LastUpdated: time.Now(),
		},
	}

	_, _, err := mockRepo.InsertRideDataHistoryWithCounts(ctx, testRecords)
	if err != nil {
		t.Fatalf("Failed to insert test records: %v", err)
	}

	// Test filtering by ATTRACTION
	attractionRecords, err := mockRepo.GetRideDataHistoryByType(ctx, "ATTRACTION")
	if err != nil {
		t.Fatalf("Failed to get ATTRACTION records: %v", err)
	}

	if len(attractionRecords) != 2 {
		t.Errorf("Expected 2 ATTRACTION records, got %d", len(attractionRecords))
	}

	for _, record := range attractionRecords {
		if record.EntityType != "ATTRACTION" {
			t.Errorf("Expected entity type 'ATTRACTION', got '%s'", record.EntityType)
		}
	}

	// Test filtering by SHOW
	showRecords, err := mockRepo.GetRideDataHistoryByType(ctx, "SHOW")
	if err != nil {
		t.Fatalf("Failed to get SHOW records: %v", err)
	}

	if len(showRecords) != 1 {
		t.Errorf("Expected 1 SHOW record, got %d", len(showRecords))
	}

	if showRecords[0].EntityType != "SHOW" {
		t.Errorf("Expected entity type 'SHOW', got '%s'", showRecords[0].EntityType)
	}

	// Test filtering by non-existent type
	emptyRecords, err := mockRepo.GetRideDataHistoryByType(ctx, "NONEXISTENT")
	if err != nil {
		t.Fatalf("Failed to get records for non-existent type: %v", err)
	}

	if len(emptyRecords) != 0 {
		t.Errorf("Expected 0 records for non-existent type, got %d", len(emptyRecords))
	}
}

func TestRideDataHistoryRepository_GetAllRideDataHistory(t *testing.T) {
	mockRepo := NewMockRideDataHistoryRepository()
	ctx := context.Background()

	// Test with empty repository
	records, err := mockRepo.GetAllRideDataHistory(ctx)
	if err != nil {
		t.Fatalf("Failed to get all ride data: %v", err)
	}

	if len(records) != 0 {
		t.Errorf("Expected 0 records for empty repository, got %d", len(records))
	}

	// Add test data
	testRecords := []*models.RideDataHistoryRecord{
		{
			RideID:      "ride1",
			ExternalID:  "ext1",
			ParkID:      "disneyland",
			Name:        "Space Mountain",
			EntityType:  "ATTRACTION",
			LastUpdated: time.Now(),
		},
		{
			RideID:      "ride2",
			ExternalID:  "ext2",
			ParkID:      "dca",
			Name:        "Guardians of the Galaxy",
			EntityType:  "ATTRACTION",
			LastUpdated: time.Now(),
		},
	}

	_, _, err = mockRepo.InsertRideDataHistoryWithCounts(ctx, testRecords)
	if err != nil {
		t.Fatalf("Failed to insert test records: %v", err)
	}

	// Test getting all records
	records, err = mockRepo.GetAllRideDataHistory(ctx)
	if err != nil {
		t.Fatalf("Failed to get all ride data: %v", err)
	}

	if len(records) != 2 {
		t.Errorf("Expected 2 records, got %d", len(records))
	}

	// Verify the records contain expected data
	foundRide1 := false
	foundRide2 := false
	for _, record := range records {
		if record.RideID == "ride1" {
			foundRide1 = true
			if record.Name != "Space Mountain" {
				t.Errorf("Expected ride1 name 'Space Mountain', got '%s'", record.Name)
			}
		}
		if record.RideID == "ride2" {
			foundRide2 = true
			if record.Name != "Guardians of the Galaxy" {
				t.Errorf("Expected ride2 name 'Guardians of the Galaxy', got '%s'", record.Name)
			}
		}
	}

	if !foundRide1 {
		t.Error("Expected to find ride1 in results")
	}
	if !foundRide2 {
		t.Error("Expected to find ride2 in results")
	}
}
