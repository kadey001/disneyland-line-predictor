#!/usr/bin/env bash
set -euo pipefail

# Move to function root
cd "$(dirname "$0")/.."

echo "Tidying modules..."
go mod tidy

mkdir -p bin

echo "Building live-data-collector..."
go build -o bin/live-data-collector main.go

echo "Built: $(pwd)/bin/live-data-collector"
