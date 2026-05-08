import { useMemo } from "react";
import type { GroupedRidesHistory } from "@/lib/types";
import type { TimeFilter } from "@/components/time-filter-selector";

interface UseFilteredRideHistory {
    ridesHistory: GroupedRidesHistory;
    timeFilter: TimeFilter;
    selectedRideId: string | null;
}

export function useFilteredRideHistory({
    ridesHistory,
    timeFilter,
    selectedRideId
}: UseFilteredRideHistory) {
    const selectedRideHistory = useMemo(() => {
        if (!selectedRideId) return [];
        const filtered = ridesHistory[selectedRideId] || [];
        // Sort by snapshotTime (equivalent to lastUpdated for history entries) in ascending order (oldest first)
        // Ensure we handle invalid dates gracefully
        return filtered
            .filter(item => item.snapshotTime && !isNaN(new Date(item.snapshotTime).getTime()))
            .sort((a, b) => {
                const timeA = new Date(a.snapshotTime).getTime();
                const timeB = new Date(b.snapshotTime).getTime();
                return timeA - timeB; // Ascending order: oldest first, newest last
            });
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

        return selectedRideHistory
            .filter(item => {
                const itemTime = new Date(item.snapshotTime);
                return !isNaN(itemTime.getTime()) && itemTime >= cutoffTime;
            })
            .sort((a, b) => {
                const timeA = new Date(a.snapshotTime).getTime();
                const timeB = new Date(b.snapshotTime).getTime();
                return timeA - timeB; // Ensure ascending order is maintained
            });
    }, [selectedRideHistory, timeFilter]);

    return { filteredRidesHistory };
}
