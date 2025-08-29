package shared

// ParkInfo represents park information
type ParkInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ParkNames maps park IDs to park information
var ParkNames = map[string]ParkInfo{
	"7340550b-c14d-4def-80bb-acdb51d49a66": {ID: "7340550b-c14d-4def-80bb-acdb51d49a66", Name: "Disneyland Park"},
	"832fcd51-ea19-4e77-85c7-75d5843b127c": {ID: "832fcd51-ea19-4e77-85c7-75d5843b127c", Name: "Disney California Adventure Park"},
}

// FilteredRide represents a ride in our filtered list
type FilteredRide struct {
	Name string `json:"name"`
	ID   string `json:"id"`
}

// FilteredAttractions maps park IDs to their important rides
var FilteredAttractions = map[string][]FilteredRide{
	"7340550b-c14d-4def-80bb-acdb51d49a66": { // Disneyland UUID
		{Name: "Big Thunder Mountain Railroad", ID: "0de1413a-73ee-46cf-af2e-c491cc7c7d3b"},
		{Name: "Haunted Mansion Holiday", ID: "ff52cb64-c1d5-4feb-9d43-5dbd429bac81"},
		{Name: "Indiana Jones™ Adventure", ID: "2aedc657-1ee2-4545-a1ce-14753f28cc66"},
		{Name: "Jungle Cruise", ID: "1b83fda8-d60e-48e4-9a3d-90ddcbcd1001"},
		{Name: "Matterhorn Bobsleds", ID: "faaa8be9-cc1e-4535-ac20-04a535654bd0"},
		{Name: "Mickey & Minnie's Runaway Railway", ID: "cd670bff-81d1-4f34-8676-7bafdf49220a"},
		{Name: "Millennium Falcon: Smugglers Run", ID: "b2c2549c-e9da-4fdd-98ea-1dcff596fed7"},
		{Name: "Pirates of the Caribbean", ID: "82aeb29b-504a-416f-b13f-f41fa5b766aa"},
		{Name: "Space Mountain", ID: "9167db1d-e5e7-46da-a07f-ae30a87bc4c4"},
		{Name: "Star Wars: Rise of the Resistance", ID: "34b1d70f-11c4-42df-935e-d5582c9f1a8e"},
		{Name: "Tiana's Bayou Adventure", ID: "a9076acd-7630-4bad-a8da-e6bd689ddcac"},
	},
	"832fcd51-ea19-4e77-85c7-75d5843b127c": { // California Adventure UUID
		{Name: "Guardians of the Galaxy - Mission: BREAKOUT!", ID: "b7678dab-5544-48d5-8fdc-c1a0127cfbcd"},
		{Name: "Gristle River Run", ID: "b1d285a7-2444-4a7c-b7bb-d2d4d6428a85"},
		{Name: "Incredicoaster", ID: "5d07a2b1-49ca-4de7-9d32-6d08edf69b08"},
		{Name: "Monsters, Inc. Mike & Sulley to the Rescue!", ID: "40524fba-5d84-49e7-9204-f493dbe2d5a4"},
		{Name: "Radiator Springs Racers", ID: "c60c768b-3461-465c-8f4f-b44b087506fc"},
		{Name: "WEB SLINGERS: A Spider-Man Adventure", ID: "2295351d-ce6b-4c04-92d5-5b416372c5b5"},
	},
}

// IsRideFiltered checks if a ride should be included based on our filtered list
func IsRideFiltered(parkID, rideID string) bool {
	rides, exists := FilteredAttractions[parkID]
	if !exists {
		return false // Park not in our filtered list
	}

	for _, ride := range rides {
		if ride.ID == rideID {
			return true // Ride is in our filtered list
		}
	}
	return false // Ride not in our filtered list
}

// GetFilteredRidesForPark returns all filtered rides for a specific park
func GetFilteredRidesForPark(parkID string) []FilteredRide {
	rides, exists := FilteredAttractions[parkID]
	if !exists {
		return []FilteredRide{}
	}
	return rides
}

// GetParkInfo returns park information for a given park ID
func GetParkInfo(parkID string) (ParkInfo, bool) {
	parkInfo, exists := ParkNames[parkID]
	return parkInfo, exists
}

// GetAllParkInfos returns all park information
func GetAllParkInfos() map[string]ParkInfo {
	return ParkNames
}
