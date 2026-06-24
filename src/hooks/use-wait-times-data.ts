import { useState, useCallback, useEffect, useRef } from 'react';
import { WaitTimesResponse } from '@/lib/types';
import { useRefresh } from '@/hooks/use-refresh';

interface UseWaitTimesDataProps {
    initialData?: WaitTimesResponse | null;
    selectedRideId?: string;
}

function mergeWaitTimesData(prevData: WaitTimesResponse | null, newData: WaitTimesResponse): WaitTimesResponse {
    if (!prevData) return newData;

    // Merge live wait times - only update if new data is newer or missing
    const mergedLiveWaitTime = prevData.liveWaitTime?.map(existingRide => {
        const newRide = newData.liveWaitTime?.find(r => r.rideId === existingRide.rideId);
        if (newRide) {
            const existingTime = new Date(existingRide.lastUpdated).getTime();
            const newTime = new Date(newRide.lastUpdated).getTime();
            const timeDiff = Date.now() - existingTime;

            if (newTime > existingTime || timeDiff > 600000) {
                return {
                    ...newRide,
                    lastUpdated: newRide.lastUpdated
                };
            }
        }
        return existingRide;
    }) || newData.liveWaitTime?.map(ride => ({
        ...ride,
        lastUpdated: ride.lastUpdated
    })) || [];

    // Merge history data - append new points and deduplicate by snapshotTime
    const mergedHistory = { ...prevData.groupedRidesHistory };
    Object.keys(newData.groupedRidesHistory || {}).forEach(rideId => {
        const existingRideHistory = mergedHistory[rideId] || [];
        const newRideHistory = newData.groupedRidesHistory![rideId] || [];
        
        const historyMap = new Map();
        
        existingRideHistory.forEach(entry => {
            historyMap.set(entry.snapshotTime, entry);
        });
        
        newRideHistory.forEach(entry => {
            historyMap.set(entry.snapshotTime, {
                ...entry,
                snapshotTime: entry.snapshotTime
            });
        });
        
        mergedHistory[rideId] = Array.from(historyMap.values())
            .sort((a, b) => new Date(a.snapshotTime).getTime() - new Date(b.snapshotTime).getTime());
    });

    return {
        ...prevData,
        ...newData,
        liveWaitTime: mergedLiveWaitTime,
        groupedRidesHistory: mergedHistory
    };
}

export function useWaitTimesData({ 
    initialData = null,
    selectedRideId
}: UseWaitTimesDataProps = {}) {
    const [data, setData] = useState<WaitTimesResponse | null>(initialData);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(!initialData);
    const fetchedRides = useRef<Set<string>>(new Set());

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

            // Convert UTC timestamps to local timezone and ensure chronological sorting
            const convertedData: WaitTimesResponse = {
                ...responseData,
                liveWaitTime: responseData.liveWaitTime?.map(ride => ({
                    ...ride,
                    lastUpdated: ride.lastUpdated
                })),
                groupedRidesHistory: Object.keys(responseData.groupedRidesHistory || {}).reduce((acc, rId) => {
                    const sortedHistory = [...(responseData.groupedRidesHistory![rId] || [])]
                        .map(entry => ({
                            ...entry,
                            snapshotTime: entry.snapshotTime
                        }))
                        .sort((a, b) => new Date(a.snapshotTime).getTime() - new Date(b.snapshotTime).getTime());
                    
                    acc[rId] = sortedHistory;
                    return acc;
                }, {} as WaitTimesResponse['groupedRidesHistory'])
            };

            setData(prevData => mergeWaitTimesData(prevData, convertedData));
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

            setData(prevData => mergeWaitTimesData(prevData, responseData));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch ride data');
        }
    }, []);

    const hasData = !!data;
    useEffect(() => {
        // If we have a selected ride, make sure we have fetched its full 24h history.
        if (selectedRideId && data) {
            if (!fetchedRides.current.has(selectedRideId)) {
                console.log(`Fetching targeted history for selected ride: ${selectedRideId}`);
                fetchedRides.current.add(selectedRideId);
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
