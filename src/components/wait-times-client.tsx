"use client";

import { useMemo, useEffect } from "react";
import RideSelect from "@/components/ride-select";
import WaitTimeChart from "@/components/wait-time-chart";
import { useFilteredRideHistory } from "@/hooks/use-filtered-ride-history";
import { calculateWaitTimeTrends } from "@/lib/trend-calculator";
import type { LiveWaitTimeEntry, WaitTimesResponse } from "@/lib/types";
import TimeFilterSelector, { type TimeFilter } from "./time-filter-selector";
import WaitTimeTrendChart from "./wait-time-trend-chart";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { IMPORTANT_DISNEYLAND_RIDES } from "@/lib/rides";

interface WaitTimesClientProps {
    data: WaitTimesResponse;
}

export default function WaitTimesClient({ data }: WaitTimesClientProps) {
    const [selectedRideId, setSelectedRideId] = useLocalStorage<string>('selectedRideId', IMPORTANT_DISNEYLAND_RIDES[0].id);
    const [timeFilter, setTimeFilter] = useLocalStorage<TimeFilter>('timeFilter', 'full-day');

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

    useEffect(() => {
        // Check against the selected Ride wait time and the last wait time for that ride in the history, log if there is a difference
        if (selectedRide && filteredRidesHistory.length > 0) {
            const lastSnapshotTime = filteredRidesHistory[filteredRidesHistory.length - 1].snapshotTime;
            console.log(`Last snapshot time for ${selectedRide.rideName}: ${lastSnapshotTime}`);
            console.log(`Curr snapshot time for ${selectedRide.rideName}: ${selectedRide.lastUpdated}`);
            if (selectedRide.lastUpdated !== lastSnapshotTime) {
                console.log(`Snapshot time for ${selectedRide.rideName} changed from ${lastSnapshotTime} to ${selectedRide.lastUpdated}`);
            }
        }
    }, [selectedRide, filteredRidesHistory]);

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
