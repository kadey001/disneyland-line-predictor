"use client";
import { useState, useMemo, useEffect } from "react";
import RideSelect from "@/components/ride-select";
import WaitTimeChart from "@/components/wait-time-chart";
import type { Ride, RideWaitTimeHistory } from "@/lib/types";
import { calculateWaitTimeTrends } from "@/lib/trend-calculator";
import WaitTimeTrendChart from "./wait-time-trend-chart";
import { useRefresh } from "@/hooks/use-refresh";

interface WaitTimesClientProps {
    rides: Ride[];
    ridesHistory: RideWaitTimeHistory;
}

export default function WaitTimesClient({ rides, ridesHistory }: WaitTimesClientProps) {
    const [selectedRideId, setSelectedRideId] = useState(rides[0]?.id ?? null);

    // Refresh router every 30 seconds to get any API updates
    const REFRESH_INTERVAL_MS = 30000; // 30 seconds
    useRefresh(REFRESH_INTERVAL_MS);

    const selectedRide = useMemo(() => {
        return rides.find(ride => ride.id === selectedRideId);
    }, [rides, selectedRideId]);

    const filteredRidesHistory = useMemo(() => {
        return ridesHistory.filter(history => history.rideId === selectedRideId);
    }, [ridesHistory, selectedRideId]);

    const trends = useMemo(() => calculateWaitTimeTrends(filteredRidesHistory), [filteredRidesHistory]);

    return (
        <div className="w-full h-full md:container md:mx-auto md:p-4 ">
            {/* Ride Selection Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
                <RideSelect rides={rides} selectedRideId={selectedRideId} onSelect={setSelectedRideId} />
            </div>

            {/* Wait Time Chart Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 shadow-lg text-white">
                <WaitTimeChart rideWaitTimeHistory={filteredRidesHistory} selectedRide={selectedRide} />
                <br />
                <WaitTimeTrendChart rideWaitTimeTrend={trends ? trends : undefined} ride={selectedRide} />
            </div>
        </div>
    );
}
