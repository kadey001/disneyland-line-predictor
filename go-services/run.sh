#!/bin/bash

# Run script for Go services
# Usage: ./run.sh <service-name>
# Example: ./run.sh live-data-collector-service

# Check if service name was provided
if [ $# -eq 0 ]; then
    echo "Error: Please provide a service name"
    echo "Usage: ./run.sh <service-name>"
    echo "Example: ./run.sh live-data-collector-service"
    exit 1
fi

# Set environment to development
export ENV=development

echo "Starting $1 in development mode..."
echo "ENV=$ENV"

# Run the Go service
go run ./$1
