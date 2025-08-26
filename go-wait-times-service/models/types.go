package models

import (
	"encoding/json"
	"time"
)

// Ride represents a Disney ride with wait time information (Legacy)
type Ride struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	IsOpen      bool   `json:"is_open"`
	WaitTime    int64  `json:"wait_time"`
	LastUpdated string `json:"last_updated"`
}

// QueueTimeData represents the API response from queue-times.com (Legacy)
type QueueTimeData struct {
	Lands []Land `json:"lands"`
}

// Land represents a themed land in the park (Legacy)
type Land struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Rides []Ride `json:"rides"`
}

// RideWaitTimeSnapshot represents a database record for historical wait times (Legacy)
type RideWaitTimeSnapshot struct {
	ID           int       `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
	RideID       int64     `json:"rideId" gorm:"column:ride_id"`
	RideName     string    `json:"rideName" gorm:"column:ride_name"`
	IsOpen       bool      `json:"isOpen" gorm:"column:is_open"`
	WaitTime     int64     `json:"waitTime" gorm:"column:wait_time"`
	SnapshotTime time.Time `json:"snapshotTime" gorm:"column:snapshot_time"`
}

// TableName specifies the table name for GORM (Legacy)
func (RideWaitTimeSnapshot) TableName() string {
	return "ride_wait_time_snapshots"
}

// RideWaitTimeEntry represents a processed wait time entry (Legacy)
type RideWaitTimeEntry struct {
	RideID       int64     `json:"rideId"`
	RideName     string    `json:"rideName"`
	WaitTime     int64     `json:"waitTime"`
	SnapshotTime time.Time `json:"snapshotTime"`
}

// --- NEW THEMEPARKS.WIKI API TYPES ---

// RideType represents the type of ride/entity
type RideType string

const (
	RideTypeAttraction RideType = "ATTRACTION"
	RideTypeShow       RideType = "SHOW"
	RideTypeRestaurant RideType = "RESTAURANT"
)

// RideStatus represents the operational status of a ride
type RideStatus string

const (
	RideStatusOperating RideStatus = "OPERATING"
	RideStatusClosed    RideStatus = "CLOSED"
)

// OperatingHours represents the operating hours for a ride
type OperatingHours struct {
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
}

// QueueInfo represents queue information for a ride
type QueueInfo struct {
	Standby struct {
		WaitTime int `json:"waitTime"`
	} `json:"STANDBY"`
	ReturnTime *struct {
		State       string     `json:"state"`
		ReturnStart time.Time  `json:"returnStart"`
		ReturnEnd   *time.Time `json:"returnEnd"`
	} `json:"RETURN_TIME,omitempty"`
}

// ForecastEntry represents a single forecast data point
type ForecastEntry struct {
	Percentage float64   `json:"percentage"`
	WaitTime   int       `json:"waitTime"`
	Time       time.Time `json:"time"`
}

// LiveRideDataEntry represents a single ride's data from the API
type LiveRideDataEntry struct {
	ID              string            `json:"id"`
	ParkID          string            `json:"parkId"`
	ExternalID      string            `json:"externalId"`
	EntityType      RideType          `json:"entityType"`
	Name            string            `json:"name"`
	Status          RideStatus        `json:"status"`
	LastUpdated     time.Time         `json:"lastUpdated"`
	OperatingHours  []OperatingHours  `json:"operatingHours,omitempty"`
	Queue           *QueueInfo        `json:"queue,omitempty"`
	Forecast        []ForecastEntry   `json:"forecast,omitempty"`
}

// LiveRideData represents the array of ride data entries
type LiveRideData []LiveRideDataEntry

// ParkData represents the complete park data response from the API
type ParkData struct {
	ID         string       `json:"id"`
	EntityType string       `json:"entityType"`
	Name       string       `json:"name"`
	Timezone   string       `json:"timezone"`
	LiveData   LiveRideData `json:"liveData"`
}

// RideDataHistoryRecord represents the database record for ride data history
type RideDataHistoryRecord struct {
	ID              string     `json:"id" gorm:"primaryKey;column:id"`
	ExternalID      string     `json:"externalId" gorm:"column:external_id"`
	ParkID          string     `json:"parkId" gorm:"column:park_id"`
	EntityType      string     `json:"entityType" gorm:"column:entity_type"`
	Name            string     `json:"name" gorm:"column:name"`
	Status          string     `json:"status" gorm:"column:status"`
	LastUpdated     time.Time  `json:"lastUpdated" gorm:"column:last_updated"`
	CreatedAt       time.Time  `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt       time.Time  `json:"updatedAt" gorm:"column:updated_at"`
	OperatingHours  string     `json:"operatingHours" gorm:"column:operating_hours;type:jsonb"`
	StandbyWaitTime *int       `json:"standbyWaitTime" gorm:"column:standby_wait_time"`
	ReturnTimeState *string    `json:"returnTimeState" gorm:"column:return_time_state"`
	ReturnStart     *time.Time `json:"returnStart" gorm:"column:return_start"`
	ReturnEnd       *time.Time `json:"returnEnd" gorm:"column:return_end"`
	Forecast        string     `json:"forecast" gorm:"column:forecast;type:jsonb"`
}

// TableName specifies the table name for GORM
func (RideDataHistoryRecord) TableName() string {
	return "ride_data_history"
}

// ToRideDataHistoryRecord converts a LiveRideDataEntry to a database record
func (entry *LiveRideDataEntry) ToRideDataHistoryRecord() (*RideDataHistoryRecord, error) {
	record := &RideDataHistoryRecord{
		ID:          entry.ID,
		ExternalID:  entry.ExternalID,
		ParkID:      entry.ParkID,
		EntityType:  string(entry.EntityType),
		Name:        entry.Name,
		Status:      string(entry.Status),
		LastUpdated: entry.LastUpdated,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Handle operating hours - ensure it's always an array
	if len(entry.OperatingHours) > 0 {
		hoursJSON, err := json.Marshal(entry.OperatingHours)
		if err != nil {
			return nil, err
		}
		record.OperatingHours = string(hoursJSON)
	} else {
		// Set empty array instead of null
		record.OperatingHours = "[]"
	}

	// Handle queue information
	if entry.Queue != nil {
		record.StandbyWaitTime = &entry.Queue.Standby.WaitTime
		if entry.Queue.ReturnTime != nil {
			record.ReturnTimeState = &entry.Queue.ReturnTime.State
			record.ReturnStart = &entry.Queue.ReturnTime.ReturnStart
			record.ReturnEnd = entry.Queue.ReturnTime.ReturnEnd
		}
	}

	// Handle forecast - ensure it's always an array
	if len(entry.Forecast) > 0 {
		forecastJSON, err := json.Marshal(entry.Forecast)
		if err != nil {
			return nil, err
		}
		record.Forecast = string(forecastJSON)
	} else {
		// Set empty array instead of null
		record.Forecast = "[]"
	}

	return record, nil
}

// ImportantRide represents a ride configuration
type ImportantRide struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

// RideWaitTimeTrend represents a trend calculation between two time points
type RideWaitTimeTrend struct {
	Trend     int       `json:"trend"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
}

// RideWaitTimeTrends represents a collection of trend calculations
type RideWaitTimeTrends []RideWaitTimeTrend

// RideWaitTimeTrendMap represents trends mapped by ride ID
type RideWaitTimeTrendMap map[int64]RideWaitTimeTrends

// WaitTimesResponse represents the complete response from the service
type WaitTimesResponse struct {
	AllRides          []Ride                 `json:"all_rides"`
	FilteredRides     []Ride                 `json:"filtered_rides"`
	SortedRides       []Ride                 `json:"sorted_rides"`
	FlatRidesHistory  []RideWaitTimeEntry    `json:"flat_rides_history"`
	SortedRideHistory []RideWaitTimeEntry    `json:"sorted_ride_history"`
}
