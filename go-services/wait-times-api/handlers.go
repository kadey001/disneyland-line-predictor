package main

import (
	"context"
	"encoding/json"
	"go-services/shared"
	"go-services/shared/repository"
	"go-services/shared/response"
	"log"
	"net/http"
	"sort"
	"time"
)

// waitTimesHandler handles the /wait-times endpoint
func waitTimesHandler(repo *repository.RideDataHistoryRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Always set CORS headers so preflight works from browsers
		origin := r.Header.Get("Origin")
		if AllowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Enforce POST for actual requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Determine optional ride_id — prefer query param, fallback to JSON body
		rideID := r.URL.Query().Get("ride_id")
		if rideID == "" {
			// try JSON body (it's optional; ignore EOF / empty body)
			var body struct {
				RideID string `json:"ride_id"`
			}
			if err := json.NewDecoder(r.Body).Decode(&body); err == nil {
				rideID = body.RideID
			}
		}

		log.Printf("Processing wait times request (ride_id=%s)", rideID)

		// Query for latest entries for all rides (always unfiltered)
		ctx, cancel := context.WithTimeout(context.Background(), RequestTimeout)
		defer cancel()

		latestRideData, err := repo.GetLatestRideDataForAllRides(ctx)
		if err != nil {
			log.Printf("Failed to get latest ride data: %v", err)
			http.Error(w, "Failed to retrieve ride data", http.StatusInternalServerError)
			return
		}

		log.Printf("Retrieved %d latest ride data records for all rides", len(latestRideData))

		// Query the ride_data_history table for data within the configured window
		since := time.Now().Add(-DataHours)
		ctx2, cancel2 := context.WithTimeout(context.Background(), RequestTimeout)
		defer cancel2()

		rideDataHistory, err := repo.GetRideDataHistorySince(ctx2, since)
		if err != nil {
			log.Printf("Failed to get ride data history: %v", err)
			http.Error(w, "Failed to retrieve ride data", http.StatusInternalServerError)
			return
		}

		log.Printf("Retrieved %d ride data history records from the past window", len(rideDataHistory))

		// Process filtered records to build history
		groupedRidesHistory := make(map[string][]RideHistoryEntry)

		for _, record := range rideDataHistory {
			// Only process records for rides that are in our filtered list
			if shared.IsRideFiltered(record.ParkID, record.RideID) {
				// Convert to flat history format
				waitTime := int64(0)

				if record.StandbyWaitTime != nil {
					waitTime = int64(*record.StandbyWaitTime)
				}

				historyEntry := RideHistoryEntry{
					WaitTime:     waitTime,
					SnapshotTime: record.LastUpdated,
				}
				groupedRidesHistory[record.RideID] = append(groupedRidesHistory[record.RideID], historyEntry)
			}
		}

		// Sort each ride's history by SnapshotTime descending (latest first)
		for _, history := range groupedRidesHistory {
			sort.Slice(history, func(i, j int) bool {
				return history[i].SnapshotTime.After(history[j].SnapshotTime)
			})
		}

		// Build liveWaitTime list from the latest entries for filtered rides only
		var liveWaitTime []LiveWaitTimeEntry
		for _, record := range latestRideData {
			// Only include rides that are in our filtered list
			if shared.IsRideFiltered(record.ParkID, record.RideID) {
				liveEntry := LiveWaitTimeEntry{
					RideID:      record.RideID,
					RideName:    record.Name,
					WaitTime:    record.StandbyWaitTime,
					Status:      record.Status,
					LastUpdated: record.LastUpdated,
				}
				liveWaitTime = append(liveWaitTime, liveEntry)
			}
		}

		// Build attraction atlas from latest ride data (filtered rides only, grouped by park)
		attractionAtlas := make([]ParkAtlasEntry, 0)
		parkRidesMap := make(map[string][]AttractionAtlasEntry)

		// Group rides by park
		for _, record := range latestRideData {
			// Only include rides that are in our filtered list
			if shared.IsRideFiltered(record.ParkID, record.RideID) {
				entry := AttractionAtlasEntry{
					RideID:   record.RideID,
					RideName: record.Name,
				}
				parkRidesMap[record.ParkID] = append(parkRidesMap[record.ParkID], entry)
			}
		}

		// Build park entries with park names
		for parkID, rides := range parkRidesMap {
			if parkInfo, exists := shared.ParkNames[parkID]; exists {
				parkEntry := ParkAtlasEntry{
					ParkID:   parkInfo.ID,
					ParkName: parkInfo.Name,
					Rides:    rides,
				}
				attractionAtlas = append(attractionAtlas, parkEntry)
			}
		}

		// If ride_id provided, filter the history data only
		if rideID != "" {
			if history, exists := groupedRidesHistory[rideID]; exists {
				groupedRidesHistory = map[string][]RideHistoryEntry{rideID: history}
			} else {
				groupedRidesHistory = make(map[string][]RideHistoryEntry)
			}
		}

		// Create the response structure
		waitTimesResponse := WaitTimesResponse{
			LiveWaitTime:        liveWaitTime,
			AttractionAtlas:     attractionAtlas,
			GroupedRidesHistory: groupedRidesHistory,
		}

		// Use shared response utility to handle JSON encoding, caching, and compression
		if err := response.WriteJSONWithDefaults(w, r, waitTimesResponse); err != nil {
			log.Printf("Failed to write response: %v", err)
			response.WriteError(w, http.StatusInternalServerError, "Failed to encode response")
			return
		}

		// Calculate total history entries for logging
		totalHistory := 0
		for _, history := range groupedRidesHistory {
			totalHistory += len(history)
		}
		log.Printf("Successfully processed wait times request (live=%d, history=%d)", len(liveWaitTime), totalHistory)
	}
}

// healthHandler handles the /health endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
	healthResponse := HealthResponse{
		Status:  "healthy",
		Service: ServiceName,
	}

	if err := response.WriteJSONWithDefaults(w, r, healthResponse); err != nil {
		log.Printf("Failed to write health response: %v", err)
		response.WriteError(w, http.StatusInternalServerError, "Failed to encode health response")
	}
}

// rootHandler handles the root endpoint for basic service info
func rootHandler(w http.ResponseWriter, r *http.Request) {
	serviceInfo := ServiceInfo{
		Service:   ServiceName,
		Version:   ServiceVersion,
		Endpoints: []string{"/health", "/wait-times"},
		Status:    "running",
	}

	if err := response.WriteJSONWithDefaults(w, r, serviceInfo); err != nil {
		log.Printf("Failed to write root response: %v", err)
		response.WriteError(w, http.StatusInternalServerError, "Failed to encode service info")
	}
}
