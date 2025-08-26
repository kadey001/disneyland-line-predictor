import WaitTimesClient from "@/components/wait-times-client";
import { getWaitTimes } from "./actions";

// Force dynamic rendering to prevent build-time API calls
export const dynamic = 'force-dynamic';

export default async function WaitTimesPage() {
    const { sortedRides, sortedRideHistory, mainAttractions } = await getWaitTimes();

    return <WaitTimesClient rides={sortedRides} ridesHistory={sortedRideHistory} mainAttractions={mainAttractions} />;
}
