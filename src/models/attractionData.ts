export type LiveStatusType = 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT';

export type AttractionWaitTimeForecastDataEntry = {
    percentage: number;
    waitTime: number;
    time: string; // ISO date string
};

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
    forecast: AttractionWaitTimeForecastDataEntry[];
}

export type LiveAttractionData = {
    rideId: string;
    rideName: string;
    waitTime: number;
    status: LiveStatusType;
    lastUpdated: string; // ISO date string
}

export type StaticAttractionData = {
    rideId: string;
    rideName: string;
}

export type AttractionHistoryDataEntry = {
    rideId: string;
    rideName: string;
    waitTime: number;
    lastUpdated: string; // ISO date string
};

export type AttractionHistoryData = AttractionHistoryDataEntry[];
