import { useState, useCallback, useEffect, useRef } from 'react';
import { WaitTimesResponse, LiveWaitTimeEntry } from '@/lib/types';
import { useRefresh } from '@/hooks/use-refresh';

// Server-injected metadata fields that should not be merged into client state
type ResponseMeta = { _cachedAt?: string; _fromCache?: boolean; _cacheSource?: string };
type RawWaitTimesResponse = WaitTimesResponse & ResponseMeta;

/**
 * Strips server-injected cache metadata and returns a clean, history-sorted
 * WaitTimesResponse. Used by both the explicit fetch and the poll paths so the
 * two stay in sync and `_fromCache`/`_cachedAt` never leak into app state.
 */
function normalizeResponse(raw: RawWaitTimesResponse): WaitTimesResponse {
    const { _cachedAt, _fromCache, _cacheSource, ...data } = raw;
    void _cachedAt; void _fromCache; void _cacheSource;

    const sortedHistory = Object.keys(data.groupedRidesHistory || {}).reduce((acc, rId) => {
        acc[rId] = [...(data.groupedRidesHistory![rId] || [])]
            .sort((a, b) => new Date(a.snapshotTime).getTime() - new Date(b.snapshotTime).getTime());
        return acc;
    }, {} as WaitTimesResponse['groupedRidesHistory']);

    return {
        ...data,
        liveWaitTime: data.liveWaitTime ?? [],
        groupedRidesHistory: sortedHistory,
    };
}

interface UseWaitTimesDataProps {
    initialData?: WaitTimesResponse | null;
    selectedRideId?: string;
}

function mergeWaitTimesData(prevData: WaitTimesResponse | null, newData: WaitTimesResponse): WaitTimesResponse {
    if (!prevData) return newData;

    // Merge live wait times by rideId over the UNION of both lists. Mapping only
    // over prevData would silently drop rides that first appear in newData (e.g.
    // a ride that opens mid-session). Update an existing ride when the new entry
    // is newer, or when the existing one has gone stale (>10 min old).
    const STALE_MS = 10 * 60 * 1000;
    const liveById = new Map<string, LiveWaitTimeEntry>();
    (prevData.liveWaitTime ?? []).forEach(ride => liveById.set(ride.rideId, ride));
    (newData.liveWaitTime ?? []).forEach(newRide => {
        const existing = liveById.get(newRide.rideId);
        if (!existing) {
            liveById.set(newRide.rideId, newRide);
            return;
        }
        const existingTime = new Date(existing.lastUpdated).getTime();
        const newTime = new Date(newRide.lastUpdated).getTime();
        const existingIsStale = Date.now() - existingTime > STALE_MS;
        if (newTime > existingTime || existingIsStale) {
            liveById.set(newRide.rideId, newRide);
        }
    });
    const mergedLiveWaitTime = Array.from(liveById.values());

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
    // Tracks whether we've ever held data, without forcing fetchData to depend on
    // the `data` state (which would recreate the callback on every poll).
    const hasEverHadData = useRef<boolean>(!!initialData);

    const fetchData = useCallback(async (rideId?: string) => {
        try {
            // Only show the full-screen loading state before we have any data.
            if (!hasEverHadData.current) setIsLoading(true);

            const url = rideId ? `/api/ride-wait-times?ride_id=${rideId}` : '/api/ride-wait-times';
            const response = await fetch(url, {
                method: 'GET',
                // No cache on explicit fetch — ensures page refresh always gets fresh data
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json() as RawWaitTimesResponse;
            const convertedData = normalizeResponse(responseData);

            setData(prevData => mergeWaitTimesData(prevData, convertedData));
            hasEverHadData.current = true;
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
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json() as RawWaitTimesResponse;
            const convertedData = normalizeResponse(responseData);

            setData(prevData => mergeWaitTimesData(prevData, convertedData));
            hasEverHadData.current = true;
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch ride data');
        }
    }, []);

    const hasData = !!data;
    useEffect(() => {
        // If we have a selected ride, make sure we have fetched its full 24h history.
        if (selectedRideId && hasData) {
            if (!fetchedRides.current.has(selectedRideId)) {
                fetchedRides.current.add(selectedRideId);
                fetchData(selectedRideId);
            }
        } else if (!hasData) {
            // Initial fetch if no data exists
            fetchData();
        }
    }, [fetchData, selectedRideId, hasData]);

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
