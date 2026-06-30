import { getWaitTimesData } from '@/lib/api-server';
import WaitTimesPageClient from './WaitTimesPageClient';

export const revalidate = 30; // Revalidate the page every 30 seconds

export default async function WaitTimesPage() {
    // Fetch initial data on the server: live data for all rides + recent history.
    const initialData = await getWaitTimesData();

    // The route's layout already provides a Suspense boundary with the loader.
    return <WaitTimesPageClient initialData={initialData} />;
}
