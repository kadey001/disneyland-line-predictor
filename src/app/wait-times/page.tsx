"use client"

import WaitTimesClient from "@/components/wait-times-client";
import DisneyLoader from '@/components/disney-loader';
import { useRealtimeRideUpdates } from '@/hooks/use-realtime-ride-updates';
import { useWaitTimesData } from '@/hooks/use-wait-times-data';
import StatusIndicator from '@/components/ui/status-indicator';

export default function WaitTimesPage() {
    // First get the real-time connection status
    const { isConnected: isRealtimeConnected } = useRealtimeRideUpdates({
        enabled: true // Always enabled to monitor connection
    });

    // Then use the data hook with connection status for conditional polling
    const { data, error, isLoading, handleRealtimeUpdate } = useWaitTimesData({
        isRealtimeConnected
    });

    // Set up real-time subscription with the update handler
    useRealtimeRideUpdates({
        onRideUpdate: handleRealtimeUpdate,
        enabled: !!data // Only enable after initial data load
    });

    if (error) throw new Error(error);

    if (isLoading || !data) return <DisneyLoader />;

    return (
        <div className="h-[100%] w-[100%]">
            {/* Optional: Show real-time connection status */}
            <StatusIndicator isConnected={isRealtimeConnected} />
            <WaitTimesClient data={data} />
        </div>
    );
}
