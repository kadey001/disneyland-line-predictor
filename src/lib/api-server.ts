import { WaitTimesResponse } from './types';
import { config } from './config';

/**
 * Fetches wait times data on the server side.
 * This is used for Server Components to provide initial data.
 */
export async function getWaitTimesData(rideId?: string, windowHours?: number): Promise<WaitTimesResponse | null> {
    const url = new URL(`${config.WAIT_TIMES_API_URL}/wait-times`);
    if (rideId) url.searchParams.set('ride_id', rideId);
    
    // Support limiting the initial history window to reduce payload size
    if (windowHours) {
        url.searchParams.set('window_hours', windowHours.toString());
    } else if (!rideId) {
        // Default to a smaller window for the "all rides" overview to keep it fast
        url.searchParams.set('window_hours', '4');
    }

    console.log('Server-side fetching wait times from:', url.toString());

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept-Encoding': 'gzip',
                'User-Agent': 'Disneyland-Line-Predictor/Server',
            },
            // Revalidate every 30 seconds on the server
            next: { revalidate: 30 }
        });

        if (!response.ok) {
            console.error(`Server-side fetch failed with status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data as WaitTimesResponse;
    } catch (error) {
        console.error('Server-side fetch error:', error);
        return null;
    }
}
