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

export type RideWaitTimeTrend = {
    trend: number;
    startTime: Date;
    endTime: Date;
}

export type RideWaitTimeTrends = RideWaitTimeTrend[];

export type RideWaitTimeTrendMap = {
    [rideId: number]: RideWaitTimeTrends;
}

export type ExpectedWaitTimeData = {
    all_rides: Ride[];
    filtered_rides: Ride[];
    sorted_rides: Ride[];
    flat_rides_history: RideWaitTimeHistory;
    sorted_ride_history: RideWaitTimeHistory;
}

export type RideType = 'ATTRACTION' | 'SHOW' | 'RESTAURANT';
export type RideStatus = 'OPERATING' | 'CLOSED';

export type LiveRideDataEntry = {
    id: string;
    parkId: string;
    externalId: string;
    entityType: RideType;
    name: string;
    status: RideStatus;
    lastUpdated: string; // ISO date string
    operatingHours?: {
        startTime: string; // ISO date string
        endTime: string; // ISO date string
    }[];
    queue?: {
        STANDBY: {
            waitTime: number;
        },
        RETURN_TIME?: {
            state: string
            returnStart: string
            returnEnd: string | null
        }
    };
    forecast?: {
        percentage: number;
        waitTime: number;
        time: string; // ISO date string
    }[];
}

export type LiveRideData = LiveRideDataEntry[];

export type ParkData = {
    id: string;
    entityType: string;
    name: string;
    timezone: string;
    liveData: LiveRideData;
}

