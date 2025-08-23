package main

import (
	"context"
	"disneyland-wait-times/repository"
	"disneyland-wait-times/service"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
	"github.com/cloudevents/sdk-go/v2/event"
)

// WaitTimesResponse represents the response structure
type WaitTimesResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func init() {
	functions.CloudEvent("WaitTimesCollector", waitTimesCollector)
	functions.HTTP("WaitTimesHTTP", waitTimesHTTP)
}

// waitTimesCollector handles Cloud Scheduler triggered events
func waitTimesCollector(ctx context.Context, e event.Event) error {
	log.Println("Starting wait times collection process...")

	// Initialize repository
	repo, err := repository.NewPostgresRideWaitTimeRepository()
	if err != nil {
		log.Printf("Failed to initialize repository: %v", err)
		return fmt.Errorf("failed to initialize repository: %v", err)
	}

	// Initialize service
	waitTimesService := service.NewWaitTimesService(repo)

	// Get wait times
	result, err := waitTimesService.GetWaitTimes(true)
	if err != nil {
		log.Printf("Failed to get wait times: %v", err)
		return fmt.Errorf("failed to get wait times: %v", err)
	}

	log.Printf("Successfully processed wait times for %d rides", len(result.FilteredRides))
	return nil
}

// waitTimesHTTP handles HTTP requests (for testing/manual triggering)
func waitTimesHTTP(w http.ResponseWriter, r *http.Request) {
	log.Println("Starting wait times collection process via HTTP...")

	// Initialize repository
	repo, err := repository.NewPostgresRideWaitTimeRepository()
	if err != nil {
		log.Printf("Failed to initialize repository: %v", err)
		writeErrorResponse(w, "Failed to initialize repository", err)
		return
	}

	// Initialize service
	waitTimesService := service.NewWaitTimesService(repo)

	// Get wait times
	result, err := waitTimesService.GetWaitTimes(false)
	if err != nil {
		log.Printf("Failed to get wait times: %v", err)
		writeErrorResponse(w, "Failed to get wait times", err)
		return
	}

	response := WaitTimesResponse{
		Message: fmt.Sprintf("Successfully processed wait times for %d rides", len(result.FilteredRides)),
		Data:    result,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func writeErrorResponse(w http.ResponseWriter, message string, err error) {
	response := WaitTimesResponse{
		Message: message,
		Error:   err.Error(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(response)
}

func main() {
	// Use PORT environment variable, or default to 8080
	port := "8080"
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	log.Printf("Starting server on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
