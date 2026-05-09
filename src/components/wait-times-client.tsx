"use client";

import { useMemo } from "react";
import RideSelect from "@/components/ride-select";
import WaitTimeChart from "@/components/wait-time-chart";
import { useFilteredRideHistory } from "@/hooks/use-filtered-ride-history";
import { calculateWaitTimeTrends } from "@/lib/trend-calculator";
import type { LiveWaitTimeEntry, WaitTimesResponse } from "@/lib/types";
import TimeFilterSelector, { type TimeFilter } from "./time-filter-selector";
import WaitTimeTrendChart from "./wait-time-trend-chart";

interface WaitTimesClientProps {
    data: WaitTimesResponse;
    selectedRideId: string;
    setSelectedRideId: (id: string) => void;
    timeFilter: TimeFilter;
    setTimeFilter: (filter: TimeFilter) => void;
}

export default function WaitTimesClient({ 
    data, 
    selectedRideId, 
    setSelectedRideId, 
    timeFilter, 
    setTimeFilter 
}: WaitTimesClientProps) {
    const liveWaitTime = useMemo(() => data?.liveWaitTime || [], [data.liveWaitTime]);
    const groupedRidesHistory = useMemo(() => data?.groupedRidesHistory || {}, [data.groupedRidesHistory]);
    const attractionAtlas = useMemo(() => data?.attractionAtlas || [], [data.attractionAtlas]);

    const { filteredRidesHistory } = useFilteredRideHistory({
        ridesHistory: groupedRidesHistory,
        timeFilter,
        selectedRideId
    });

    const trends = useMemo(() => calculateWaitTimeTrends(filteredRidesHistory), [filteredRidesHistory]);

    const selectedRide: LiveWaitTimeEntry | null = useMemo(() => {
        return liveWaitTime.find((ride) => ride.rideId === selectedRideId) || null;
    }, [liveWaitTime, selectedRideId]);

    return (
        <div className="w-full h-full md:container md:mx-auto">
            <RideSelect
                selectedRideId={selectedRideId}
                onSelect={setSelectedRideId}
                attractionAtlas={attractionAtlas}
                liveWaitTime={liveWaitTime}
            />
            <TimeFilterSelector value={timeFilter} onValueChange={setTimeFilter} />

            {/* Data Charts */}
            <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg mt-2 md:p-6 shadow-lg text-white">
                <WaitTimeChart rideWaitTimeHistory={filteredRidesHistory} selectedRide={selectedRide} />
                <div className="mt-2" />
                <WaitTimeTrendChart rideWaitTimeTrend={trends ? trends : undefined} selectedRide={selectedRide} />
                {/* <div className="mt-2" /> */}
                {/* <WaitTimeForecastChart liveRideData={selectedLiveRideData} /> */}
            </div>
        </div>
    );
}
