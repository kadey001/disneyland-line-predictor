"use client"

import { useMemo } from "react";
import WaitTimesGrid from "@/components/wait-times-client";
import DisneyLoader from "@/components/disney-loader";
import { useWaitTimesData } from "@/hooks/use-wait-times-data";
import { buildRideList } from "@/lib/ride-list";
import { WaitTimesResponse } from "@/lib/types";

interface WaitTimesPageClientProps {
    initialData: WaitTimesResponse | null;
}

export default function WaitTimesPageClient({ initialData }: WaitTimesPageClientProps) {
    // Polls live wait times for all rides; no per-ride selection on the overview.
    const { data, error, isLoading } = useWaitTimesData({ initialData });

    const resolved = data ?? initialData;
    const rides = useMemo(() => buildRideList(resolved), [resolved]);

    if (error && !resolved) throw new Error(error);

    if ((isLoading || !resolved) && !initialData) return <DisneyLoader />;

    return <WaitTimesGrid rides={rides} />;
}
