// TypeScript interface for a ride wait time snapshot
export interface RideWaitTimeSnapshot {
    id: string; // UUID
    rideId: number;
    rideName: string;
    isOpen: boolean;
    waitTime: number;
    snapshotTime: string; // ISO string
}
