import { NextRequest, NextResponse } from 'next/server';
import { TTLCache } from '@/lib/ttl-cache';
import { WaitTimesResponse } from '@/lib/types';

// Single source of truth for freshness: the in-memory TTL, the upstream fetch
// revalidate window, and the CDN/browser Cache-Control max-age all use this.
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const CACHE_MAX_AGE_S = 60;
const FETCH_TIMEOUT_MS = 25000; // Stay under the 30s serverless function limit
const cache = new TTLCache<WaitTimesResponse>(CACHE_TTL_MS);

// Verbose request logging is opt-in to avoid noise/cost in production.
const DEBUG = process.env.DEBUG_WAIT_TIMES === 'true';
const debugLog = (...args: unknown[]) => { if (DEBUG) console.log(...args); };

/** Fetch with a per-attempt timeout so a GET→POST fallback gets a fresh budget. */
async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

// Lightweight in-memory rate limit (per warm instance) to deter abuse of this
// public proxy endpoint. Not a substitute for an edge/WAF limiter, but enough to
// blunt casual scraping. Fixed window per client IP.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60; // requests per IP per window
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    return forwarded?.split(',')[0]?.trim() || 'unknown';
}

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const bucket = rateBuckets.get(ip);

    if (!bucket || now > bucket.resetAt) {
        rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        // Opportunistically prune expired buckets so the map can't grow forever.
        if (rateBuckets.size > 5000) {
            for (const [key, value] of rateBuckets) {
                if (now > value.resetAt) rateBuckets.delete(key);
            }
        }
        return false;
    }

    bucket.count += 1;
    return bucket.count > RATE_LIMIT_MAX;
}

export async function GET(request: NextRequest) {
    if (isRateLimited(getClientIp(request))) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1000) } }
        );
    }

    const urlObj = new URL(request.url);
    const rideId = urlObj.searchParams.get('ride_id');
    const windowHours = urlObj.searchParams.get('window_hours');

    const cacheKey = `ride-wait-times-${rideId || 'all'}-${windowHours || 'default'}`;

    debugLog(`Received request for ride wait times: ${cacheKey}`);
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
            ttl: CACHE_TTL_MS,
        });
    }

    // Check in-memory cache first (fastest, survives for warm instances)
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry) {
        debugLog('Returning from in-memory cache');
        return NextResponse.json({
            ...cachedEntry.data,
            _cachedAt: new Date(cachedEntry.timestamp).toISOString(),
            _fromCache: true,
            _cacheSource: 'memory'
        }, {
            status: 200,
            headers: {
                'Cache-Control': `public, max-age=${CACHE_MAX_AGE_S}, s-maxage=${CACHE_MAX_AGE_S}, stale-while-revalidate=30`,
                'X-Data-Source': 'memory-cache',
            },
        });
    }

    try {
        const apiUrl = new URL(`${url}/wait-times`);
        if (rideId) apiUrl.searchParams.set('ride_id', rideId);
        if (windowHours) apiUrl.searchParams.set('window_hours', windowHours);

        debugLog(`Fetching from external API: ${apiUrl.toString()} (Method: GET)`);

        // Try GET first (preferred for caching)
        let response = await fetchWithTimeout(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Accept-Encoding': 'gzip',
                'User-Agent': 'Disneyland-Line-Predictor/1.0',
            },
            next: { revalidate: CACHE_MAX_AGE_S },
        }, FETCH_TIMEOUT_MS);

        // Fallback to POST if GET is not allowed (handles older service versions).
        // Uses its own fresh timeout budget rather than the GET's.
        if (response.status === 405) {
            console.warn(`External API returned 405 for GET, falling back to POST: ${apiUrl.toString()}`);
            response = await fetchWithTimeout(apiUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'User-Agent': 'Disneyland-Line-Predictor/1.0',
                },
                // POST requests are not cached by Next.js Data Cache by default
                cache: 'no-store',
            }, FETCH_TIMEOUT_MS);
        }

        if (!response.ok) {
            console.error(`External API error: ${response.status} ${response.statusText} for ${apiUrl.toString()}`);
            throw new Error(`External API returned ${response.status}: ${response.statusText}`);
        }

        const data: WaitTimesResponse = await response.json();

        // Cache in memory for this instance
        cache.set(cacheKey, data);

        // Stamp when the data was actually fetched (not request-start, which could
        // be ~25s earlier on a slow upstream).
        const fetchedAt = Date.now();
        const responseData = {
            ...data,
            _cachedAt: new Date(fetchedAt).toISOString(),
            _fromCache: false,
        };

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                'Cache-Control': `public, max-age=${CACHE_MAX_AGE_S}, s-maxage=${CACHE_MAX_AGE_S}, stale-while-revalidate=30`,
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
