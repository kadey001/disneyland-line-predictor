import { NextRequest, NextResponse } from 'next/server';
import { TTLCache } from '@/lib/ttl-cache';
import { WaitTimesResponse } from '@/lib/types';

const TTL_CACHE_DURATION = 60 * 1000; // 60 seconds
const cache = new TTLCache<WaitTimesResponse>(TTL_CACHE_DURATION);

export async function GET(request: NextRequest) {
    const urlObj = new URL(request.url);
    const rideId = urlObj.searchParams.get('ride_id');
    const windowHours = urlObj.searchParams.get('window_hours');
    
    const cacheKey = `ride-wait-times-${rideId || 'all'}-${windowHours || 'default'}`;
    const now = Date.now();

    console.log(`Received request for ride wait times: ${cacheKey}`);
    const url = process.env.WAIT_TIMES_API_URL;

    if (!url) {
        console.error('WAIT_TIMES_API_URL environment variable is not set');
        return NextResponse.json({
            error: 'API URL not configured',
            details: 'WAIT_TIMES_API_URL environment variable is missing'
        }, { status: 500 });
    }

    // Check for cache stats request
    if (urlObj.searchParams.get('stats') === 'true') {
        const stats = cache.stats();
        return NextResponse.json({
            cache: stats,
            ttl: TTL_CACHE_DURATION,
        });
    }

    // Check in-memory cache first (fastest, survives for warm instances)
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry) {
        console.log('Returning from in-memory cache');
        return NextResponse.json({
            ...cachedEntry.data,
            _cachedAt: new Date(cachedEntry.timestamp).toISOString(),
            _fromCache: true,
            _cacheSource: 'memory'
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
                'X-Data-Source': 'memory-cache',
            },
        });
    }

    try {
        const apiUrl = new URL(`${url}/wait-times`);
        if (rideId) apiUrl.searchParams.set('ride_id', rideId);
        if (windowHours) apiUrl.searchParams.set('window_hours', windowHours);

        console.log(`Fetching from external API: ${apiUrl.toString()} (Method: GET)`);

        // Add timeout for Vercel serverless functions
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        // Try GET first (preferred for caching)
        let response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Accept-Encoding': 'gzip',
                'User-Agent': 'Disneyland-Line-Predictor/1.0',
            },
            next: { revalidate: 30 },
            signal: controller.signal,
        });

        // Fallback to POST if GET is not allowed (handles older service versions)
        if (response.status === 405) {
            console.warn(`External API returned 405 for GET, falling back to POST: ${apiUrl.toString()}`);
            response = await fetch(apiUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'User-Agent': 'Disneyland-Line-Predictor/1.0',
                },
                // POST requests are not cached by Next.js Data Cache by default
                cache: 'no-store',
                signal: controller.signal,
            });
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`External API error: ${response.status} ${response.statusText} for ${apiUrl.toString()}`);
            throw new Error(`External API returned ${response.status}: ${response.statusText}`);
        }

        const data: WaitTimesResponse = await response.json();
        
        // Cache in memory for this instance
        cache.set(cacheKey, data);

        const responseData = {
            ...data,
            _cachedAt: new Date(now).toISOString(),
            _fromCache: false,
        };

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
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
