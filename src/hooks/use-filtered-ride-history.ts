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
        // Sort by snapshotTime (UTC string) in ascending order (oldest first)
        return filtered.sort((a, b) => new Date(a.snapshotTime).getTime() - new Date(b.snapshotTime).getTime());
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

        return selectedRideHistory.filter(item => new Date(item.snapshotTime) >= cutoffTime)
            .sort((a, b) => new Date(a.snapshotTime).getTime() - new Date(b.snapshotTime).getTime());
    }, [selectedRideHistory, timeFilter]);

    return { filteredRidesHistory };
}
