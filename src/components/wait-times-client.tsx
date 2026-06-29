"use client";

import { useMemo } from "react";
import RideSelect from "@/components/ride-select";
import WaitTimeChart from "@/components/wait-time-chart";
import { useFilteredRideHistory } from "@/hooks/use-filtered-ride-history";
import { calculateWaitTimeTrends } from "@/lib/trend-calculator";
import type { LiveWaitTimeEntry, WaitTimesResponse, LiveRideDataEntry } from "@/lib/types";
import TimeFilterSelector, { type TimeFilter } from "./time-filter-selector";
import WaitTimeTrendChart from "./wait-time-trend-chart";
import WaitTimeForecastChart from "./wait-time-forecast-chart";

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

    // Map LiveWaitTimeEntry to the shape expected by WaitTimeForecastChart
    const selectedForecastData = useMemo(() => {
        if (!selectedRide || !selectedRide.forecast) return undefined;
        return {
            id: selectedRide.rideId,
            name: selectedRide.rideName,
            forecast: selectedRide.forecast
        } as unknown as LiveRideDataEntry;
    }, [selectedRide]);

    return (
        <div className="w-full h-full md:container md:mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 md:p-0">
            <div className="mb-6">
                <RideSelect
                    selectedRideId={selectedRideId}
                    onSelect={setSelectedRideId}
                    attractionAtlas={attractionAtlas}
                    liveWaitTime={liveWaitTime}
                />
            </div>
            
            <div className="mb-6 flex justify-end">
                <TimeFilterSelector value={timeFilter} onValueChange={setTimeFilter} />
            </div>

            {/* Data Charts */}
            <div className="w-full glass-card rounded-2xl mt-4 p-4 md:p-8 space-y-6">
                <div className="glass p-4 rounded-xl shadow-inner animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
                    <WaitTimeChart rideWaitTimeHistory={filteredRidesHistory} selectedRide={selectedRide} />
                </div>
                
                <div className="glass p-4 rounded-xl shadow-inner animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
                    <WaitTimeTrendChart rideWaitTimeTrend={trends ? trends : undefined} selectedRide={selectedRide} />
                </div>
                
                <div className="glass p-4 rounded-xl shadow-inner animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
                    <WaitTimeForecastChart liveRideData={selectedForecastData} />
                </div>
            </div>
        </div>
    );
}

