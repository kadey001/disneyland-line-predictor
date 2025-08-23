package main

import (
	"disneyland-wait-times/repository"
	"disneyland-wait-times/service"
	"encoding/json"
	"log"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize repository
	repo, err := repository.NewPostgresRideWaitTimeRepository()
	if err != nil {
		log.Fatalf("Failed to initialize repository: %v", err)
	}

	// Initialize service
	waitTimesService := service.NewWaitTimesService(repo)

	// Set up HTTP handlers
	http.HandleFunc("/wait-times", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		log.Println("Processing wait times request...")

		result, err := waitTimesService.GetWaitTimes(false)
		if err != nil {
			log.Printf("Failed to get wait times: %v", err)
			http.Error(w, "Failed to get wait times", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		err = json.NewEncoder(w).Encode(result)
		if err != nil {
			log.Printf("Failed to encode response: %v", err)
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}

		log.Printf("Successfully processed %d rides, returned %d filtered rides", 
			len(result.AllRides), len(result.FilteredRides))
	})

	// Collection endpoint for scheduled jobs
	http.HandleFunc("/collect", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		log.Println("Starting wait times collection process...")

		result, err := waitTimesService.GetWaitTimes(true) // Save data to database
		if err != nil {
			log.Printf("Failed to collect wait times: %v", err)
			http.Error(w, "Failed to collect wait times", http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"message": "Successfully collected wait times data",
			"total_rides": len(result.AllRides),
			"filtered_rides": len(result.FilteredRides),
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)

		log.Printf("Successfully collected wait times for %d rides", len(result.AllRides))
	})

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	})

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
