import type { RideHistoryEntry, RideWaitTimeTrends } from "./types";

export function calculateWaitTimeTrends(
    history: RideHistoryEntry[]
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
            startTime: new Date(prev.snapshotTime),
            endTime: new Date(curr.snapshotTime),
        });
    }
    return trends;
}
