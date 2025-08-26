import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { fetchWithRetry } from '@/lib/fetch-with-retry';
import { THEME_PARKS_WIKI_API_BASE_URL } from '@/lib/constants';

/**
 * Simplified health check endpoint
 * Reports environment status and optionally tests API connectivity
 */
export async function GET() {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: config.NODE_ENV,
            version: process.env.npm_package_version || 'unknown',
            checks: {
                environment: true,
                database: !!config.DATABASE_URL,
                waitTimesApi: !!config.WAIT_TIMES_API_URL,
                themeParksWikiApi: !!THEME_PARKS_WIKI_API_BASE_URL
            },
            config: {
                waitTimesApiUrl: config.WAIT_TIMES_API_URL,
                hasNextAuthSecret: !!config.NEXTAUTH_SECRET,
                hasNextAuthUrl: !!config.NEXTAUTH_URL,
                hasThemeParksWikiApi: !!THEME_PARKS_WIKI_API_BASE_URL
            }
        };

        // Optional: Test API connectivity (enable with HEALTH_CHECK_APIS=true)
        if (process.env.HEALTH_CHECK_APIS === 'true') {
            const apiChecks = await Promise.allSettled([
                fetchWithRetry(config.WAIT_TIMES_API_URL + '/health', {
                    method: 'HEAD',
                    timeoutMs: 3000, // Shorter timeout for health checks
                    maxRetries: 0, // No retries for health checks to avoid socket buildup
                    initialDelayMs: 200
                }).catch(error => {
                    // Handle socket errors gracefully in health checks
                    if (error?.cause?.code === 'UND_ERR_SOCKET') {
                        console.warn('Socket error in health check - treating as unhealthy');
                        return new Response('Socket Error', { status: 503 });
                    }
                    throw error;
                }),
                fetchWithRetry(THEME_PARKS_WIKI_API_BASE_URL + '/destinations', {
                    method: 'HEAD',
                    timeoutMs: 3000,
                    maxRetries: 0,
                    initialDelayMs: 200
                }).catch(error => {
                    if (error?.cause?.code === 'UND_ERR_SOCKET') {
                        console.warn('Socket error in health check - treating as unhealthy');
                        return new Response('Socket Error', { status: 503 });
                    }
                    throw error;
                }),
            ]);

            healthStatus.checks.waitTimesApi = apiChecks[0].status === 'fulfilled' &&
                (apiChecks[0].value as Response).ok;
            healthStatus.checks.themeParksWikiApi = apiChecks[1].status === 'fulfilled' &&
                (apiChecks[1].value as Response).ok;
        }

        const allChecksPass = Object.values(healthStatus.checks).every(check => check === true);

        return NextResponse.json(
            healthStatus,
            { status: allChecksPass ? 200 : 503 }
        );

    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Health check failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
