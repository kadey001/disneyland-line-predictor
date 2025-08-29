package main

import "time"

// AllowedOrigins contains the list of allowed origins for CORS
var AllowedOrigins = map[string]bool{
	"https://disneyland-line-predictor.vercel.app": true, // Production Vercel URL
	"http://localhost:3000":                        true, // Local development
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

// ServiceInfo represents the service information response
type ServiceInfo struct {
	Service   string   `json:"service"`
	Version   string   `json:"version"`
	Endpoints []string `json:"endpoints"`
	Status    string   `json:"status"`
}

// Constants for the service
const (
	ServiceName    = "wait-times-api"
	ServiceVersion = "1.0.0"
	DataHours      = 24 * time.Hour
	RequestTimeout = 30 * time.Second
)

// LiveWaitTimeEntry represents the most recent wait time for a ride
type LiveWaitTimeEntry struct {
	RideID      string    `json:"rideId"`
	RideName    string    `json:"rideName"`
	WaitTime    *int      `json:"waitTime"`
	Status      string    `json:"status"`
	LastUpdated time.Time `json:"lastUpdated"`
}

// RideHistoryEntry represents a historical wait time entry for a ride
type RideHistoryEntry struct {
	WaitTime     int64     `json:"waitTime"`
	SnapshotTime time.Time `json:"snapshotTime"`
}

// AttractionAtlasEntry represents a ride entry in the attraction atlas
type AttractionAtlasEntry struct {
	RideID   string `json:"rideId"`
	RideName string `json:"rideName"`
}

// ParkAtlasEntry represents a park entry in the attraction atlas
type ParkAtlasEntry struct {
	ParkID   string                 `json:"parkId"`
	ParkName string                 `json:"parkName"`
	Rides    []AttractionAtlasEntry `json:"rides"`
}

// WaitTimesResponse represents the response structure with live and historical data
type WaitTimesResponse struct {
	LiveWaitTime        []LiveWaitTimeEntry           `json:"liveWaitTime"`
	AttractionAtlas     []ParkAtlasEntry              `json:"attractionAtlas"`
	GroupedRidesHistory map[string][]RideHistoryEntry `json:"groupedRidesHistory"`
}
