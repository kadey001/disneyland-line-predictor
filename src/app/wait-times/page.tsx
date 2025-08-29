"use client"

import { useState } from 'react';
import { WaitTimesResponse } from '@/lib/types';
import WaitTimesClient from "@/components/wait-times-client";
import DisneyLoader from '@/components/disney-loader';
import { useRefresh } from '@/hooks/use-refresh';

export default function WaitTimesPage() {
    const [data, setData] = useState<WaitTimesResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (rideId?: string) => {
        try {
            const url = rideId ? `/api/ride-wait-times?ride_id=${rideId}` : '/api/ride-wait-times';
            const response = await fetch(url, {
                method: 'GET',
                cache: 'default',
                next: { revalidate: 20 } // Revalidate every 20 seconds
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json() as WaitTimesResponse & { _cachedAt?: string; _fromCache?: boolean };

            console.log(`Data fetched - From cache: ${responseData._fromCache}, Cached at: ${responseData._cachedAt}`);
            console.log(`Live entries: ${responseData.liveWaitTime?.length || 0}, History entries: ${Object.keys(responseData.groupedRidesHistory || {}).length}`);

            setData(responseData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch ride data');
        }
    };

    const REFRESH_INTERVAL = 30000; // 30 seconds
    useRefresh({
        interval: REFRESH_INTERVAL,
        refreshFn: fetchData
    });

    if (error) throw new Error(error);

    if (!data) return <DisneyLoader />;

    return <WaitTimesClient data={data} />;
}
