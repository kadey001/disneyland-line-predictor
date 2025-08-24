import { useMemo } from "react";
import type { RideWaitTimeEntry, RideWaitTimeHistory, RideWaitTimeTrends } from "./types";

export function calculateWaitTimeTrends(
    history: RideWaitTimeEntry[]
): { trend: number; startTime: Date; endTime: Date }[] {
    if (!history || history.length < 2) return [];

    // Filter out times after midnight and before park opening
    const filteredHistory = history.filter(ride => {
        const snapshotTime = new Date(ride.snapshotTime)
        const rideTime = snapshotTime.getHours();
        return rideTime >= 8 && rideTime < 24; // Park hours are 8 AM to 12 AM
    });

    // Calculate trends between consecutive entries
    const trends: RideWaitTimeTrends = [];
    for (let i = 1; i < filteredHistory.length; i++) {
        const prev = filteredHistory[i - 1];
        const curr = filteredHistory[i];
        trends.push({
            trend: curr.waitTime - prev.waitTime,
            startTime: prev.snapshotTime,
            endTime: curr.snapshotTime,
        });
    }
    return trends;
}

interface CalculateTrendProps {
    waitTimeHistory: RideWaitTimeHistory;
    rideId?: number;
}

// Function takes in RideWaitTimeHistory and calculates the trend of a selected ride
export const calculateTrend = ({ waitTimeHistory, rideId }: CalculateTrendProps): RideWaitTimeTrends | null => {
    if (!rideId) return null;

    const rideHistory = waitTimeHistory.filter(history => history.rideId === rideId);

    // Calculate the trend based on the ride's wait time history
    const trends = calculateWaitTimeTrends(rideHistory);

    // TODO: Cache the trends so later we can just append to it rather than having to calculate it all over again

    return trends;
};

// Export memoized version of calculateTrend
export const useMemoizedTrend = (props: CalculateTrendProps) => {
    return useMemo(() => calculateTrend(props), [props]);
};
