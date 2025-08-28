package main

import (
	"fmt"
	"go-services/shared/service"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/joho/godotenv"
)

var logger service.Logger

// Main function to start the HTTP server
func main() {
	// Load environment variables from .env file only in development
	env := os.Getenv("ENV")
	if env == "" || strings.ToLower(env) == "development" {
		if err := godotenv.Load("../.env"); err != nil {
			// Use fmt.Println since logger isn't initialized yet
			fmt.Printf("Warning: No .env file found: %v\n", err)
		}
	}

	// initialize default logger implementation
	logger = service.NewDefaultLogger()

	// Determine port for HTTP server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Register HTTP handlers
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/collect", collectHandler)
	http.HandleFunc("/", rootHandler)

	// Start HTTP server
	logger.Infof("Starting HTTP server on port %s", port)
	logger.Infof("Available endpoints: /health, /collect")

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
