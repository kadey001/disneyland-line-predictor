import { NextRequest, NextResponse } from 'next/server';
import { TTLCache } from '@/lib/ttl-cache';
import { WaitTimesResponse } from '@/lib/types';

const TTL_CACHE_DURATION = 30 * 1000; // 30 seconds
const cache = new TTLCache<WaitTimesResponse>(TTL_CACHE_DURATION);

export async function GET(request: NextRequest) {
    cache.stats();
    console.log('Received request for ride wait times');
    const url = process.env.WAIT_TIMES_API_URL;
    console.log('WAIT_TIMES_API_URL:', url);

    if (!url) {
        console.error('WAIT_TIMES_API_URL environment variable is not set');
        return NextResponse.json({
            error: 'API URL not configured',
            details: 'WAIT_TIMES_API_URL environment variable is missing'
        }, { status: 500 });
    }

    // Check for cache stats request
    const urlObj = new URL(request.url);
    if (urlObj.searchParams.get('stats') === 'true') {
        const stats = cache.stats();
        return NextResponse.json({
            cache: stats,
            ttl: TTL_CACHE_DURATION,
            ttlFormatted: '45 seconds'
        });
    }

    // Check for ride_id filter
    const rideId = urlObj.searchParams.get('ride_id');
    const cacheKey = rideId ? `ride-wait-times-${rideId}` : 'ride-wait-times';
    const now = Date.now();

    if (rideId) {
        console.log(`Filtering by ride_id: ${rideId}`);
    }

    // Check cache first - TTLCache handles expiration internally
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry) {
        console.log('Returning cached data');
        const responseData = {
            ...cachedEntry.data,
            _cachedAt: new Date(cachedEntry.timestamp).toISOString(),
            _fromCache: true,
        };
        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=45, s-maxage=45, stale-while-revalidate=15',
                'X-Data-Source': 'cache',
            },
        });
    }

    console.log('Cache miss or expired, forwarding request to:', url);

    try {
        const apiUrl = new URL(`${url}/wait-times`);
        if (rideId) {
            apiUrl.searchParams.set('ride_id', rideId);
        }

        console.log('Making request to:', apiUrl.toString());

        // Add timeout for Vercel serverless functions
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

        const response = await fetch(apiUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip',
                'User-Agent': 'Disneyland-Line-Predictor/1.0',
            },
            cache: 'no-cache',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('External API response status:', response.status);

        if (!response.ok) {
            throw new Error(`External API returned ${response.status}: ${response.statusText}`);
        }

        const data: WaitTimesResponse = await response.json();
        console.log('Successfully received data from external API');

        // Cache the response
        cache.set(cacheKey, data);

        // Return structured response
        const responseData = {
            ...data,
            _cachedAt: new Date(now).toISOString(),
            _fromCache: false,
        };

        return NextResponse.json(responseData, {
            status: response.status,
            headers: {
                'Cache-Control': 'public, max-age=45, s-maxage=45, stale-while-revalidate=15',
                'X-Data-Source': 'api',
            },
        });
    } catch (error) {
        console.error('API fetch error:', error);

        let errorMessage = 'Failed to fetch data';
        let statusCode = 500;

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorMessage = 'Request timeout - external API took too long to respond';
                statusCode = 504;
            } else if (error.message.includes('fetch')) {
                errorMessage = 'Network error - unable to connect to external API';
                statusCode = 502;
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined,
            timestamp: new Date().toISOString(),
            apiUrl: process.env.NODE_ENV === 'development' ? url : undefined
        }, { status: statusCode });
    }
}
