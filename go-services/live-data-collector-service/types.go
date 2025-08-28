package main

// Default park IDs for Disney parks (you can customize these)
var defaultParkIDs = []string{
	"7340550b-c14d-4def-80bb-acdb51d49a66", // Disneyland
	"832fcd51-ea19-4e77-85c7-75d5843b127c", // Disney California Adventure
}

// LiveDataCollectorRequest represents the request payload for the function
type LiveDataCollectorRequest struct {
	ParkIDs []string `json:"parkIds"`
}

// LiveDataCollectorResponse represents the response from the function
type LiveDataCollectorResponse struct {
	Success      bool     `json:"success"`
	Message      string   `json:"message"`
	ProcessedIDs []string `json:"processedIds,omitempty"`
	ErrorCount   int      `json:"errorCount,omitempty"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Time    string `json:"time"`
}
