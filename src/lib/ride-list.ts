import type { WaitTimesResponse, RideHistoryEntry } from "./types";
import { getParkHue, getParkLabel } from "./parks";
import { isOperating } from "./wait-format";

/**
 * Flattened, render-ready view of a single ride: atlas identity merged with its
 * live status/wait and recent history. Shared by the home picks, the overview
 * grid, and the detail screen so the merge logic lives in one place.
 */
export interface RideVM {
    id: string;
    name: string;
    parkName: string;
    parkLabel: string;
    hue: string;
    status: string;
    isOpen: boolean;
    waitTime: number | null;
    history: RideHistoryEntry[];
}

/**
 * Merges attractionAtlas (identity, grouped by park) with liveWaitTime (status +
 * wait) and groupedRidesHistory (recent samples) into a flat RideVM[].
 */
export function buildRideList(data: WaitTimesResponse | null | undefined): RideVM[] {
    if (!data) return [];
    const liveById = new Map(data.liveWaitTime?.map((l) => [l.rideId, l]) ?? []);
    const history = data.groupedRidesHistory ?? {};

    const rides: RideVM[] = [];
    for (const park of data.attractionAtlas ?? []) {
        for (const ride of park.rides) {
            const live = liveById.get(ride.rideId);
            const status = live?.status ?? "UNKNOWN";
            rides.push({
                id: ride.rideId,
                name: ride.rideName,
                parkName: park.parkName,
                parkLabel: getParkLabel(park.parkName),
                hue: getParkHue(park.parkName),
                status,
                isOpen: isOperating(status),
                // ?? (not ||) so a 0-minute walk-on stays 0 rather than becoming null.
                waitTime: live?.waitTime ?? null,
                history: history[ride.rideId] ?? [],
            });
        }
    }
    return rides;
}

/** Park-level summary used by the home status bar. */
export interface ParkSummary {
    openCount: number;
    avgWait: number;
    busiest: string;
    busiestId: string | null;
}

export function summarize(rides: RideVM[]): ParkSummary {
    const openWithWait = rides.filter((r) => r.isOpen && r.waitTime !== null);
    const openCount = openWithWait.length;
    const avgWait = openCount
        ? Math.round(openWithWait.reduce((s, r) => s + (r.waitTime as number), 0) / openCount)
        : 0;
    const busiest = openWithWait.reduce<RideVM | null>(
        (max, r) => (!max || (r.waitTime as number) > (max.waitTime as number) ? r : max),
        null,
    );
    return {
        openCount,
        avgWait,
        busiest: busiest?.name ?? "—",
        busiestId: busiest?.id ?? null,
    };
}

/** Top-N shortest open waits, for the home "Shortest waits right now" card. */
export function shortestPicks(rides: RideVM[], n = 3): RideVM[] {
    return rides
        .filter((r) => r.isOpen && r.waitTime !== null)
        .sort((a, b) => (a.waitTime as number) - (b.waitTime as number))
        .slice(0, n);
}
