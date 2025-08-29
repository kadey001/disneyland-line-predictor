import { NextRequest, NextResponse } from 'next/server';
import { TTLCache } from '@/lib/ttl-cache';
import { WaitTimesResponse } from '@/lib/types';

const TTL_CACHE_DURATION = 30 * 1000; // 30 seconds
const cache = new TTLCache<WaitTimesResponse>(TTL_CACHE_DURATION);

export async function GET(request: NextRequest) {
    cache.stats();
    console.log('Received request for ride wait times');
    const url = process.env.WAIT_TIMES_API_URL;
    if (!url) {
        return NextResponse.json({ error: 'API URL not configured' }, { status: 500 });
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

        const response = await fetch(apiUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip',
            },
            cache: 'no-cache',
        });
        const data: WaitTimesResponse = await response.json();

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
    } catch {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
