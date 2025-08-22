import { IMPORTANT_DISNEYLAND_RIDES } from "@/lib/rides";
import type { QueueTimeData, RideWaitTimeHistory } from "@/lib/types";
import { PrismaRideWaitTimeRepository } from "@/repositories/prismaRideWaitTimeRepository";

const waitTimeDataSource = new PrismaRideWaitTimeRepository();

export const getWaitTimes = async () => {
    const queueTimes = await fetch("https://queue-times.com/parks/16/queue_times.json", {
        next: { revalidate: 60 } // Revalidate this specific fetch request every 60 seconds
    });
    const queueTimesData = await queueTimes.json() as QueueTimeData;

    const allRides = queueTimesData.lands.flatMap(land => land.rides);
    const filteredRides = allRides.filter(ride => IMPORTANT_DISNEYLAND_RIDES.some(r => r.id === ride.id));

    // Sort rides by wait time by default with lowest wait time first
    const sortedRides = filteredRides.sort((a, b) => a.wait_time - b.wait_time);

    await waitTimeDataSource.saveList(allRides);
    const ridesHistory = await Promise.all(sortedRides.map(ride => waitTimeDataSource.getHistory(ride.id)));
    const flatRidesHistory: RideWaitTimeHistory = ridesHistory.flat().map(_ride => ({
        rideId: _ride.rideId,
        rideName: _ride.rideName,
        waitTime: _ride.waitTime, // Assuming waitTime is a number
        snapshotTime: new Date(_ride.snapshotTime) // Convert string to Date object
    }));

    const sortedRideHistory = flatRidesHistory.sort((a, b) => a.snapshotTime.getTime() - b.snapshotTime.getTime());

    return { allRides, filteredRides, sortedRides, flatRidesHistory, sortedRideHistory };
};
