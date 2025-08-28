import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { filterTodaysRideHistory } from "@/lib/utils";
import { PARKS, THEME_PARKS_WIKI_API_BASE_URL } from "@/lib/constants";
import type { ParkData, WaitTimesResponse, RideWaitTimeHistory, LiveRideData } from "@/lib/types";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

const getMainAttractions = async (): Promise<LiveRideData> => {
    const parksDataPromise = PARKS.map(park => fetchWithRetry(`${THEME_PARKS_WIKI_API_BASE_URL}/entity/${park.id}/live`, {
        next: { revalidate: 120 }, // Cache for 2 minutes
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
    const [mainAttractions, waitTimesData] = await Promise.all([
        getMainAttractions(),
        fetchWithRetry(config.WAIT_TIMES_API_URL + "/wait-times", {
            next: { revalidate: 30 }, // Cache for 30 seconds
            maxRetries: 3,
            initialDelayMs: 1000,
            timeoutMs: 10000
        })
    ]);

    if (!waitTimesData.ok) {
        throw new Error(`Failed to fetch wait times: ${waitTimesData.status} ${waitTimesData.statusText}`);
    }

    const waitTimesResponse = await waitTimesData.json() as WaitTimesResponse;

    if (!waitTimesResponse.liveWaitTime || !waitTimesResponse.groupedRidesHistory) {
        notFound();
    }

    // Transform liveWaitTime to Ride[] format
    const allRides = waitTimesResponse.liveWaitTime.map(entry => ({
        id: parseInt(entry.rideId) || 0,
        name: entry.rideName,
        is_open: entry.status === 'OPERATING',
        wait_time: entry.waitTime || 0,
        last_updated: entry.lastUpdated
    }));

    // Filter rides with valid wait times
    const filteredRides = allRides.filter(ride => ride.wait_time > 0);

    // Sort rides by wait time (descending)
    const sortedRides = [...filteredRides].sort((a, b) => b.wait_time - a.wait_time);

    // Transform groupedRidesHistory to RideWaitTimeHistory format
    const flatRidesHistory: RideWaitTimeHistory = Object.entries(waitTimesResponse.groupedRidesHistory).flatMap(([rideId, historyEntries]) =>
        historyEntries.map(entry => ({
            rideId: parseInt(rideId) || 0,
            rideName: waitTimesResponse.rideNames[rideId] || 'Unknown Ride',
            waitTime: entry.waitTime,
            snapshotTime: new Date(entry.snapshotTime)
        }))
    );

    // Filter out history to be only todays park data from open until closing (PST)
    const sortedRideHistory: RideWaitTimeHistory = filterTodaysRideHistory(flatRidesHistory);

    // Add any missing data that comes from the mainAttractions list
    mainAttractions.forEach(attraction => {
        const historyEntry = sortedRideHistory.findLast(entry => entry.rideName === attraction.name);
        if (!historyEntry) return;

        // Convert both dates to Date objects for proper comparison
        const historySnapshotTime = new Date(historyEntry.snapshotTime);
        const attractionLastUpdated = new Date(attraction.lastUpdated);

        // If the history entry snapshot time is older than the attraction last update time, push a new entry to the history
        if (historySnapshotTime < attractionLastUpdated) {
            sortedRideHistory.push({
                rideId: historyEntry.rideId,
                rideName: attraction.name,
                waitTime: attraction.queue?.STANDBY.waitTime ?? 0,
                snapshotTime: attractionLastUpdated
            });
        }
    });

    return { allRides, filteredRides, sortedRides, flatRidesHistory, sortedRideHistory, mainAttractions };
};
