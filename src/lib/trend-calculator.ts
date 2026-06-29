import type { RideHistoryEntry, RideWaitTimeTrends } from "./types";
import { getPacificHour } from "./utils";

export function calculateWaitTimeTrends(
    history: RideHistoryEntry[]
): { trend: number; startTime: Date; endTime: Date }[] {
    if (!history || history.length < 2) return [];

    // Keep only snapshots within park operating hours (8 AM to midnight) in
    // Disneyland's local (Pacific) time, regardless of where the viewer is.
    const filteredHistory = history.filter(ride => {
        const hour = getPacificHour(new Date(ride.snapshotTime));
        return hour >= 8; // Hours 0-7 (midnight–8 AM) are outside park hours
    });

    // Calculate trends between consecutive entries
    const trends: RideWaitTimeTrends = [];
    for (let i = 1; i < filteredHistory.length; i++) {
        const prev = filteredHistory[i - 1];
        const curr = filteredHistory[i];
        // A null wait time means the ride was closed at that snapshot; a delta
        // across a closure isn't meaningful, so skip it.
        if (prev.waitTime === null || curr.waitTime === null) continue;
        trends.push({
            trend: curr.waitTime - prev.waitTime,
            startTime: new Date(prev.snapshotTime),
            endTime: new Date(curr.snapshotTime),
        });
    }
    return trends;
}
