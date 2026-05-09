package db

import (
	"context"
	"testing"
	"time"
)

func TestDefaultConfig(t *testing.T) {
	config := DefaultConfig()

	if config.MaxConns != 10 {
		t.Errorf("Expected MaxConns to be 10, got %d", config.MaxConns)
	}

	if config.MinConns != 2 {
		t.Errorf("Expected MinConns to be 2, got %d", config.MinConns)
	}

	if config.MaxConnLifetime != 30*time.Minute {
		t.Errorf("Expected MaxConnLifetime to be 30m, got %v", config.MaxConnLifetime)
	}
}

func TestCloudSQLConfig(t *testing.T) {
	config := CloudSQLConfig()

	if config.MaxConns != 10 {
		t.Errorf("Expected MaxConns to be 10, got %d", config.MaxConns)
	}

	if config.MinConns != 1 {
		t.Errorf("Expected MinConns to be 1, got %d", config.MinConns)
	}

	if config.MaxConnLifetime != 30*time.Minute {
		t.Errorf("Expected MaxConnLifetime to be 30m, got %v", config.MaxConnLifetime)
	}
}

func TestHealthCheckWithNilPool(t *testing.T) {
	ctx := context.Background()
	err := HealthCheck(ctx, nil)

	if err == nil {
		t.Error("Expected error for nil pool, got nil")
	}

	if err.Error() != "connection pool is nil" {
		t.Errorf("Expected 'connection pool is nil' error, got %v", err)
	}
}
