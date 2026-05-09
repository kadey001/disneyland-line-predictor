"use client"
import WaitTimesClient from "@/components/wait-times-client";
import DisneyLoader from '@/components/disney-loader';
import { useRealtimeRideUpdates } from '@/hooks/use-realtime-ride-updates';
import { useWaitTimesData } from '@/hooks/use-wait-times-data';
import StatusIndicator from '@/components/ui/status-indicator';
import { WaitTimesResponse } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { IMPORTANT_DISNEYLAND_RIDES } from "@/lib/rides";
import { TimeFilter } from "@/components/time-filter-selector";

interface WaitTimesPageClientProps {
    initialData: WaitTimesResponse | null;
}

export default function WaitTimesPageClient({ initialData }: WaitTimesPageClientProps) {
    const [selectedRideId, setSelectedRideId] = useLocalStorage<string>('selectedRideId', IMPORTANT_DISNEYLAND_RIDES[0].id);
    const [timeFilter, setTimeFilter] = useLocalStorage<TimeFilter>('timeFilter', 'full-day');

    // First get the real-time connection status
    const { isConnected: isRealtimeConnected } = useRealtimeRideUpdates({
        enabled: true // Always enabled to monitor connection
    });

    // Then use the data hook with connection status for conditional polling
    const { data, error, isLoading, handleRealtimeUpdate } = useWaitTimesData({
        isRealtimeConnected,
        initialData,
        selectedRideId // Pass selectedRideId to trigger targeted fetching
    });

    // Set up real-time subscription with the update handler
    useRealtimeRideUpdates({
        onRideUpdate: handleRealtimeUpdate,
        enabled: !!data // Only enable after initial data load
    });

    if (error && !data) throw new Error(error);

    if ((isLoading || !data) && !initialData) return <DisneyLoader />;

    return (
        <div className="h-[100%] w-[100%]">
            <StatusIndicator isConnected={isRealtimeConnected} />
            <WaitTimesClient 
                data={data || initialData!} 
                selectedRideId={selectedRideId}
                setSelectedRideId={setSelectedRideId}
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
            />
        </div>
    );
}

