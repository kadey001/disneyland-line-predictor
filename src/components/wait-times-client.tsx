"use client";
import { useState, useMemo } from "react";
import RideSelect from "@/components/ride-select";
import WaitTimeChart from "@/components/wait-time-chart";
import TimeFilterSelector, { type TimeFilter } from "./time-filter-selector";
import type { LiveRideData, Ride, RideWaitTimeHistory } from "@/lib/types";
import { calculateWaitTimeTrends } from "@/lib/trend-calculator";
import WaitTimeTrendChart from "./wait-time-trend-chart";
import WaitTimeForecastChart from "./wait-time-forecast-chart";
import { useRefresh } from "@/hooks/use-refresh";
import { useFilteredRideHistory } from "@/hooks/use-filtered-ride-history";

interface WaitTimesClientProps {
    rides: Ride[];
    ridesHistory: RideWaitTimeHistory;
    mainAttractions: LiveRideData;
}

export default function WaitTimesClient({ rides, ridesHistory, mainAttractions }: WaitTimesClientProps) {
    const [selectedRideId, setSelectedRideId] = useState(rides[0]?.id ?? null);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('full-day');

    // Refresh router every 30 seconds to get any API updates
    const REFRESH_INTERVAL_MS = 30000; // 30 seconds
    useRefresh(REFRESH_INTERVAL_MS);

    const selectedRide = useMemo(() => {
        return rides.find(ride => ride.id === selectedRideId);
    }, [rides, selectedRideId]);

    const selectedLiveRideData = useMemo(() => {
        if (!selectedRide) return undefined;
        return mainAttractions.find(attraction => attraction.name === selectedRide.name);
    }, [mainAttractions, selectedRide]);

    const { filteredRidesHistory } = useFilteredRideHistory(
        ridesHistory,
        selectedRideId,
        timeFilter
    );

    const trends = useMemo(() => calculateWaitTimeTrends(filteredRidesHistory), [filteredRidesHistory]);

    return (
        <div className="w-full h-full md:container md:mx-auto">
            {/* Ride Selection Card */}
            <RideSelect rides={rides} selectedRide={selectedRide} onSelect={setSelectedRideId} />

            {/* Time Filter Card */}
            <TimeFilterSelector value={timeFilter} onValueChange={setTimeFilter} />

            {/* Wait Time Chart Card */}
            <div className="w-fullbg-white/10 backdrop-blur-md border border-white/20 rounded-lg mt-2 md:p-6 shadow-lg text-white">
                <WaitTimeChart rideWaitTimeHistory={filteredRidesHistory} selectedRide={selectedRide} />
                <div className="mt-2" />
                <WaitTimeTrendChart rideWaitTimeTrend={trends ? trends : undefined} ride={selectedRide} />
                <div className="mt-2" />
                <WaitTimeForecastChart liveRideData={selectedLiveRideData} />
            </div>
        </div>
    );
}
