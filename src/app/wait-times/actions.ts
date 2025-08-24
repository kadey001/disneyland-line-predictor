import type { Ride, RideWaitTimeHistory } from "@/lib/types";
import { config } from "@/lib/config";

type ExpectedWaitTimeData = {
    all_rides: Ride[];
    filtered_rides: Ride[];
    sorted_rides: Ride[];
    flat_rides_history: RideWaitTimeHistory;
    sorted_ride_history: RideWaitTimeHistory;
}

export const getWaitTimes = async () => {
    const data = await fetch(config.WAIT_TIMES_API_URL + "/wait-times", {
        next: {
            revalidate: 25 // Cache for 25 seconds
        }
    });
    const { all_rides: allRides,
        filtered_rides: filteredRides,
        sorted_rides: sortedRides,
        flat_rides_history: flatRidesHistory,
        sorted_ride_history: sortedRideHistory
    } = await data.json() as ExpectedWaitTimeData;

    // Filter out history to be only todays park data from open until closing
    const today = new Date();
    const openingTime = new Date(today);
    openingTime.setHours(8, 0, 0); // Set opening time to 8:00 AM

    const filteredSortedRideHistory = sortedRideHistory.filter(entry => {
        const entryDate = new Date(entry.snapshotTime);
        return entryDate >= openingTime;
    });

    return { allRides, filteredRides, sortedRides, flatRidesHistory, sortedRideHistory: filteredSortedRideHistory };
};
