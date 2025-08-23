import { IMPORTANT_DISNEYLAND_RIDES } from "@/lib/rides";
import type { QueueTimeData, Ride, RideWaitTimeHistory } from "@/lib/types";
import { PrismaRideWaitTimeRepository } from "@/repositories/prismaRideWaitTimeRepository";

const waitTimeDataSource = new PrismaRideWaitTimeRepository();

type ExpectedWaitTimeData = {
    all_rides: Ride[];
    filtered_rides: Ride[];
    sorted_rides: Ride[];
    // flat_rides_history: RideWaitTimeHistory;
    // sorted_ride_history: RideWaitTimeHistory;
}

export const getWaitTimes = async () => {
    const data = await fetch("http://localhost:8080/wait-times", {
        next: { revalidate: 60 } // Revalidate this specific fetch request every 60 seconds
    });

    const { all_rides: allRides, filtered_rides: filteredRides, sorted_rides: sortedRides } = await data.json() as ExpectedWaitTimeData;

    // Fire-and-forget: save data without blocking the response
    waitTimeDataSource.saveList(allRides).catch(error =>
        console.error('Background save failed:', error)
    );

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
