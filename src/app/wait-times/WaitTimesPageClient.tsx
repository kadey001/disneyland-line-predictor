"use client"
import { useEffect, useMemo } from "react";
import WaitTimesClient from "@/components/wait-times-client";
import DisneyLoader from '@/components/disney-loader';
import { useWaitTimesData } from '@/hooks/use-wait-times-data';
import { WaitTimesResponse } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { IMPORTANT_DISNEYLAND_RIDES } from "@/lib/rides";
import { TimeFilter } from "@/components/time-filter-selector";

interface WaitTimesPageClientProps {
    initialData: WaitTimesResponse | null;
}

export default function WaitTimesPageClient({ initialData }: WaitTimesPageClientProps) {
    const [selectedRideId, setSelectedRideId, rideIdHydrated] = useLocalStorage<string>('selectedRideId', IMPORTANT_DISNEYLAND_RIDES[0].id);
    const [timeFilter, setTimeFilter, timeFilterHydrated] = useLocalStorage<TimeFilter>('timeFilter', 'full-day');

    // Fetch wait times data with automatic polling (every 90 seconds)
    // On page refresh, fetchData uses cache: 'no-store' to always get the latest data
    const { data, error, isLoading } = useWaitTimesData({
        initialData,
        selectedRideId // Pass selectedRideId to trigger targeted fetching
    });

    const resolved = data ?? initialData;

    // Every ride id present in the current atlas.
    const atlasRideIds = useMemo(() => {
        const ids = new Set<string>();
        (resolved?.attractionAtlas ?? []).forEach(park =>
            park.rides.forEach(ride => ids.add(ride.rideId))
        );
        return ids;
    }, [resolved]);

    const firstAtlasRideId = resolved?.attractionAtlas?.[0]?.rides?.[0]?.rideId;

    // If the stored ride id isn't in the atlas (stale localStorage, or a ride that
    // no longer exists), persist a fallback to the first available ride.
    useEffect(() => {
        // Wait until the persisted ride id has been read from localStorage. Otherwise
        // this runs with the default on the first render and clobbers a valid stored
        // selection (writing the fallback id back to localStorage).
        if (!rideIdHydrated) return;
        if (atlasRideIds.size === 0 || atlasRideIds.has(selectedRideId)) return;
        if (firstAtlasRideId) setSelectedRideId(firstAtlasRideId);
        // setSelectedRideId is a non-memoized setter; omit it to avoid re-running every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rideIdHydrated, atlasRideIds, selectedRideId, firstAtlasRideId]);

    if (error && !data) throw new Error(error);

    // Hold the loader until persisted prefs (ride + time window) are read from
    // localStorage, so the chart never paints the default window then snaps to
    // the stored one. Server and client first-render both show the loader, so
    // there's no hydration mismatch.
    const settingsHydrated = rideIdHydrated && timeFilterHydrated;

    if (((isLoading || !data) && !initialData) || !settingsHydrated) return <DisneyLoader />;

    // Render with a valid id even before the effect above persists the correction.
    const effectiveRideId = atlasRideIds.size === 0 || atlasRideIds.has(selectedRideId)
        ? selectedRideId
        : (firstAtlasRideId ?? selectedRideId);

    return (
        <div className="h-[100%] w-[100%]">
            <WaitTimesClient
                data={data || initialData!}
                selectedRideId={effectiveRideId}
                setSelectedRideId={setSelectedRideId}
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
            />
        </div>
    );
}
