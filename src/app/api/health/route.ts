import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

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
                queueTimesApi: !!config.QUEUE_TIMES_API_URL,
            },
            config: {
                waitTimesApiUrl: config.WAIT_TIMES_API_URL,
                queueTimesApiUrl: config.QUEUE_TIMES_API_URL,
                hasNextAuthSecret: !!config.NEXTAUTH_SECRET,
                hasNextAuthUrl: !!config.NEXTAUTH_URL,
            }
        };

        // Optional: Test API connectivity (enable with HEALTH_CHECK_APIS=true)
        if (process.env.HEALTH_CHECK_APIS === 'true') {
            const apiChecks = await Promise.allSettled([
                fetch(config.WAIT_TIMES_API_URL, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(5000),
                }),
                fetch(config.QUEUE_TIMES_API_URL, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(5000),
                }),
            ]);

            healthStatus.checks.waitTimesApi = apiChecks[0].status === 'fulfilled' &&
                (apiChecks[0].value as Response).ok;
            healthStatus.checks.queueTimesApi = apiChecks[1].status === 'fulfilled' &&
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
