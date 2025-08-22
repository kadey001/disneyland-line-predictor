"use client";
import { useState, useMemo } from "react";
import RideSelect from "@/components/ride-list";
import WaitTimeChart from "@/components/wait-time-chart";
import type { Ride, RideWaitTimeHistory } from "@/lib/types";
import { calculateTrend } from "@/lib/trend-calculator";
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

    const trends = calculateTrend({ waitTimeHistory: ridesHistory, rideId: selectedRideId });

    const filteredRidesHistory = useMemo(() => {
        return ridesHistory.filter(history => history.rideId === selectedRideId);
    }, [ridesHistory, selectedRideId]);
    return (
        <div>
            <RideSelect rides={rides} selectedRideId={selectedRideId} onSelect={setSelectedRideId} />
            {filteredRidesHistory.length > 0 && (
                <WaitTimeChart rideWaitTimeHistory={filteredRidesHistory} />
            )}
            <WaitTimeTrendChart rideWaitTimeTrend={trends ? trends : undefined} ride={selectedRide} />
        </div>
    );
}
