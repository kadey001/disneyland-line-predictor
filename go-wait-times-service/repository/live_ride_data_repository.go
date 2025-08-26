package repository

import (
	"context"
	"disneyland-wait-times/models"
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// LiveRideDataRepository handles database operations for live ride data
type LiveRideDataRepository struct {
	db *gorm.DB
}

// NewLiveRideDataRepository creates a new repository instance
func NewLiveRideDataRepository() (*LiveRideDataRepository, error) {
	// Get database URL from environment variable
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.New(
			log.New(log.Writer(), "\r\n", log.LstdFlags),
			logger.Config{
				SlowThreshold: time.Second,
				LogLevel:      logger.Silent,
				Colorful:      false,
			},
		),
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "",
			SingularTable: false,
		},
		PrepareStmt: false, // Disable prepared statements for Supabase compatibility
		// Add Supabase-specific configurations
		DisableForeignKeyConstraintWhenMigrating: true,
		// Disable nested transactions since Supabase uses transaction pooling
		SkipDefaultTransaction: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool for Supabase
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %v", err)
	}

	// Supabase-optimized connection pool settings
	sqlDB.SetMaxOpenConns(10)                  // Limit concurrent connections
	sqlDB.SetMaxIdleConns(2)                   // Keep fewer idle connections
	sqlDB.SetConnMaxLifetime(5 * time.Minute)  // Shorter connection lifetime
	sqlDB.SetConnMaxIdleTime(30 * time.Second) // Close idle connections quickly

	// Auto-migrate the schema
	if err := db.AutoMigrate(&models.RideDataHistoryRecord{}); err != nil {
		return nil, fmt.Errorf("failed to migrate schema: %w", err)
	}

	return &LiveRideDataRepository{db: db}, nil
}

// UpsertLiveRideData inserts or updates live ride data records
func (r *LiveRideDataRepository) UpsertLiveRideData(ctx context.Context, records []*models.RideDataHistoryRecord) error {
	if len(records) == 0 {
		return nil
	}

	// Use transaction for better performance and consistency
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, record := range records {
			// Update the timestamp
			record.UpdatedAt = time.Now()
			
			// Upsert the record
			result := tx.Where("external_id = ? AND park_id = ?", record.ExternalID, record.ParkID).
				Assign(record).
				FirstOrCreate(record)
			
			if result.Error != nil {
				return fmt.Errorf("failed to upsert record for ride %s: %w", record.Name, result.Error)
			}
		}
		return nil
	})
}

// GetLiveRideDataByPark retrieves all live ride data for a specific park
func (r *LiveRideDataRepository) GetLiveRideDataByPark(ctx context.Context, parkID string) ([]*models.RideDataHistoryRecord, error) {
	var records []*models.RideDataHistoryRecord
	
	result := r.db.WithContext(ctx).
		Where("park_id = ?", parkID).
		Order("name ASC").
		Find(&records)
	
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get live ride data for park %s: %w", parkID, result.Error)
	}
	
	return records, nil
}

// GetLiveRideDataByType retrieves all live ride data for a specific entity type
func (r *LiveRideDataRepository) GetLiveRideDataByType(ctx context.Context, entityType string) ([]*models.RideDataHistoryRecord, error) {
	var records []*models.RideDataHistoryRecord
	
	result := r.db.WithContext(ctx).
		Where("entity_type = ?", entityType).
		Order("park_id ASC, name ASC").
		Find(&records)
	
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get live ride data for type %s: %w", entityType, result.Error)
	}
	
	return records, nil
}

// GetAllLiveRideData retrieves all live ride data
func (r *LiveRideDataRepository) GetAllLiveRideData(ctx context.Context) ([]*models.RideDataHistoryRecord, error) {
	var records []*models.RideDataHistoryRecord
	
	result := r.db.WithContext(ctx).
		Order("park_id ASC, entity_type ASC, name ASC").
		Find(&records)
	
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get all live ride data: %w", result.Error)
	}
	
	return records, nil
}

// CleanupOldData removes data older than the specified duration
func (r *LiveRideDataRepository) CleanupOldData(ctx context.Context, olderThan time.Duration) error {
	cutoffTime := time.Now().Add(-olderThan)
	
	result := r.db.WithContext(ctx).
		Where("updated_at < ?", cutoffTime).
		Delete(&models.RideDataHistoryRecord{})
	
	if result.Error != nil {
		return fmt.Errorf("failed to cleanup old data: %w", result.Error)
	}
	
	log.Printf("Cleaned up %d old live ride data records", result.RowsAffected)
	return nil
}

// Close closes the database connection
func (r *LiveRideDataRepository) Close() error {
	sqlDB, err := r.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// HealthCheck verifies the database connection
func (r *LiveRideDataRepository) HealthCheck(ctx context.Context) error {
	sqlDB, err := r.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}
	
	if err := sqlDB.PingContext(ctx); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}
	
	return nil
}
