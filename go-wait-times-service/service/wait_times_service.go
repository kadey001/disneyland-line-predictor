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

// GetWaitTimesWithTrends fetches wait times from the API and includes trend calculations
func (s *WaitTimesService) GetWaitTimesWithTrends(saveData bool) (*models.WaitTimesResponse, models.RideWaitTimeTrendMap, error) {
	// Get the standard wait times response
	response, err := s.GetWaitTimes(saveData)
	if err != nil {
		return nil, nil, err
	}

	// Calculate trends for all rides in the history
	trendMap := s.CalculateTrendsForAllRides(response.FlatRidesHistory)

	return response, trendMap, nil
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

// Fetches ride data, formats it, and stores it in the database
func (s *WaitTimesService) CollectAndStoreWaitTimes() error {
	queueTimesData, err := s.fetchQueueTimesData()
	if err != nil {
		return fmt.Errorf("failed to fetch queue times data: %v", err)
	}

	// Extract all rides from all lands
	allRides := s.extractAllRides(queueTimesData)

	err = s.repo.SaveList(allRides)
	if err != nil {
		return fmt.Errorf("failed to save rides to database: %v", err)
	}
	
	return nil
}

// FetchQueueTimesData is a public wrapper for fetchQueueTimesData
func (s *WaitTimesService) FetchQueueTimesData() (*models.QueueTimeData, error) {
	return s.fetchQueueTimesData()
}

// ExtractAllRides is a public wrapper for extractAllRides
func (s *WaitTimesService) ExtractAllRides(data *models.QueueTimeData) []models.Ride {
	return s.extractAllRides(data)
}

// CalculateWaitTimeTrends calculates trends between consecutive entries in the history
func (s *WaitTimesService) CalculateWaitTimeTrends(history []models.RideWaitTimeEntry) models.RideWaitTimeTrends {
	start := time.Now()
	
	if len(history) < 2 {
		return models.RideWaitTimeTrends{}
	}

	// Filter out times after midnight and before park opening
	var filteredHistory []models.RideWaitTimeEntry
	for _, ride := range history {
		rideHour := ride.SnapshotTime.Hour()
		// Park hours are 8 AM to 12 AM (midnight)
		if rideHour >= 8 && rideHour < 24 {
			filteredHistory = append(filteredHistory, ride)
		}
	}

	// Calculate trends between consecutive entries
	var trends models.RideWaitTimeTrends
	for i := 1; i < len(filteredHistory); i++ {
		prev := filteredHistory[i-1]
		curr := filteredHistory[i]
		
		trend := models.RideWaitTimeTrend{
			Trend:     curr.WaitTime - prev.WaitTime,
			StartTime: prev.SnapshotTime,
			EndTime:   curr.SnapshotTime,
		}
		trends = append(trends, trend)
	}

	duration := time.Since(start)
	fmt.Printf("CalculateWaitTimeTrends took %v\n", duration)
	
	return trends
}

// CalculateTrend calculates the trend for a specific ride from the complete wait time history
func (s *WaitTimesService) CalculateTrend(waitTimeHistory []models.RideWaitTimeEntry, rideID int) (models.RideWaitTimeTrends, error) {
	if rideID == 0 {
		return models.RideWaitTimeTrends{}, fmt.Errorf("rideID cannot be zero")
	}

	// Filter history for the specific ride
	var rideHistory []models.RideWaitTimeEntry
	for _, history := range waitTimeHistory {
		if history.RideID == rideID {
			rideHistory = append(rideHistory, history)
		}
	}

	// Calculate the trend based on the ride's wait time history
	trends := s.CalculateWaitTimeTrends(rideHistory)

	// TODO: Cache the trends so later we can just append to it rather than having to calculate it all over again

	return trends, nil
}

// CalculateTrendsForAllRides calculates trends for all rides and returns a map of rideID to trends
func (s *WaitTimesService) CalculateTrendsForAllRides(waitTimeHistory []models.RideWaitTimeEntry) models.RideWaitTimeTrendMap {
	trendMap := make(models.RideWaitTimeTrendMap)
	
	// Group history by ride ID
	rideHistoryMap := make(map[int][]models.RideWaitTimeEntry)
	for _, entry := range waitTimeHistory {
		rideHistoryMap[entry.RideID] = append(rideHistoryMap[entry.RideID], entry)
	}
	
	// Calculate trends for each ride
	for rideID, history := range rideHistoryMap {
		trends := s.CalculateWaitTimeTrends(history)
		trendMap[rideID] = trends
	}
	
	return trendMap
}

// GetHistoryOfWaitTimes allows for a single rideId to be passed or a list of them
func (s *WaitTimesService) GetHistoryOfWaitTimes(rideID int, rideIDs []int) ([]models.RideWaitTimeEntry, error) {
	if len(rideIDs) > 0 {
		var allHistory []models.RideWaitTimeEntry
		for _, id := range rideIDs {
			history, err := s.repo.GetHistory(id)
			if err != nil {
				return nil, fmt.Errorf("failed to get history for ride %d: %v", id, err)
			}
			
			// Convert snapshots to entries
			for _, snapshot := range history {
				entry := models.RideWaitTimeEntry{
					RideID:       snapshot.RideID,
					RideName:     snapshot.RideName,
					WaitTime:     snapshot.WaitTime,
					SnapshotTime: snapshot.SnapshotTime,
				}
				allHistory = append(allHistory, entry)
			}
		}
		return allHistory, nil
	}

	if rideID == 0 {
		return nil, fmt.Errorf("either rideID or rideIDs must be provided")
	}

	history, err := s.repo.GetHistory(rideID)
	if err != nil {
		return nil, fmt.Errorf("failed to get history for ride %d: %v", rideID, err)
	}
	
	var entries []models.RideWaitTimeEntry
	for _, snapshot := range history {
		entry := models.RideWaitTimeEntry{
			RideID:       snapshot.RideID,
			RideName:     snapshot.RideName,
			WaitTime:     snapshot.WaitTime,
			SnapshotTime: snapshot.SnapshotTime,
		}
		entries = append(entries, entry)
	}
	
	return entries, nil
}