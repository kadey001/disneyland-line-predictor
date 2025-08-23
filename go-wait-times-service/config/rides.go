package config

import "disneyland-wait-times/models"

// IMPORTANT_DISNEYLAND_RIDES contains the list of rides considered most important
var IMPORTANT_DISNEYLAND_RIDES = []models.ImportantRide{
	{ID: 284, Name: "Space Mountain"},
	{ID: 323, Name: "Big Thunder Mountain Railroad"},
	{ID: 14168, Name: "Tiana's Bayou Adventure"},
	{ID: 326, Name: "Indiana Jones™ Adventure"},
	{ID: 296, Name: "Jungle Cruise"},
	{ID: 11526, Name: "Mickey & Minnie's Runaway Railway"},
	{ID: 273, Name: "Buzz Lightyear Astro Blasters"},
	{ID: 6340, Name: "Star Wars: Rise of the Resistance"},
	{ID: 6339, Name: "Millennium Falcon: Smugglers Run"},
	{ID: 289, Name: "Pirates of the Caribbean"},
	{ID: 13958, Name: "Haunted Mansion"},
}

// IsImportantRide checks if a ride ID is in the important rides list
func IsImportantRide(rideID int) bool {
	for _, ride := range IMPORTANT_DISNEYLAND_RIDES {
		if ride.ID == rideID {
			return true
		}
	}
	return false
}
