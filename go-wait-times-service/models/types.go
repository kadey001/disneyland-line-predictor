package models

import (
	"time"
)

// Ride represents a Disney ride with wait time information
type Ride struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	IsOpen      bool   `json:"is_open"`
	WaitTime    int    `json:"wait_time"`
	LastUpdated string `json:"last_updated"`
}

// QueueTimeData represents the API response from queue-times.com
type QueueTimeData struct {
	Lands []Land `json:"lands"`
}

// Land represents a themed land in the park
type Land struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Rides []Ride `json:"rides"`
}

// RideWaitTimeSnapshot represents a database record for historical wait times
type RideWaitTimeSnapshot struct {
	ID           int       `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
	RideID       int       `json:"rideId" gorm:"column:ride_id"`
	RideName     string    `json:"rideName" gorm:"column:ride_name"`
	IsOpen       bool      `json:"isOpen" gorm:"column:is_open"`
	WaitTime     int       `json:"waitTime" gorm:"column:wait_time"`
	SnapshotTime time.Time `json:"snapshotTime" gorm:"column:snapshot_time"`
}

// TableName specifies the table name for GORM
func (RideWaitTimeSnapshot) TableName() string {
	return "ride_wait_time_snapshots"
}

// RideWaitTimeEntry represents a processed wait time entry
type RideWaitTimeEntry struct {
	RideID       int       `json:"rideId"`
	RideName     string    `json:"rideName"`
	WaitTime     int       `json:"waitTime"`
	SnapshotTime time.Time `json:"snapshotTime"`
}

// ImportantRide represents a ride configuration
type ImportantRide struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// WaitTimesResponse represents the complete response from the service
type WaitTimesResponse struct {
	AllRides          []Ride                 `json:"all_rides"`
	FilteredRides     []Ride                 `json:"filtered_rides"`
	SortedRides       []Ride                 `json:"sorted_rides"`
	FlatRidesHistory  []RideWaitTimeEntry    `json:"flat_rides_history"`
	SortedRideHistory []RideWaitTimeEntry    `json:"sorted_ride_history"`
}
