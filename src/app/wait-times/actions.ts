import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { filterTodaysRideHistory } from "@/lib/utils";
import { PARKS, THEME_PARKS_WIKI_API_BASE_URL } from "@/lib/constants";
import type { ParkData, ExpectedWaitTimeData, RideWaitTimeHistory, LiveRideData } from "@/lib/types";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

const getMainAttractions = async (): Promise<LiveRideData> => {
    const parksDataPromise = PARKS.map(park => fetchWithRetry(`${THEME_PARKS_WIKI_API_BASE_URL}/entity/${park.id}/live`, {
        next: { revalidate: 30 }, // Cache for 30 seconds
        maxRetries: 2,
        initialDelayMs: 500,
        timeoutMs: 8000
    }));
    const parksDataResponseResult = await Promise.all(parksDataPromise);
    if (parksDataResponseResult.some(res => !res.ok)) {
        throw new Error("Failed to fetch park data");
    }

    const parksDataResult = await Promise.all(parksDataResponseResult.map(res => res.json())) as ParkData[];
    if (!parksDataResult || parksDataResult.length === 0) {
        notFound();
    }

    const mainAttractions = parksDataResult[0].liveData.filter(ride => ride.queue !== undefined && ride.entityType === 'ATTRACTION');
    return mainAttractions;
}

export const getWaitTimes = async () => {
    const mainAttractions = await getMainAttractions();
    const data = await fetchWithRetry(config.WAIT_TIMES_API_URL + "/wait-times", {
        next: { revalidate: 30 }, // Cache for 30 seconds
        maxRetries: 3,
        initialDelayMs: 1000,
        timeoutMs: 10000
    });

    if (!data.ok) {
        throw new Error(`Failed to fetch wait times: ${data.status} ${data.statusText}`);
    }

    const { all_rides: allRides,
        filtered_rides: filteredRides,
        sorted_rides: sortedRides,
        flat_rides_history: flatRidesHistory,
        sorted_ride_history: sortedRideHistory
    } = await data.json() as ExpectedWaitTimeData;
    if (!allRides || !filteredRides || !sortedRides || !flatRidesHistory || !sortedRideHistory) {
        notFound();
    }

    // Filter out history to be only todays park data from open until closing (PST)
    const filteredSortedRideHistory: RideWaitTimeHistory = filterTodaysRideHistory(sortedRideHistory);

    // Add any missing data that comes from the mainAttractions list
    mainAttractions.forEach(attraction => {
        const historyEntry = filteredSortedRideHistory.findLast(entry => entry.rideName === attraction.name);
        if (!historyEntry) return;

        // Convert both dates to Date objects for proper comparison
        const historySnapshotTime = new Date(historyEntry.snapshotTime);
        const attractionLastUpdated = new Date(attraction.lastUpdated);

        // If the history entry snapshot time is older than the attraction last update time, push a new entry to the history
        if (historySnapshotTime < attractionLastUpdated) {
            filteredSortedRideHistory.push({
                rideId: historyEntry.rideId,
                rideName: attraction.name,
                waitTime: attraction.queue?.STANDBY.waitTime ?? 0,
                snapshotTime: attractionLastUpdated
            });
        }
    });

    return { allRides, filteredRides, sortedRides, flatRidesHistory, sortedRideHistory: filteredSortedRideHistory, mainAttractions };
};
