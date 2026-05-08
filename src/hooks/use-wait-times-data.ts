import { useState, useCallback, useEffect } from 'react';
import { WaitTimesResponse } from '@/lib/types';
import { Database } from '@/lib/supabase';
import { useRefresh } from '@/hooks/use-refresh';

type RideDataHistory = Database['public']['Tables']['ride_data_history']['Row'];

interface UseWaitTimesDataProps {
    onRealtimeUpdate?: (newRideData: RideDataHistory) => void;
    isRealtimeConnected?: boolean;
}

// TODO: Fix the sorting of the history, it's getting messed up somewhere and is out of order
export function useWaitTimesData({ onRealtimeUpdate, isRealtimeConnected = true }: UseWaitTimesDataProps = {}) {
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

            // Convert UTC timestamps to local timezone for initial data load
            const convertedData: WaitTimesResponse = {
                ...responseData,
                liveWaitTime: responseData.liveWaitTime?.map(ride => ({
                    ...ride,
                    lastUpdated: ride.lastUpdated
                })),
                groupedRidesHistory: Object.keys(responseData.groupedRidesHistory || {}).reduce((acc, rideId) => {
                    acc[rideId] = responseData.groupedRidesHistory![rideId].map(entry => ({
                        ...entry,
                        snapshotTime: entry.snapshotTime
                    }));
                    return acc;
                }, {} as WaitTimesResponse['groupedRidesHistory'])
            };

            setData(convertedData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch ride data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Polling function that doesn't set loading state and prevents duplicates
    const pollData = useCallback(async (rideId?: string) => {
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

            console.log(`Polling data fetched - From cache: ${responseData._fromCache}, Cached at: ${responseData._cachedAt}`);
            console.log(`Live entries: ${responseData.liveWaitTime?.length || 0}, History entries: ${Object.keys(responseData.groupedRidesHistory || {}).length}`);

            // Smart merge to prevent duplicates and preserve real-time updates
            setData(prevData => {
                if (!prevData) return responseData;

                // Merge live wait times - only update if polled data is newer or missing
                const mergedLiveWaitTime = prevData.liveWaitTime?.map(existingRide => {
                    const polledRide = responseData.liveWaitTime?.find(r => r.rideId === existingRide.rideId);
                    if (polledRide) {
                        // Compare timestamps - use polled data if it's newer or if existing data is old
                        const existingTime = new Date(existingRide.lastUpdated).getTime();
                        const polledTime = new Date(polledRide.lastUpdated).getTime();
                        const timeDiff = Date.now() - existingTime;

                        // Update if polled data is newer OR existing data is more than 10 minutes old
                        if (polledTime > existingTime || timeDiff > 600000) {
                            return {
                                ...polledRide,
                                lastUpdated: polledRide.lastUpdated
                            };
                        }
                    }
                    return existingRide;
                }) || responseData.liveWaitTime?.map(ride => ({
                    ...ride,
                    lastUpdated: ride.lastUpdated
                })) || [];

                // For history data, be conservative - only update if we have no history for a ride
                const mergedHistory = { ...prevData.groupedRidesHistory };
                Object.keys(responseData.groupedRidesHistory || {}).forEach(rideId => {
                    if (!mergedHistory[rideId] || mergedHistory[rideId].length === 0) {
                        // Only add history if we don't have any for this ride, and convert timestamps
                        mergedHistory[rideId] = responseData.groupedRidesHistory![rideId].map(entry => {
                            return {
                                ...entry,
                                snapshotTime: entry.snapshotTime
                            };
                        });
                    }
                });

                return {
                    ...prevData,
                    liveWaitTime: mergedLiveWaitTime,
                    groupedRidesHistory: mergedHistory
                };
            });

            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch ride data');
        }
    }, []);

    const handleRealtimeUpdate = useCallback((newRideData: RideDataHistory) => {
        setData(prevData => {
            if (!prevData) return prevData;

            // TODO: Revist this
            // Temporary fix for missing TZ info on ISO string from update data
            // Works since we know for sure that this data is already UTC
            // eg. 2025-08-30T01:59:43 -> 2025-08-30T01:59:43.000Z
            // Ensure timestamp is a full ISO string with milliseconds and Z
            const formattedTimestamp = newRideData.last_updated && newRideData.last_updated.includes('.')
                ? newRideData.last_updated
                : newRideData.last_updated
                    ? `${newRideData.last_updated}.000Z`
                    : new Date().toISOString();
            // console.log('Formatted timestamp:', formattedTimestamp);

            // Update live wait time data
            const updatedLiveWaitTime = prevData.liveWaitTime?.map(ride => {
                if (ride.rideId === newRideData.ride_id) {
                    return {
                        ...ride,
                        waitTime: newRideData.standby_wait_time || 0,
                        status: newRideData.status,
                        lastUpdated: formattedTimestamp
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
                        snapshotTime: formattedTimestamp
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

    // Polling as backup mechanism - only starts when live connection fails
    const REFRESH_INTERVAL = 300000; // 5 minutes (fallback polling)
    useRefresh({
        interval: REFRESH_INTERVAL,
        refreshFn: () => pollData(), // Use pollData to avoid loading state
        enabled: !!data && !isRealtimeConnected // Only enable polling when live connection fails
    });

    return {
        data,
        error,
        isLoading,
        fetchData,
        refetch: fetchData,
        handleRealtimeUpdate
    };
}
