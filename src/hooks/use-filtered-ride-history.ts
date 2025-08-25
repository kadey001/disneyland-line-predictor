import { useMemo } from "react";
import type { RideWaitTimeHistory } from "@/lib/types";
import type { TimeFilter } from "@/components/time-filter-selector";

export function useFilteredRideHistory(
    ridesHistory: RideWaitTimeHistory,
    selectedRideId: number | null,
    timeFilter: TimeFilter
) {
    const selectedRideHistory = useMemo(() => {
        return ridesHistory.filter(history => history.rideId === selectedRideId);
    }, [ridesHistory, selectedRideId]);

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
