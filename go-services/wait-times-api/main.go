package main

import (
	"context"
	"fmt"
	"go-services/shared/repository"
	"go-services/shared/service"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"
)

var logger service.Logger

func main() {
	// Load environment variables from .env file only in development
	env := os.Getenv("ENV")
	if env == "" || strings.ToLower(env) == "development" {
		if err := godotenv.Load("../.env"); err != nil {
			// Use fmt.Println since logger isn't initialized yet
			fmt.Printf("Warning: No .env file found: %v\n", err)
		}
		fmt.Printf("Loaded environment variables from .env file\n")
	}

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

	// Create HTTP server
	server := &http.Server{
		Addr:    ":" + port,
		Handler: nil, // Uses DefaultServeMux
	}

	// Set up graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	
	go func() {
		<-sigChan
		logger.Infof("Shutdown signal received, initiating graceful shutdown...")
		
		// Create a context with a timeout for the shutdown process
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		
		if err := server.Shutdown(ctx); err != nil {
			logger.Errorf("HTTP server shutdown error: %v", err)
		}
	}()

	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		logger.Fatal(err)
	}
	logger.Infof("Server stopped properly")
}
