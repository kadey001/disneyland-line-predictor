import { useMemo } from "react";
import type { Ride, RideWaitTimeHistory } from "@/lib/types";
import type { TimeFilter } from "@/components/time-filter-selector";

interface UseFilteredRideHistory {
    ridesHistory: RideWaitTimeHistory;
    timeFilter: TimeFilter;
    selectedRide?: Ride;
}

export function useFilteredRideHistory({
    ridesHistory,
    timeFilter,
    selectedRide
}: UseFilteredRideHistory) {
    const selectedRideHistory = useMemo(() => {
        if (!selectedRide) return [];
        return ridesHistory.filter(history => history.rideId === selectedRide.id);
    }, [ridesHistory, selectedRide]);

    const filteredRidesHistory = useMemo(() => {
        if (timeFilter === 'full-day') {
            return selectedRideHistory;
        }

        const now = new Date();
        const cutoffTime = new Date();

        switch (timeFilter) {
            case 'last-30-mins':
                cutoffTime.setMinutes(now.getMinutes() - 30);
                break;
            case 'last-hour':
                cutoffTime.setHours(now.getHours() - 1);
                break;
            case 'last-2-hours':
                cutoffTime.setHours(now.getHours() - 2);
                break;
            case 'last-4-hours':
                cutoffTime.setHours(now.getHours() - 4);
                break;
            case 'last-8-hours':
                cutoffTime.setHours(now.getHours() - 8);
                break;
        }

        return selectedRideHistory.filter(item => new Date(item.snapshotTime) >= cutoffTime);
    }, [selectedRideHistory, timeFilter]);

    return {
        selectedRideHistory,
        filteredRidesHistory
    };
}
