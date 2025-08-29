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

// API response types for external services
export interface AttractionDataEntry {
    id: number;
    rideId: string;
    externalId: string;
    parkId: string;
    entityType: string;
    name: string;
    status: string;
    lastUpdated: string; // ISO date string
    createdAt: string; // ISO date string
    operatingHours: string;
    standbyWaitTime: number;
    returnTimeState: string;
    returnStart: string;
    returnEnd: string | null;
    forecast: string; // Array of JSON objects stringified
}

// New API response types for the updated wait-times API
export interface LiveWaitTimeEntry {
    rideId: string;
    rideName: string;
    waitTime: number | null;
    status: string;
    lastUpdated: string; // ISO date string
}

export interface RideHistoryEntry {
    waitTime: number;
    snapshotTime: string; // ISO date string
}

// New attraction atlas types
export interface AttractionAtlasEntry {
    rideId: string;
    rideName: string;
}

export interface ParkAtlasEntry {
    parkId: string;
    parkName: string;
    rides: AttractionAtlasEntry[];
}

export type GroupedRidesHistory = Record<string, RideHistoryEntry[]>;

export interface WaitTimesResponse {
    liveWaitTime: LiveWaitTimeEntry[];
    attractionAtlas: ParkAtlasEntry[];
    groupedRidesHistory: GroupedRidesHistory;
}
