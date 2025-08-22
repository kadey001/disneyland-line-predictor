import { PrismaClient } from "@prisma/client";
import { RideWaitTimeSnapshot } from "../models/rideWaitTime";
import type { Ride } from '@/lib/types';

export interface RideWaitTimeRepository {
    save(snapshot: Ride): Promise<void>;
    saveList(snapshots: Ride[]): Promise<void>;
    getHistory(rideId: number): Promise<RideWaitTimeSnapshot[]>;
}

export class PrismaRideWaitTimeRepository implements RideWaitTimeRepository {
    private prisma = new PrismaClient();

    // TODO: have this run in cloud run on a schedule
    async save(snapshot: Ride): Promise<void> {
        const TEN_MINUTES_AGO = new Date(Date.now() - 60 * 1000 * 10);
        const recent = await this.prisma.rideWaitTimeSnapshot.findFirst({
            where: {
                rideId: snapshot.id,
                snapshotTime: { gte: TEN_MINUTES_AGO },
            },
            orderBy: { snapshotTime: 'desc' },
        });
        if (!recent) {
            await this.prisma.rideWaitTimeSnapshot.create({
                data: {
                    rideId: snapshot.id,
                    rideName: snapshot.name,
                    isOpen: snapshot.is_open,
                    waitTime: snapshot.wait_time,
                    snapshotTime: new Date(snapshot.last_updated),
                },
            });
        }
    }

    async saveList(rides: Ride[]): Promise<void> {
        const TEN_MINUTES_AGO = new Date(Date.now() - 60 * 1000 * 10);
        const toSave = [];
        for (const ride of rides) {
            const recent = await this.prisma.rideWaitTimeSnapshot.findFirst({
                where: {
                    rideId: ride.id,
                    snapshotTime: { gte: TEN_MINUTES_AGO },
                },
                orderBy: { snapshotTime: 'desc' },
            });
            if (!recent) {
                toSave.push({
                    rideId: ride.id,
                    rideName: ride.name,
                    isOpen: ride.is_open,
                    waitTime: ride.wait_time,
                    snapshotTime: new Date(ride.last_updated),
                });
            }
        }
        if (toSave.length > 0) {
            await this.prisma.rideWaitTimeSnapshot.createMany({ data: toSave });
        }
    }

    async getHistory(rideId: number, timeframe?: Date): Promise<RideWaitTimeSnapshot[]> {
        const PAST_24_HOURS = new Date(Date.now() - 60 * 1000 * 60 * 24);
        if (!timeframe) timeframe = PAST_24_HOURS;
        const records: Array<{
            id: string;
            rideId: number;
            rideName: string;
            isOpen: boolean;
            waitTime: number;
            snapshotTime: Date;
        }> = await this.prisma.rideWaitTimeSnapshot.findMany({
            where: { rideId, snapshotTime: { gte: timeframe } },
            orderBy: { snapshotTime: "asc" },
        });
        return records.map(r => ({
            id: r.id,
            rideId: r.rideId,
            rideName: r.rideName,
            isOpen: r.isOpen,
            waitTime: r.waitTime,
            snapshotTime: r.snapshotTime.toISOString(),
        }));
    }
}
