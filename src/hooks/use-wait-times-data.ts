import { useState, useCallback, useEffect } from 'react';
import { WaitTimesResponse } from '@/lib/types';
import { useRefresh } from '@/hooks/use-refresh';

interface UseWaitTimesDataProps {
    initialData?: WaitTimesResponse | null;
    selectedRideId?: string;
}

// TODO: Fix the sorting of the history, it's getting messed up somewhere and is out of order
export function useWaitTimesData({ 
    initialData = null,
    selectedRideId
}: UseWaitTimesDataProps = {}) {
    const [data, setData] = useState<WaitTimesResponse | null>(initialData);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(!initialData);

    const fetchData = useCallback(async (rideId?: string) => {
        try {
            // Only set loading if we don't have any data yet
            setIsLoading(prev => !prev && !data);
            
            const url = rideId ? `/api/ride-wait-times?ride_id=${rideId}` : '/api/ride-wait-times';
            const response = await fetch(url, {
                method: 'GET',
                // No cache on explicit fetch — ensures page refresh always gets fresh data
                cache: 'no-store',
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
    }, [data]);

    // Polling function that doesn't set loading state and prevents duplicates
    const pollData = useCallback(async (rideId?: string) => {
        try {
            const url = rideId ? `/api/ride-wait-times?ride_id=${rideId}` : '/api/ride-wait-times';
            const response = await fetch(url, {
                method: 'GET',
                cache: 'default',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json() as WaitTimesResponse & { _cachedAt?: string; _fromCache?: boolean };

            console.log(`Polling data fetched - From cache: ${responseData._fromCache}, Cached at: ${responseData._cachedAt}`);
            console.log(`Live entries: ${responseData.liveWaitTime?.length || 0}, History entries: ${Object.keys(responseData.groupedRidesHistory || {}).length}`);

            // Smart merge to prevent duplicates and preserve existing data
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

    const hasData = !!data;
    useEffect(() => {
        // If we have a selected ride but no history for it (or only partial history from the overview),
        // fetch the full history for that specific ride.
        if (selectedRideId && data) {
            const hasHistory = data.groupedRidesHistory[selectedRideId] && data.groupedRidesHistory[selectedRideId].length > 10;
            if (!hasHistory) {
                console.log(`Fetching targeted history for selected ride: ${selectedRideId}`);
                fetchData(selectedRideId);
            }
        } else if (!hasData) {
            // Initial fetch if no data exists
            fetchData();
        }
    }, [fetchData, selectedRideId, hasData, data]);

    // Poll for updates at a regular interval
    // Since we no longer have Supabase realtime, polling is always enabled
    // Data collection happens every 3 minutes, so 90-second polling ensures
    // users see updates within one polling cycle of them being collected
    const REFRESH_INTERVAL = 90000; // 90 seconds
    useRefresh({
        interval: REFRESH_INTERVAL,
        refreshFn: () => pollData(),
        enabled: !!data // Only poll once we have initial data
    });

    return {
        data,
        error,
        isLoading,
        fetchData,
        refetch: fetchData,
    };
}
