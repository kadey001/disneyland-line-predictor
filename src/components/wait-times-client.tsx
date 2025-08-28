"use client";
import { useState, useMemo } from "react";
import RideSelect from "@/components/ride-select";
import WaitTimeChart from "@/components/wait-time-chart";
import TimeFilterSelector, { type TimeFilter } from "./time-filter-selector";
import type { Ride, RideWaitTimeHistory, WaitTimesResponse } from "@/lib/types";
import { calculateWaitTimeTrends } from "@/lib/trend-calculator";
import WaitTimeTrendChart from "./wait-time-trend-chart";
import WaitTimeForecastChart from "./wait-time-forecast-chart";
import { useFilteredRideHistory } from "@/hooks/use-filtered-ride-history";

interface WaitTimesClientProps {
    data: WaitTimesResponse;
}

export default function WaitTimesClient({ data }: WaitTimesClientProps) {
    const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('full-day');

    // Transform liveWaitTime to Ride[] format
    const rides: Ride[] = useMemo(() => {
        return (data.liveWaitTime || []).map(entry => ({
            id: parseInt(entry.rideId) || 0,
            name: entry.rideName,
            is_open: entry.status === 'OPERATING',
            wait_time: entry.waitTime || 0,
            last_updated: entry.lastUpdated
        }));
    }, [data.liveWaitTime]);

    // Transform groupedRidesHistory to RideWaitTimeHistory format
    const ridesHistory: RideWaitTimeHistory = useMemo(() => {
        const history = Object.entries(data.groupedRidesHistory || {}).flatMap(([rideId, historyEntries]) =>
            historyEntries.map(entry => ({
                rideId: parseInt(rideId) || 0,
                rideName: data.rideNames?.[rideId] || 'Unknown Ride',
                waitTime: entry.waitTime,
                snapshotTime: new Date(entry.snapshotTime)
            }))
        );
        // Sort by snapshotTime in ascending order (oldest first)
        return history.sort((a, b) => a.snapshotTime.getTime() - b.snapshotTime.getTime());
    }, [data.groupedRidesHistory, data.rideNames]);

    // Transform liveWaitTime to LiveRideData format
    const liveRideData: any[] = useMemo(() => {
        return (data.liveWaitTime || []).map(entry => ({
            id: entry.rideId,
            parkId: '', // Not available in new format
            externalId: '', // Not available in new format
            entityType: 'ATTRACTION' as const,
            name: entry.rideName,
            status: entry.status as 'OPERATING' | 'CLOSED',
            lastUpdated: entry.lastUpdated,
            queue: {
                STANDBY: {
                    waitTime: entry.waitTime || 0
                }
            }
        }));
    }, [data.liveWaitTime]);

    // Set initial selected ride if not set
    useMemo(() => {
        if (!selectedRideId && rides.length > 0) {
            setSelectedRideId(rides[0].id.toString());
        }
    }, [selectedRideId, rides]);

    const selectedRide = useMemo(() => {
        if (!selectedRideId) return undefined;
        return rides.find(ride => ride.id.toString() === selectedRideId);
    }, [rides, selectedRideId]);

    const selectedLiveRideData = useMemo(() => {
        if (!selectedRide) return undefined;
        return liveRideData.find(attraction => attraction.name === selectedRide.name);
    }, [liveRideData, selectedRide]);

    const { filteredRidesHistory } = useFilteredRideHistory({
        ridesHistory,
        timeFilter,
        selectedRide
    });

    const filteredAttractions = useMemo(() => {
        // Only include attractions that we have in the ride history somewhere
        const rideNames = new Set(ridesHistory.map(item => item.rideName));
        return liveRideData.filter(attraction => rideNames.has(attraction.name));
    }, [ridesHistory, liveRideData]);

    const trends = useMemo(() => calculateWaitTimeTrends(filteredRidesHistory), [filteredRidesHistory]);

    return (
        <div className="w-full h-full md:container md:mx-auto">
            {/* Ride Selection Card */}
            <RideSelect filteredAttractions={filteredAttractions} rideNames={data.rideNames || {}} selectedRideId={selectedRideId || undefined} onSelect={setSelectedRideId} />

            {/* Time Filter Card */}
            <TimeFilterSelector value={timeFilter} onValueChange={setTimeFilter} />

            {/* Wait Time Chart Card */}
            <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg mt-2 md:p-6 shadow-lg text-white">
                <WaitTimeChart rideWaitTimeHistory={filteredRidesHistory} selectedRide={selectedLiveRideData} />
                <div className="mt-2" />
                <WaitTimeTrendChart rideWaitTimeTrend={trends ? trends : undefined} selectedRide={selectedRide} />
                <div className="mt-2" />
                <WaitTimeForecastChart liveRideData={selectedLiveRideData} />
            </div>
        </div>
    );
}
