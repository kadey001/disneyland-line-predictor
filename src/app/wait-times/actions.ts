import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { filterTodaysRideHistory } from "@/lib/utils";
import { PARKS, THEME_PARKS_WIKI_API_BASE_URL } from "@/lib/constants";
import type { ParkData, ExpectedWaitTimeData, RideWaitTimeHistory, LiveRideData } from "@/lib/types";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

// Global abort controller to cancel previous requests
let currentAbortController: AbortController | null = null;

const getMainAttractions = async (signal?: AbortSignal): Promise<LiveRideData> => {
    const parksDataPromise = PARKS.map(park => fetchWithRetry(`${THEME_PARKS_WIKI_API_BASE_URL}/entity/${park.id}/live`, {
        next: { revalidate: 30 }, // Cache for 30 seconds
        maxRetries: 2,
        initialDelayMs: 500,
        timeoutMs: 8000,
        signal // Pass the abort signal
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
    // Cancel any previous requests
    if (currentAbortController) {
        currentAbortController.abort();
    }

    // Create new abort controller for this request
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    try {
        const [mainAttractions, waitTimesData] = await Promise.all([
            getMainAttractions(signal),
            fetchWithRetry(config.WAIT_TIMES_API_URL + "/wait-times", {
                next: { revalidate: 30 }, // Cache for 30 seconds
                maxRetries: 3,
                initialDelayMs: 1000,
                timeoutMs: 10000,
                signal
            })
        ]);

        if (!waitTimesData.ok) {
            throw new Error(`Failed to fetch wait times: ${waitTimesData.status} ${waitTimesData.statusText}`);
        }

        const { all_rides: allRides,
            filtered_rides: filteredRides,
            sorted_rides: sortedRides,
            flat_rides_history: flatRidesHistory,
            sorted_ride_history: sortedRideHistory
        } = await waitTimesData.json() as ExpectedWaitTimeData;

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
    } catch (error) {
        // Reset the abort controller
        currentAbortController = null;

        // If the error is due to abort, handle gracefully
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn('Request was cancelled due to page refresh');
            throw new Error('Request cancelled');
        }

        throw error;
    }
};
