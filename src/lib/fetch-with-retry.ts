/**
 * Utility for making HTTP requests with retry logic and exponential backoff
 */

import { logNetworkError, logRetryAttempt, logRetrySuccess, logApiError, createRequestContext } from './error-logger';

interface FetchWithRetryOptions extends RequestInit {
    /**
     * Maximum number of retry attempts (default: 3)
     */
    maxRetries?: number;
    /**
     * Initial delay in milliseconds before first retry (default: 1000)
     */
    initialDelayMs?: number;
    /**
     * Multiplier for exponential backoff (default: 2)
     */
    backoffMultiplier?: number;
    /**
     * Maximum delay in milliseconds between retries (default: 10000)
     */
    maxDelayMs?: number;
    /**
     * HTTP status codes that should trigger a retry (default: [500, 502, 503, 504, 429])
     */
    retryStatusCodes?: number[];
    /**
     * Timeout in milliseconds for each request attempt (default: 10000)
     */
    timeoutMs?: number;
}

interface RetryError extends Error {
    lastResponse?: Response;
    attempts: number;
    originalError?: Error;
}

/**
 * Creates a RetryError with additional metadata
 */
function createRetryError(
    message: string,
    attempts: number,
    lastResponse?: Response,
    originalError?: Error
): RetryError {
    const error = new Error(message) as RetryError;
    error.name = 'RetryError';
    error.attempts = attempts;
    error.lastResponse = lastResponse;
    error.originalError = originalError;
    return error;
}

/**
 * Delays execution for the specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if an error should trigger a retry
 */
function shouldRetryError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        return true;
    }

    if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code?: string }).code;
        // Network errors that should be retried
        return ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'UND_ERR_SOCKET'].includes(errorCode || '');
    }

    return false;
}

/**
 * Checks if an error is a socket closure that should be handled gracefully
 */
function isSocketClosureError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        const cause = (error as { cause?: { code?: string; message?: string } }).cause;
        if (cause && cause.code === 'UND_ERR_SOCKET' && cause.message?.includes('other side closed')) {
            return true;
        }
    }
    return false;
}

/**
 * Checks if an HTTP status code should trigger a retry
 */
function shouldRetryStatus(status: number, retryStatusCodes: number[]): boolean {
    return retryStatusCodes.includes(status);
}

/**
 * Fetch with automatic retry logic and exponential backoff
 */
export async function fetchWithRetry(
    url: string | URL,
    options: FetchWithRetryOptions = {}
): Promise<Response> {
    const {
        maxRetries = 3,
        initialDelayMs = 1000,
        backoffMultiplier = 2,
        maxDelayMs = 10000,
        retryStatusCodes = [500, 502, 503, 504, 429],
        timeoutMs = 10000,
        ...fetchOptions
    } = options;

    let lastError: Error | undefined;
    let lastResponse: Response | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
                headers: {
                    'Connection': 'keep-alive',
                    'Keep-Alive': 'timeout=5, max=1000',
                    ...fetchOptions.headers,
                },
            });

            clearTimeout(timeoutId);
            lastResponse = response;

            // If response is ok or shouldn't be retried, return it
            if (response.ok || !shouldRetryStatus(response.status, retryStatusCodes)) {
                // Log success if this was a retry
                if (attempt > 0) {
                    logRetrySuccess(attempt + 1, String(url), createRequestContext());
                }
                return response;
            }

            // Log API error
            logApiError(String(url), response, createRequestContext());

            // Log retry attempt for non-ok responses
            logRetryAttempt(
                attempt + 1,
                maxRetries + 1,
                String(url),
                new Error(`HTTP ${response.status}: ${response.statusText}`),
                createRequestContext()
            );

            // If this was the last attempt, don't wait
            if (attempt === maxRetries) {
                break;
            }

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Check if this is a socket closure during refresh - handle gracefully
            if (isSocketClosureError(error)) {
                console.warn(`Socket closed during request to ${String(url)} - likely due to page refresh`);
                // For socket closures, don't retry immediately - just log and continue
                if (attempt === maxRetries) {
                    // Return a minimal response rather than throwing
                    return new Response(JSON.stringify({
                        error: 'Request cancelled due to page refresh',
                        retryable: true
                    }), {
                        status: 499, // Client Closed Request
                        statusText: 'Client Closed Request'
                    });
                }
            } else {
                // Log network error with structured logging for other errors
                logNetworkError(
                    `Network error on attempt ${attempt + 1}/${maxRetries + 1}`,
                    lastError,
                    { ...createRequestContext(), url: String(url), attempt: attempt + 1 }
                );
            }

            // If this error shouldn't be retried or it's the last attempt, throw
            if (!shouldRetryError(error) || attempt === maxRetries) {
                // For socket closure errors, throw a more specific error
                if (isSocketClosureError(error)) {
                    throw createRetryError(
                        'Request cancelled due to connection closure (likely page refresh)',
                        attempt + 1,
                        undefined,
                        lastError
                    );
                }
                break;
            }
        }

        // Calculate delay for next retry (exponential backoff)
        const delay_ms = Math.min(
            initialDelayMs * Math.pow(backoffMultiplier, attempt),
            maxDelayMs
        );

        await delay(delay_ms);
    }

    // If we have a response but it's not ok, throw with the response
    if (lastResponse && !lastResponse.ok) {
        throw createRetryError(
            `HTTP ${lastResponse.status}: ${lastResponse.statusText} after ${maxRetries + 1} attempts`,
            maxRetries + 1,
            lastResponse
        );
    }

    // If we have a network error, throw it
    if (lastError) {
        throw createRetryError(
            `Network error after ${maxRetries + 1} attempts: ${lastError.message}`,
            maxRetries + 1,
            undefined,
            lastError
        );
    }

    // Fallback error (shouldn't reach here)
    throw createRetryError(
        `Unknown error after ${maxRetries + 1} attempts`,
        maxRetries + 1
    );
}
