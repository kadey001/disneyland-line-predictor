"use client"
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
    const [selectedRideId, setSelectedRideId] = useLocalStorage<string>('selectedRideId', IMPORTANT_DISNEYLAND_RIDES[0].id);
    const [timeFilter, setTimeFilter] = useLocalStorage<TimeFilter>('timeFilter', 'full-day');

    // Fetch wait times data with automatic polling (every 90 seconds)
    // On page refresh, fetchData uses cache: 'no-store' to always get the latest data
    const { data, error, isLoading } = useWaitTimesData({
        initialData,
        selectedRideId // Pass selectedRideId to trigger targeted fetching
    });

    if (error && !data) throw new Error(error);

    if ((isLoading || !data) && !initialData) return <DisneyLoader />;

    return (
        <div className="h-[100%] w-[100%]">
            <WaitTimesClient 
                data={data || initialData!} 
                selectedRideId={selectedRideId}
                setSelectedRideId={setSelectedRideId}
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
            />
        </div>
    );
}
