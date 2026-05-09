import { getWaitTimesData } from '@/lib/api-server';
import WaitTimesPageClient from './WaitTimesPageClient';
import { Suspense } from 'react';
import DisneyLoader from '@/components/disney-loader';

export const revalidate = 30; // Revalidate the page every 30 seconds

export default async function WaitTimesPage() {
    // Fetch initial data on the server
    // This will fetch live data for all rides and 4 hours of history for all rides
    const initialData = await getWaitTimesData();

    return (
        <Suspense fallback={<DisneyLoader />}>
            <WaitTimesPageClient initialData={initialData} />
        </Suspense>
    );
}
