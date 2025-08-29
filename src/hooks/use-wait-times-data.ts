import { useState, useCallback, useEffect } from 'react';
import { WaitTimesResponse } from '@/lib/types';
import { Database } from '@/lib/supabase';

type RideDataHistory = Database['public']['Tables']['ride_data_history']['Row'];

interface UseWaitTimesDataProps {
    onRealtimeUpdate?: (newRideData: RideDataHistory) => void;
}

export function useWaitTimesData({ onRealtimeUpdate }: UseWaitTimesDataProps = {}) {
    const [data, setData] = useState<WaitTimesResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (rideId?: string) => {
        try {
            setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleRealtimeUpdate = useCallback((newRideData: RideDataHistory) => {
        console.log('Real-time update received:', newRideData);

        setData(prevData => {
            if (!prevData) return prevData;

            // Update live wait time data
            const updatedLiveWaitTime = prevData.liveWaitTime?.map(ride => {
                if (ride.rideId === newRideData.ride_id) {
                    return {
                        ...ride,
                        waitTime: newRideData.standby_wait_time || 0,
                        status: newRideData.status,
                        lastUpdated: newRideData.last_updated
                    };
                }
                return ride;
            }) || [];

            // Update ride history if it exists
            const updatedHistory = { ...prevData.groupedRidesHistory };
            if (updatedHistory[newRideData.ride_id]) {
                updatedHistory[newRideData.ride_id] = [
                    {
                        waitTime: newRideData.standby_wait_time || 0,
                        snapshotTime: newRideData.last_updated
                    },
                    ...updatedHistory[newRideData.ride_id].slice(0, 49) // Keep last 50 entries
                ];
            }

            const newData = {
                ...prevData,
                liveWaitTime: updatedLiveWaitTime,
                groupedRidesHistory: updatedHistory
            };

            // Call external callback if provided
            onRealtimeUpdate?.(newRideData);

            return newData;
        });
    }, [onRealtimeUpdate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        error,
        isLoading,
        fetchData,
        refetch: fetchData,
        handleRealtimeUpdate
    };
}
