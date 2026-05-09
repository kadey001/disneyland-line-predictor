"use client"

import { useState, useEffect } from 'react';
import { WaitTimesResponse } from '@/lib/types';
import WaitTimesClient from "@/components/wait-times-client";
import DisneyLoader from '@/components/disney-loader';
import { useLocalStorage } from "@/hooks/use-local-storage";
import { IMPORTANT_DISNEYLAND_RIDES } from "@/lib/rides";
import { TimeFilter } from "@/components/time-filter-selector";

export default function TestPage() {
    const [data, setData] = useState<WaitTimesResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedRideId, setSelectedRideId] = useLocalStorage<string>('selectedRideId', IMPORTANT_DISNEYLAND_RIDES[0].id);
    const [timeFilter, setTimeFilter] = useLocalStorage<TimeFilter>('timeFilter', 'full-day');

    const fetchData = async (rideId?: string) => {
        try {
            const url = rideId ? `/api/ride-wait-times?ride_id=${rideId}` : '/api/ride-wait-times';
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-cache',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json() as WaitTimesResponse & { _cachedAt?: string; _fromCache?: boolean };
            console.log(responseData.groupedRidesHistory);

            console.log(`Data fetched - From cache: ${responseData._fromCache}, Cached at: ${responseData._cachedAt}`);
            console.log(`Live entries: ${responseData.liveWaitTime?.length || 0}, History entries: ${Object.keys(responseData.groupedRidesHistory || {}).length}`);

            setData(responseData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();

        // Set up polling every minute (60,000 milliseconds)
        const interval = setInterval(() => {
            fetchData();
        }, 60000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    if (error) return (
        <div>
            <h1>Test Page</h1>
            <p>Error: {error}</p>
        </div>
    );

    if (!data) return (
        <div>
            <DisneyLoader />
        </div>
    );

    return <WaitTimesClient 
        data={data} 
        selectedRideId={selectedRideId}
        setSelectedRideId={setSelectedRideId}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
    />;
}
