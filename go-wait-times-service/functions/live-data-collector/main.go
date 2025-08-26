package main

import (
	"disneyland-wait-times/repository"
	"disneyland-wait-times/service"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
)

// LiveDataCollectorRequest represents the request payload for the function
type LiveDataCollectorRequest struct {
	ParkIDs          []string `json:"parkIds"`
	CleanupOlderThan string   `json:"cleanupOlderThan,omitempty"` // e.g., "24h", "7d"
}

// LiveDataCollectorResponse represents the response from the function
type LiveDataCollectorResponse struct {
	Success      bool     `json:"success"`
	Message      string   `json:"message"`
	ProcessedIDs []string `json:"processedIds,omitempty"`
	ErrorCount   int      `json:"errorCount,omitempty"`
}

// Default park IDs for Disney parks (you can customize these)
var defaultParkIDs = []string{
	"7340550b-c14d-4def-80bb-acdb51d49a66", // Disneyland
	"832fcd51-ea19-4e77-85c7-75d5843b127c", // Disney California Adventure
}

func init() {
	functions.HTTP("LiveDataCollector", liveDataCollector)
}

// liveDataCollector is the main Cloud Function entry point
func liveDataCollector(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Set CORS headers for browser requests
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
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
		// If parsing fails, use default configuration
		log.Printf("Failed to parse request body, using defaults: %v", err)
		req.ParkIDs = defaultParkIDs
		req.CleanupOlderThan = "24h"
	}

	// Use defaults if no park IDs provided
	if len(req.ParkIDs) == 0 {
		req.ParkIDs = defaultParkIDs
	}

	// Use default cleanup period if not specified
	if req.CleanupOlderThan == "" {
		req.CleanupOlderThan = "24h"
	}

	// Initialize repository and service
	repo, err := repository.NewRideDataHistoryRepository()
	if err != nil {
		log.Printf("Failed to initialize repository: %v", err)
		writeErrorResponse(w, http.StatusInternalServerError, "Failed to initialize database connection")
		return
	}
	defer repo.Close()

	rideDataService := service.NewRideDataHistoryService(repo)

	// Perform health check
	if err := rideDataService.HealthCheck(ctx); err != nil {
		log.Printf("Health check failed: %v", err)
		writeErrorResponse(w, http.StatusInternalServerError, "Database health check failed")
		return
	}

	// Parse cleanup duration
	cleanupDuration, err := time.ParseDuration(req.CleanupOlderThan)
	if err != nil {
		log.Printf("Invalid cleanup duration: %v", err)
		cleanupDuration = 24 * time.Hour // Default to 24 hours
	}

	// Process each park
	successCount := 0
	var processedIDs []string
	var lastError error

	for _, parkID := range req.ParkIDs {
		select {
		case <-ctx.Done():
			log.Printf("Context cancelled, stopping processing")
			break
		default:
			if err := rideDataService.FetchAndStoreParkData(ctx, parkID); err != nil {
				log.Printf("Failed to process park %s: %v", parkID, err)
				lastError = err
			} else {
				successCount++
				processedIDs = append(processedIDs, parkID)
			}
		}
	}

	// Cleanup old data
	if err := rideDataService.CleanupOldData(ctx, cleanupDuration); err != nil {
		log.Printf("Failed to cleanup old data: %v", err)
	}

	// Prepare response
	errorCount := len(req.ParkIDs) - successCount
	response := LiveDataCollectorResponse{
		Success:      errorCount == 0,
		ProcessedIDs: processedIDs,
		ErrorCount:   errorCount,
	}

	if response.Success {
		response.Message = fmt.Sprintf("Successfully processed %d parks", successCount)
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
		log.Printf("Failed to encode response: %v", err)
	}

	log.Printf("Function completed: %s", response.Message)
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
		log.Printf("Failed to encode error response: %v", err)
	}
}

// For local testing - this won't be used in Cloud Functions
func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Live Data Collector function starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
