export type Ride = {
    id: number;
    name: string;
    is_open: boolean;
    wait_time: number;
    last_updated: string; // ISO String
}

export type QueueTimeData = {
    lands: {
        id: number;
        name: string;
        rides: Ride[]
    }[]
}

export type RideWaitTimeEntry = {
    rideId: number;
    rideName: string;
    waitTime: number;
    snapshotTime: Date;
};

export type RideWaitTimeHistory = RideWaitTimeEntry[];
