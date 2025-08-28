package db

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Config holds database configuration options
type Config struct {
	DatabaseURL     string
	MaxConns        int32
	MinConns        int32
	MaxConnLifetime time.Duration
	MaxConnIdleTime time.Duration
}

// DefaultConfig returns a default configuration optimized for Supabase
func DefaultConfig() *Config {
	return &Config{
		MaxConns:        10,               // Reasonable default for most applications
		MinConns:        2,                // Keep some connections warm
		MaxConnLifetime: 30 * time.Minute, // Longer lifetime for better performance
		MaxConnIdleTime: 5 * time.Minute,  // Keep connections alive longer
	}
}

// SupabaseConfig returns a configuration optimized for Supabase with stricter limits
func SupabaseConfig() *Config {
	return &Config{
		MaxConns:        5,                // More conservative for Supabase
		MinConns:        1,                // Keep at least one connection
		MaxConnLifetime: 10 * time.Minute, // Shorter lifetime for Supabase
		MaxConnIdleTime: 2 * time.Minute,  // Close idle connections faster
	}
}

// NewConnection creates a new pgx connection pool with the given configuration
func NewConnection(ctx context.Context, config *Config) (*pgxpool.Pool, error) {
	// Get database URL from environment if not provided in config
	databaseURL := config.DatabaseURL
	if databaseURL == "" {
		databaseURL = os.Getenv("DATABASE_URL")
		if databaseURL == "" {
			return nil, fmt.Errorf("DATABASE_URL environment variable is required")
		}
	}

	// Parse the database URL
	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	// Apply custom configuration
	poolConfig.MaxConns = config.MaxConns
	poolConfig.MinConns = config.MinConns
	poolConfig.MaxConnLifetime = config.MaxConnLifetime
	poolConfig.MaxConnIdleTime = config.MaxConnIdleTime

	// Create the connection pool
	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test the connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

// NewDefaultConnection creates a new connection with default configuration
func NewDefaultConnection(ctx context.Context) (*pgxpool.Pool, error) {
	return NewConnection(ctx, DefaultConfig())
}

// NewSupabaseConnection creates a new connection optimized for Supabase
func NewSupabaseConnection(ctx context.Context) (*pgxpool.Pool, error) {
	return NewConnection(ctx, SupabaseConfig())
}

// HealthCheck verifies that the database connection is healthy
func HealthCheck(ctx context.Context, pool *pgxpool.Pool) error {
	if pool == nil {
		return fmt.Errorf("connection pool is nil")
	}

	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	return nil
}
