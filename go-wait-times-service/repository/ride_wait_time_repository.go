package repository

import (
	"context"
	"disneyland-wait-times/models"
	"fmt"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

// RideWaitTimeRepository interface defines the contract for ride wait time data operations
type RideWaitTimeRepository interface {
	Save(snapshot models.Ride) error
	SaveList(snapshots []models.Ride) error
	GetHistory(rideID int) ([]models.RideWaitTimeSnapshot, error)
}

// PostgresRideWaitTimeRepository implements RideWaitTimeRepository using PostgreSQL
type PostgresRideWaitTimeRepository struct {
	db *gorm.DB
}

// NewPostgresRideWaitTimeRepository creates a new instance of PostgresRideWaitTimeRepository
func NewPostgresRideWaitTimeRepository() (*PostgresRideWaitTimeRepository, error) {
	// Get database URL from environment variable
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	// Debug: Print the first 50 characters of the original database URL
	urlLen := len(databaseURL)
	if urlLen > 50 {
		urlLen = 50
	}
	fmt.Printf("Original DATABASE_URL (first %d chars): %s...\n", urlLen, databaseURL[:urlLen])

	// Debug: Print the first 50 characters of the converted database URL
	convertedLen := len(databaseURL)
	if convertedLen > 50 {
		convertedLen = 50
	}
	fmt.Printf("Converted DATABASE_URL (first %d chars): %s...\n", convertedLen, databaseURL[:convertedLen])

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "",
			SingularTable: false,
		},
		PrepareStmt: false, // Disable prepared statements for pgbouncer compatibility
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	return &PostgresRideWaitTimeRepository{db: db}, nil
}

// Save saves a single ride snapshot if no recent snapshot exists
func (r *PostgresRideWaitTimeRepository) Save(snapshot models.Ride) error {
	tenMinutesAgo := time.Now().Add(-10 * time.Minute)
	
	var recent models.RideWaitTimeSnapshot
	err := r.db.Where("ride_id = ? AND snapshot_time >= ?", snapshot.ID, tenMinutesAgo).
		Order("snapshot_time DESC").
		First(&recent).Error

	if err == gorm.ErrRecordNotFound {
		// No recent snapshot found, create a new one
		lastUpdated, err := time.Parse(time.RFC3339, snapshot.LastUpdated)
		if err != nil {
			lastUpdated = time.Now()
		}

		newSnapshot := models.RideWaitTimeSnapshot{
			RideID:       snapshot.ID,
			RideName:     snapshot.Name,
			IsOpen:       snapshot.IsOpen,
			WaitTime:     snapshot.WaitTime,
			SnapshotTime: lastUpdated,
		}

		return r.db.Create(&newSnapshot).Error
	}

	return err // Return any other errors, or nil if recent snapshot exists
}

// SaveList saves multiple ride snapshots efficiently
func (r *PostgresRideWaitTimeRepository) SaveList(rides []models.Ride) error {
	fiveMinutesAgo := time.Now().Add(-5 * time.Minute)
	var toSave []models.RideWaitTimeSnapshot
	
	// Collect all ride IDs for batch query
	rideIDs := make([]int, 0, len(rides))
	rideMap := make(map[int]models.Ride)
	
	for _, ride := range rides {
		lastUpdated, err := time.Parse(time.RFC3339, ride.LastUpdated)
		if err != nil {
			lastUpdated = time.Now()
		}
		
		// Only consider rides updated within the last 5 minutes
		if lastUpdated.After(fiveMinutesAgo) {
			rideIDs = append(rideIDs, ride.ID)
			rideMap[ride.ID] = ride
		}
	}
	
	if len(rideIDs) == 0 {
		return nil
	}
	
	// Batch query to find recent snapshots for all rides
	var recentSnapshots []models.RideWaitTimeSnapshot
	err := r.db.Where("ride_id IN ? AND snapshot_time >= ?", rideIDs, fiveMinutesAgo).
		Select("ride_id, MAX(snapshot_time) as snapshot_time").
		Group("ride_id").
		Find(&recentSnapshots).Error
	
	if err != nil {
		return fmt.Errorf("failed to query recent snapshots: %v", err)
	}
	
	// Create a set of ride IDs that have recent snapshots
	hasRecentSnapshot := make(map[int]bool)
	for _, snapshot := range recentSnapshots {
		hasRecentSnapshot[snapshot.RideID] = true
	}
	
	// Add rides without recent snapshots to save list
	for _, rideID := range rideIDs {
		if !hasRecentSnapshot[rideID] {
			ride := rideMap[rideID]
			lastUpdated, _ := time.Parse(time.RFC3339, ride.LastUpdated)
			if lastUpdated.IsZero() {
				lastUpdated = time.Now()
			}
			
			toSave = append(toSave, models.RideWaitTimeSnapshot{
				RideID:       ride.ID,
				RideName:     ride.Name,
				IsOpen:       ride.IsOpen,
				WaitTime:     ride.WaitTime,
				SnapshotTime: lastUpdated,
			})
		}
	}
	
	if len(toSave) > 0 {
		fmt.Printf("Saving %d ride wait time snapshots\n", len(toSave))
		return r.db.CreateInBatches(toSave, 100).Error
	}
	
	return nil
}

// GetHistory retrieves historical wait time data for a specific ride
func (r *PostgresRideWaitTimeRepository) GetHistory(rideID int) ([]models.RideWaitTimeSnapshot, error) {
	past24Hours := time.Now().Add(-24 * time.Hour)
	
	var records []models.RideWaitTimeSnapshot
	err := r.db.Where("ride_id = ? AND snapshot_time >= ?", rideID, past24Hours).
		Order("snapshot_time ASC").
		Find(&records).Error

	return records, err
}

// Close closes the database connection
func (r *PostgresRideWaitTimeRepository) Close() error {
	sqlDB, err := r.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// StartDataCollectionWithContext starts the automated data collection process with graceful shutdown
func (r *PostgresRideWaitTimeRepository) StartDataCollectionWithContext(ctx context.Context, fetchRideDataFunc func() ([]models.Ride, error)) {
	ticker := time.NewTicker(2 * time.Minute)
	
	go func() {
		defer ticker.Stop()
		
		// Run immediately on start
		r.collectWithRetry(fetchRideDataFunc)
		
		// Then run on schedule
		for {
			select {
			case <-ctx.Done():
				fmt.Println("Data collection stopped gracefully")
				return
			case <-ticker.C:
				r.collectWithRetry(fetchRideDataFunc)
			}
		}
	}()
}

// collectWithRetry handles data collection with retry logic
func (r *PostgresRideWaitTimeRepository) collectWithRetry(fetchRideDataFunc func() ([]models.Ride, error)) {
	maxRetries := 3
	
	for attempt := 1; attempt <= maxRetries; attempt++ {
		rides, err := fetchRideDataFunc()
		if err != nil {
			fmt.Printf("Attempt %d: Failed to fetch ride data: %v\n", attempt, err)
			if attempt < maxRetries {
				time.Sleep(30 * time.Second)
				continue
			}
			fmt.Printf("Failed to fetch ride data after %d attempts\n", maxRetries)
			return
		}
		
		err = r.SaveList(rides)
		if err != nil {
			fmt.Printf("Attempt %d: Failed to save ride data: %v\n", attempt, err)
			if attempt < maxRetries {
				time.Sleep(30 * time.Second)
				continue
			}
			fmt.Printf("Failed to save ride data after %d attempts\n", maxRetries)
			return
		}
		
		fmt.Printf("Successfully collected and saved ride data\n")
		return
	}
}
