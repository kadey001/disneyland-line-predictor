import WaitTimesClient from "@/components/wait-times-client";
import { getWaitTimes } from "./actions";
import { logNetworkError, createRequestContext } from "@/lib/error-logger";
import type { WaitTimesResponse } from "@/lib/types";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

export default async function WaitTimesPage() {
    try {
        const { sortedRides, sortedRideHistory } = await getWaitTimes();

        // Reconstruct the WaitTimesResponse format
        const rideNames: Record<string, string> = {};
        sortedRides.forEach(ride => {
            rideNames[ride.id.toString()] = ride.name;
        });

        const groupedRidesHistory: Record<string, { waitTime: number; snapshotTime: string }[]> = {};
        sortedRideHistory.forEach(entry => {
            const rideId = entry.rideId.toString();
            if (!groupedRidesHistory[rideId]) {
                groupedRidesHistory[rideId] = [];
            }
            groupedRidesHistory[rideId].push({
                waitTime: entry.waitTime,
                snapshotTime: entry.snapshotTime.toISOString()
            });
        });

        const data: WaitTimesResponse = {
            liveWaitTime: sortedRides.map(ride => ({
                rideId: ride.id.toString(),
                rideName: ride.name,
                waitTime: ride.wait_time,
                status: ride.is_open ? 'OPERATING' : 'CLOSED',
                lastUpdated: ride.last_updated
            })),
            rideNames,
            groupedRidesHistory
        };

        return <WaitTimesClient data={data} />;
    } catch (error) {
        // Log the error for monitoring
        logNetworkError('Failed to load wait times data', error, createRequestContext());

        // Return a user-friendly error message
        return (
            <div className="w-full h-full md:container md:mx-auto p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong className="font-bold">Unable to load wait times</strong>
                    <span className="block sm:inline"> - Please try refreshing the page. The Disney parks data service may be temporarily unavailable.</span>
                </div>
            </div>
        );
    }
}
