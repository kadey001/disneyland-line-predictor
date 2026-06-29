import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS handling for the public /api/* routes.
 *
 * Replaces the previous wildcard (`Access-Control-Allow-Origin: *`) in
 * vercel.json with an env-driven allowlist so the endpoints can't be used as an
 * open cross-origin proxy. The app itself calls these routes same-origin, so
 * normal usage never needs CORS — this only governs third-party browsers.
 *
 * Set ALLOWED_ORIGINS to a comma-separated list of origins in production, e.g.
 *   ALLOWED_ORIGINS="https://disneyland-line-predictor.vercel.app"
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

function buildCorsHeaders(origin: string | null): Headers {
    const headers = new Headers({
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Caches must key on Origin since the allowed value varies per request.
        Vary: 'Origin',
    });
    if (origin && allowedOrigins.includes(origin)) {
        headers.set('Access-Control-Allow-Origin', origin);
    }
    return headers;
}

export function middleware(request: NextRequest) {
    const origin = request.headers.get('origin');
    const corsHeaders = buildCorsHeaders(origin);

    // Short-circuit CORS preflight requests.
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    const response = NextResponse.next();
    corsHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
}

export const config = {
    matcher: '/api/:path*',
};
