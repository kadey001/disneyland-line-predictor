import { PrismaRideWaitTimeRepository } from "@/repositories/prismaRideWaitTimeRepository";
import WaitTimesClient from "@/components/wait-times-client";
import { getWaitTimes } from "./actions";

const repo = new PrismaRideWaitTimeRepository();

export default async function WaitTimesPage() {
    const { sortedRides, sortedRideHistory } = await getWaitTimes();

    return <WaitTimesClient rides={sortedRides} ridesHistory={sortedRideHistory} />;
}
