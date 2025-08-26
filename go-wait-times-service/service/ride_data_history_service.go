package service

import (
	"context"
	"disneyland-wait-times/models"
	"disneyland-wait-times/repository"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// RideDataHistoryService handles fetching and processing ride data history
type RideDataHistoryService struct {
	repo   *repository.RideDataHistoryRepository
	client *http.Client
}

// NewRideDataHistoryService creates a new service instance
func NewRideDataHistoryService(repo *repository.RideDataHistoryRepository) *RideDataHistoryService {
	return &RideDataHistoryService{
		repo: repo,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// FetchAndStoreParkData fetches ride data for a park and stores it in the database
func (s *RideDataHistoryService) FetchAndStoreParkData(ctx context.Context, parkID string) error {
	log.Printf("Fetching ride data for park: %s", parkID)

	// Fetch data from the API
	parkData, err := s.fetchParkData(ctx, parkID)
	if err != nil {
		return fmt.Errorf("failed to fetch park data: %w", err)
	}

	if len(parkData.LiveData) == 0 {
		log.Printf("No ride data available for park %s", parkID)
		return nil
	}

	// Convert to database records
	records := make([]*models.RideDataHistoryRecord, 0, len(parkData.LiveData))
	for _, entry := range parkData.LiveData {
		record, err := entry.ToRideDataHistoryRecord()
		if err != nil {
			log.Printf("Failed to convert entry %s to record: %v", entry.Name, err)
			continue
		}
		records = append(records, record)
	}

	// Store in database
	if err := s.repo.UpsertRideDataHistory(ctx, records); err != nil {
		return fmt.Errorf("failed to store ride data history: %w", err)
	}

	log.Printf("Successfully stored %d ride data history records for park %s", len(records), parkID)
	return nil
}

// fetchParkData makes an API call to fetch park data
func (s *RideDataHistoryService) fetchParkData(ctx context.Context, parkID string) (*models.ParkData, error) {
	url := fmt.Sprintf("https://api.themeparks.wiki/v1/entity/%s/live", parkID)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers for better API compatibility
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "DisnelyandLinePredictor/1.0")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make API request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var parkData models.ParkData
	if err := json.NewDecoder(resp.Body).Decode(&parkData); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &parkData, nil
}

// FetchAndStoreMultipleParks fetches and stores data for multiple parks
func (s *RideDataHistoryService) FetchAndStoreMultipleParks(ctx context.Context, parkIDs []string) error {
	errors := make([]error, 0)

	for _, parkID := range parkIDs {
		if err := s.FetchAndStoreParkData(ctx, parkID); err != nil {
			log.Printf("Failed to process park %s: %v", parkID, err)
			errors = append(errors, fmt.Errorf("park %s: %w", parkID, err))
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("encountered %d errors while processing parks", len(errors))
	}

	return nil
}

// CleanupOldData removes old data from the database
func (s *RideDataHistoryService) CleanupOldData(ctx context.Context, olderThan time.Duration) error {
	return s.repo.CleanupOldData(ctx, olderThan)
}

// GetRideDataHistoryByPark retrieves ride data for a specific park
func (s *RideDataHistoryService) GetRideDataHistoryByPark(ctx context.Context, parkID string) ([]*models.RideDataHistoryRecord, error) {
	return s.repo.GetRideDataHistoryByPark(ctx, parkID)
}

// GetRideDataHistoryByType retrieves ride data for a specific entity type
func (s *RideDataHistoryService) GetRideDataHistoryByType(ctx context.Context, entityType string) ([]*models.RideDataHistoryRecord, error) {
	return s.repo.GetRideDataHistoryByType(ctx, entityType)
}

// GetAllRideDataHistory retrieves all ride data
func (s *RideDataHistoryService) GetAllRideDataHistory(ctx context.Context) ([]*models.RideDataHistoryRecord, error) {
	return s.repo.GetAllRideDataHistory(ctx)
}

// HealthCheck performs a health check on the service
func (s *RideDataHistoryService) HealthCheck(ctx context.Context) error {
	return s.repo.HealthCheck(ctx)
}
