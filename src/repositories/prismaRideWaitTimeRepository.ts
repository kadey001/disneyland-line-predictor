import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

import { RideWaitTimeSnapshot } from "../models/rideWaitTime";
import type { Ride } from '@/lib/types';

export interface RideWaitTimeRepository {
    save(snapshot: Ride): Promise<void>;
    saveList(snapshots: Ride[]): Promise<void>;
    getHistory(rideId: number): Promise<RideWaitTimeSnapshot[]>;
}

export class PrismaRideWaitTimeRepository implements RideWaitTimeRepository {
    private prisma = new PrismaClient().$extends(withAccelerate());

    // TODO: have this run in cloud run on a schedule
    async save(snapshot: Ride): Promise<void> {
        const FIVE_MINUTES_AGO = new Date(Date.now() - 60 * 1000 * 5);
        const recent = await this.prisma.rideWaitTimeSnapshot.findFirst({
            where: {
                rideId: snapshot.id,
                snapshotTime: { gte: FIVE_MINUTES_AGO },
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
        const FIVE_MINUTES_AGO = new Date(Date.now() - 60 * 1000 * 5);
        const toSave = [];
        for (const ride of rides) {
            const lastUpdatedWaitTime = new Date(ride.last_updated);
            // Only update if the last updated time is within the last five minutes and we have not already recorded it
            if (lastUpdatedWaitTime > FIVE_MINUTES_AGO) {
                // Check if we have a record in the database over the last 5 mins
                const recent = await this.prisma.rideWaitTimeSnapshot.findFirst({
                    where: {
                        rideId: ride.id,
                        snapshotTime: { gte: FIVE_MINUTES_AGO },
                    },
                    orderBy: { snapshotTime: 'desc' },
                    cacheStrategy: {
                        ttl: 120,
                        swr: 180
                    },
                });
                if (recent) continue;
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
            console.log(`Saving ${toSave.length} ride wait time snapshots`);
            await this.prisma.rideWaitTimeSnapshot.createMany({ data: toSave });
        }
    }

    async getHistory(rideId: number, timeframe?: Date): Promise<RideWaitTimeSnapshot[]> {
        const PAST_24_HOURS = new Date(Date.now() - 60 * 1000 * 60 * 24);
        if (!timeframe) timeframe = PAST_24_HOURS;
        const records = await this.prisma.rideWaitTimeSnapshot.findMany({
            where: { rideId, snapshotTime: { gte: timeframe } },
            orderBy: { snapshotTime: "asc" },
        });
        return records.map(r => ({
            id: r.id.toString(),
            rideId: Number(r.rideId || 0),
            rideName: r.rideName,
            isOpen: r.isOpen,
            waitTime: Number(r.waitTime || 0),
            snapshotTime: r.snapshotTime.toISOString(),
        }));
    }
}
