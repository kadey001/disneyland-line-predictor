"use client";
import { useState, useMemo } from "react";
import RideList from "@/components/ride-list";
import WaitTimeChart from "@/components/wait-time-chart";
import type { Ride, RideWaitTimeHistory } from "@/lib/types";

interface WaitTimesClientProps {
    rides: Ride[];
    ridesHistory: RideWaitTimeHistory;
}

export default function WaitTimesClient({ rides, ridesHistory }: WaitTimesClientProps) {
    const [selectedRideId, setSelectedRideId] = useState(rides[0]?.id ?? null);

    const filteredRidesHistory = useMemo(() => {
        return ridesHistory.filter(history => history.rideId === selectedRideId);
    }, [ridesHistory, selectedRideId]);
    return (
        <div>
            <RideList rides={rides} selectedRideId={selectedRideId} onSelect={setSelectedRideId} />
            {filteredRidesHistory.length > 0 && (
                <WaitTimeChart rideWaitTimeHistory={filteredRidesHistory} />
            )}
        </div>
    );
}
