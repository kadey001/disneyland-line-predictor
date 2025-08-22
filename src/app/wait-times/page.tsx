import { PrismaRideWaitTimeRepository } from "@/repositories/prismaRideWaitTimeRepository";
import WaitTimesClient from "@/components/wait-times-client";
import type { QueueTimeData, RideWaitTimeHistory } from "@/lib/types";
import { IMPORTANT_DISNEYLAND_RIDES } from '@/lib/rides';

const repo = new PrismaRideWaitTimeRepository();

export default async function WaitTimesPage() {
    const queueTimes = await fetch("https://queue-times.com/parks/16/queue_times.json", {
        next: { revalidate: 60 } // Revalidate this specific fetch request every 60 seconds
    });
    const queueTimesData = await queueTimes.json() as QueueTimeData;

    const filteredRides = queueTimesData.lands.flatMap(land =>
        land.rides.filter(ride => IMPORTANT_DISNEYLAND_RIDES.some(r => r.id === ride.id))
    );

    // Sort rides by wait time by default with lowest wait time first
    const sortedRides = filteredRides.sort((a, b) => a.wait_time - b.wait_time);

    await repo.saveList(sortedRides);
    const ridesHistory = await Promise.all(sortedRides.map(ride => repo.getHistory(ride.id)));
    const flatRidesHistory: RideWaitTimeHistory = ridesHistory.flat().map(_ride => ({
        rideId: _ride.rideId,
        rideName: _ride.rideName,
        waitTime: _ride.waitTime, // Assuming waitTime is a number
        snapshotTime: new Date(_ride.snapshotTime) // Convert string to Date object
    }));

    return <WaitTimesClient rides={sortedRides} ridesHistory={flatRidesHistory} />;
}
