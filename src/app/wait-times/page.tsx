"use client"

import WaitTimesClient from "@/components/wait-times-client";
import DisneyLoader from '@/components/disney-loader';
import { useRealtimeRideUpdates } from '@/hooks/use-realtime-ride-updates';
import { useWaitTimesData } from '@/hooks/use-wait-times-data';
import StatusIndicator from '@/components/ui/status-indicator';

export default function WaitTimesPage() {
    const { data, error, isLoading, handleRealtimeUpdate } = useWaitTimesData();

    // Set up real-time subscription for ALL parks (no parkId needed)
    const { isConnected: isRealtimeConnected } = useRealtimeRideUpdates({
        onRideUpdate: handleRealtimeUpdate,
        enabled: !!data // Only enable after initial data load
    });

    // const REFRESH_INTERVAL = 30000; // 30 seconds (fallback polling)
    // useRefresh({
    //     interval: REFRESH_INTERVAL,
    //     refreshFn: fetchData
    // });

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
