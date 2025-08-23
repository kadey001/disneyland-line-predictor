package service

import (
	"disneyland-wait-times/config"
	"disneyland-wait-times/models"
	"disneyland-wait-times/repository"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"
)

// WaitTimesService handles the business logic for wait times
type WaitTimesService struct {
	repo repository.RideWaitTimeRepository
}

// NewWaitTimesService creates a new instance of WaitTimesService
func NewWaitTimesService(repo repository.RideWaitTimeRepository) *WaitTimesService {
	return &WaitTimesService{
		repo: repo,
	}
}

// GetWaitTimes fetches wait times from the API and processes them
func (s *WaitTimesService) GetWaitTimes(saveData bool) (*models.WaitTimesResponse, error) {
	// Fetch data from queue-times.com API
	queueTimesData, err := s.fetchQueueTimesData()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch queue times data: %v", err)
	}

	// Extract all rides from all lands
	allRides := s.extractAllRides(queueTimesData)

	// Filter important rides
	filteredRides := s.filterImportantRides(allRides)

	// Sort rides by wait time (lowest first)
	sortedRides := s.sortRidesByWaitTime(filteredRides)

	// Save all rides to database if saveData is true
	if saveData {
		err = s.repo.SaveList(allRides)
		if err != nil {
			return nil, fmt.Errorf("failed to save rides to database: %v", err)
		}
	}

	// Get history for sorted rides
	flatRidesHistory, err := s.getRidesHistory(sortedRides)
	if err != nil {
		return nil, fmt.Errorf("failed to get rides history: %v", err)
	}

	// Sort ride history by snapshot time
	sortedRideHistory := s.sortRideHistoryByTime(flatRidesHistory)

	return &models.WaitTimesResponse{
		AllRides:          allRides,
		FilteredRides:     filteredRides,
		SortedRides:       sortedRides,
		FlatRidesHistory:  flatRidesHistory,
		SortedRideHistory: sortedRideHistory,
	}, nil
}

// fetchQueueTimesData fetches data from the queue-times.com API
func (s *WaitTimesService) fetchQueueTimesData() (*models.QueueTimeData, error) {
	url := "https://queue-times.com/parks/16/queue_times.json"
	
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to make HTTP request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP request failed with status code: %d", resp.StatusCode)
	}

	var queueTimesData models.QueueTimeData
	err = json.NewDecoder(resp.Body).Decode(&queueTimesData)
	if err != nil {
		return nil, fmt.Errorf("failed to decode JSON response: %v", err)
	}

	return &queueTimesData, nil
}

// extractAllRides extracts all rides from all lands
func (s *WaitTimesService) extractAllRides(data *models.QueueTimeData) []models.Ride {
	var allRides []models.Ride
	for _, land := range data.Lands {
		allRides = append(allRides, land.Rides...)
	}
	return allRides
}

// filterImportantRides filters rides based on the important rides list
func (s *WaitTimesService) filterImportantRides(allRides []models.Ride) []models.Ride {
	var filteredRides []models.Ride
	for _, ride := range allRides {
		if config.IsImportantRide(ride.ID) {
			filteredRides = append(filteredRides, ride)
		}
	}
	return filteredRides
}

// sortRidesByWaitTime sorts rides by wait time (lowest first)
func (s *WaitTimesService) sortRidesByWaitTime(rides []models.Ride) []models.Ride {
	sortedRides := make([]models.Ride, len(rides))
	copy(sortedRides, rides)
	
	sort.Slice(sortedRides, func(i, j int) bool {
		return sortedRides[i].WaitTime < sortedRides[j].WaitTime
	})
	
	return sortedRides
}

// getRidesHistory gets historical data for all provided rides
func (s *WaitTimesService) getRidesHistory(rides []models.Ride) ([]models.RideWaitTimeEntry, error) {
	var flatRidesHistory []models.RideWaitTimeEntry

	for _, ride := range rides {
		history, err := s.repo.GetHistory(ride.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get history for ride %d: %v", ride.ID, err)
		}

		for _, snapshot := range history {
			entry := models.RideWaitTimeEntry{
				RideID:       snapshot.RideID,
				RideName:     snapshot.RideName,
				WaitTime:     snapshot.WaitTime,
				SnapshotTime: snapshot.SnapshotTime,
			}
			flatRidesHistory = append(flatRidesHistory, entry)
		}
	}

	return flatRidesHistory, nil
}

// sortRideHistoryByTime sorts ride history by snapshot time
func (s *WaitTimesService) sortRideHistoryByTime(history []models.RideWaitTimeEntry) []models.RideWaitTimeEntry {
	sortedHistory := make([]models.RideWaitTimeEntry, len(history))
	copy(sortedHistory, history)
	
	sort.Slice(sortedHistory, func(i, j int) bool {
		return sortedHistory[i].SnapshotTime.Before(sortedHistory[j].SnapshotTime)
	})
	
	return sortedHistory
}
