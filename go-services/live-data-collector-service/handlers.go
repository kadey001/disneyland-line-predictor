package main

import (
	"encoding/json"
	"fmt"
	"go-services/shared/repository"
	"go-services/shared/service"
	"net/http"
	"time"
)

// healthHandler handles the /health endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Only GET method is allowed")
		return
	}

	response := HealthResponse{
		Status:  "healthy",
		Service: "live-data-collector",
		Time:    time.Now().UTC().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// collectHandler handles the /collect endpoint for data collection
func collectHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Set CORS headers for browser requests
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Only allow POST requests
	if r.Method != http.MethodPost {
		writeErrorResponse(w, http.StatusMethodNotAllowed, "Only POST method is allowed")
		return
	}

	// Parse request body
	var req LiveDataCollectorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Check if body is empty (EOF) vs malformed JSON
		if err.Error() == "EOF" {
			logger.Debugf("Empty request body received, using default park configuration")
		} else {
			logger.Infof("Failed to parse request body, using defaults: %v", err)
		}
		req.ParkIDs = defaultParkIDs
	}

	// Use defaults if no park IDs provided
	if len(req.ParkIDs) == 0 {
		req.ParkIDs = defaultParkIDs
	}

	// Initialize repository and service
	repo, err := repository.NewRideDataHistoryRepository()
	if err != nil {
		logger.Errorf("Failed to initialize repository: %v", err)
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to initialize database connection")
		return
	}
	defer repo.Close()

	rideDataService := service.NewRideDataHistoryService(repo, logger)

	// Perform health check
	if err := rideDataService.HealthCheck(ctx); err != nil {
		logger.Errorf("Health check failed: %v", err)
		writeErrorResponse(w, http.StatusInternalServerError, "Database health check failed")
		return
	}

	// Process each park
	successCount := 0
	var processedIDs []string
	var lastError error
	totalInserted := 0
	totalSkipped := 0

	for _, parkID := range req.ParkIDs {
		select {
		case <-ctx.Done():
			logger.Infof("Context cancelled, stopping processing")
			goto finish
		default:
			if inserted, skipped, err := rideDataService.FetchAndStoreParkData(ctx, parkID); err != nil {
				logger.Errorf("Failed to process park %s: %v", parkID, err)
				lastError = err
			} else {
				successCount++
				processedIDs = append(processedIDs, parkID)
				totalInserted += inserted
				totalSkipped += skipped
			}
		}
	}

finish:
	// Prepare response
	errorCount := len(req.ParkIDs) - successCount
	response := LiveDataCollectorResponse{
		Success:      errorCount == 0,
		ProcessedIDs: processedIDs,
		ErrorCount:   errorCount,
	}

	if response.Success {
		response.Message = fmt.Sprintf("Successfully processed %d parks (%d records inserted, %d skipped)",
			successCount, totalInserted, totalSkipped)
	} else {
		response.Message = fmt.Sprintf("Processed %d/%d parks with %d errors", successCount, len(req.ParkIDs), errorCount)
		if lastError != nil {
			response.Message += fmt.Sprintf(". Last error: %v", lastError)
		}
	}

	// Write response
	w.Header().Set("Content-Type", "application/json")
	if response.Success {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusPartialContent)
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Errorf("Failed to encode response: %v", err)
	}

	logger.Infof("Collection completed: %s", response.Message)
}

// rootHandler handles the root endpoint for basic service info
func rootHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := map[string]interface{}{
		"service":   "live-data-collector",
		"version":   "1.0.0",
		"endpoints": []string{"/health", "/collect"},
		"status":    "running",
	}
	json.NewEncoder(w).Encode(response)
}

// writeErrorResponse writes an error response to the client
func writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := LiveDataCollectorResponse{
		Success: false,
		Message: message,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Errorf("Failed to encode error response: %v", err)
	}
}
