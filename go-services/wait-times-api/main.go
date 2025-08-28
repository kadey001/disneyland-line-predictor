package main

import (
	"go-services/shared/repository"
	"go-services/shared/service"
	"net/http"
	"os"
	"os/signal"
	"syscall"
)

var logger service.Logger

func main() {
	// initialize default logger implementation
	logger = service.NewDefaultLogger()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize repository
	repo, err := repository.NewRideDataHistoryRepository()
	if err != nil {
		logger.Fatalf("Failed to initialize repository: %v", err)
	}
	defer repo.Close()

	// Set up HTTP handlers
	http.HandleFunc("/wait-times", waitTimesHandler(repo))
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/", rootHandler)

	logger.Infof("Wait Times API server starting on port %s", port)

	// Set up graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan

		logger.Infof("Shutdown signal received...")
		os.Exit(0)
	}()

	logger.Fatal(http.ListenAndServe(":"+port, nil))
}
