import WaitTimesClient from "@/components/wait-times-client";
import { getWaitTimes } from "./actions";
import { logNetworkError, createRequestContext } from "@/lib/error-logger";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

export default async function WaitTimesPage() {
    try {
        const { sortedRides, sortedRideHistory, mainAttractions } = await getWaitTimes();
        return <WaitTimesClient rides={sortedRides} ridesHistory={sortedRideHistory} mainAttractions={mainAttractions} />;
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
