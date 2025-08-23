package repository

import (
	"disneyland-wait-times/models"
	"fmt"
	"net/url"
	"os"
	"strings"
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

// convertPrismaAccelerateURL converts a Prisma Accelerate URL to a standard PostgreSQL URL
func convertPrismaAccelerateURL(prismaURL string) (string, error) {
	// If it's not a Prisma Accelerate URL, return as-is
	if !strings.HasPrefix(prismaURL, "prisma+postgres://") {
		return prismaURL, nil
	}

	// Check if there's a fallback URL for Go services
	goDbURL := os.Getenv("GO_DATABASE_URL")
	if goDbURL != "" {
		fmt.Println("Using GO_DATABASE_URL for Go service connection")
		return goDbURL, nil
	}

	// If no fallback, try to construct from Prisma Accelerate URL
	// Parse the Prisma Accelerate URL
	u, err := url.Parse(prismaURL)
	if err != nil {
		return "", fmt.Errorf("failed to parse Prisma URL: %v", err)
	}

	// Extract the API key from the query parameters
	apiKey := u.Query().Get("api_key")
	if apiKey == "" {
		return "", fmt.Errorf("no api_key found in Prisma Accelerate URL")
	}

	// For Prisma Accelerate connections, we need the underlying database connection
	// Since Prisma Accelerate is a proxy, we need the actual database credentials
	// This should be provided via GO_DATABASE_URL environment variable
	return "", fmt.Errorf("Prisma Accelerate URL detected but no GO_DATABASE_URL provided. Please set GO_DATABASE_URL to your underlying PostgreSQL connection string")
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

	// Convert Prisma Accelerate URL to standard PostgreSQL URL if needed
	convertedURL, err := convertPrismaAccelerateURL(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to convert database URL: %v", err)
	}

	// Debug: Print the first 50 characters of the converted database URL
	convertedLen := len(convertedURL)
	if convertedLen > 50 {
		convertedLen = 50
	}
	fmt.Printf("Converted DATABASE_URL (first %d chars): %s...\n", convertedLen, convertedURL[:convertedLen])

	db, err := gorm.Open(postgres.Open(convertedURL), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			TablePrefix: "",
			SingularTable: false,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// Auto-migrate the schema
	err = db.AutoMigrate(&models.RideWaitTimeSnapshot{})
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database schema: %v", err)
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

	for _, ride := range rides {
		lastUpdated, err := time.Parse(time.RFC3339, ride.LastUpdated)
		if err != nil {
			lastUpdated = time.Now()
		}

		// Only update if the last updated time is within the last five minutes and we have not already recorded it
		if lastUpdated.After(fiveMinutesAgo) {
			// Check if we have a record in the database over the last 5 mins
			var recent models.RideWaitTimeSnapshot
			err := r.db.Where("ride_id = ? AND snapshot_time >= ?", ride.ID, fiveMinutesAgo).
				Order("snapshot_time DESC").
				First(&recent).Error

			if err == gorm.ErrRecordNotFound {
				// No recent snapshot found, add to save list
				toSave = append(toSave, models.RideWaitTimeSnapshot{
					RideID:       ride.ID,
					RideName:     ride.Name,
					IsOpen:       ride.IsOpen,
					WaitTime:     ride.WaitTime,
					SnapshotTime: lastUpdated,
				})
			}
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
