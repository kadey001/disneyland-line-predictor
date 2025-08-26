/**
 * Error logging utility with structured logging for better monitoring
 */

export interface LogContext {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    url?: string;
    userAgent?: string;
    timestamp?: string;
    [key: string]: unknown;
}

export interface ErrorLogEntry {
    level: 'error' | 'warn' | 'info';
    message: string;
    error?: Error;
    context?: LogContext;
    stack?: string;
    timestamp: string;
}

/**
 * Determines if we're in a production environment
 */
function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Safely extracts error information
 */
function extractErrorInfo(error: unknown): {
    message: string;
    stack?: string;
    name?: string;
    code?: string;
} {
    if (error instanceof Error) {
        // Narrow the cause to an unknown object and extract safely
        const errWithCause = error as Error & { cause?: unknown };
        const cause = errWithCause.cause;
        return {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: (error as Error & { code?: string }).code,
            ...(cause && typeof cause === 'object' ? (() => {
                const c = cause as { code?: string; message?: string; socket?: { localAddress?: string; localPort?: number; remoteAddress?: string; remotePort?: number } };
                return {
                    causeCode: c.code,
                    causeMessage: c.message,
                    causeSocket: c.socket ? {
                        localAddress: c.socket.localAddress,
                        localPort: c.socket.localPort,
                        remoteAddress: c.socket.remoteAddress,
                        remotePort: c.socket.remotePort,
                    } : undefined
                };
            })() : {}),
        };
    }

    if (typeof error === 'string') {
        return { message: error };
    }

    return { message: String(error) };
}

/**
 * Creates a structured log entry
 */
function createLogEntry(
    level: 'error' | 'warn' | 'info',
    message: string,
    error?: unknown,
    context?: LogContext
): ErrorLogEntry {
    const errorInfo = error ? extractErrorInfo(error) : undefined;

    return {
        level,
        message,
        error: error instanceof Error ? error : undefined,
        context: {
            ...context,
            timestamp: new Date().toISOString(),
            ...(errorInfo?.code && { errorCode: errorInfo.code }),
            ...(errorInfo?.name && { errorName: errorInfo.name }),
        },
        stack: errorInfo?.stack,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Logs network errors with structured data
 */
export function logNetworkError(
    message: string,
    error: unknown,
    context?: LogContext
): void {
    const logEntry = createLogEntry('error', message, error, {
        ...context,
        category: 'network',
    });

    // Console logging for development
    if (!isProduction()) {
        console.error('Network Error:', {
            message: logEntry.message,
            error: logEntry.error,
            context: logEntry.context,
        });
    }

    // In production, you might want to send to an external service
    if (isProduction()) {
        // If this looks like a socket closure from undici, log at warn level in structured form
        const contextAny = logEntry.context as { causeCode?: string; errorCode?: string } | undefined;
        const causeCode = contextAny?.causeCode || contextAny?.errorCode;
        if (causeCode === 'UND_ERR_SOCKET') {
            // Log as warn to reduce noise for expected socket closes
            console.warn(JSON.stringify({ ...logEntry, level: 'warn' }));
            return;
        }

        // Example: Send to your monitoring service
        // sendToMonitoringService(logEntry);

        // For now, just log to console with structured format
        console.error(JSON.stringify(logEntry));
    }
}

/**
 * Logs fetch retry attempts
 */
export function logRetryAttempt(
    attempt: number,
    maxAttempts: number,
    url: string,
    error: unknown,
    context?: LogContext
): void {
    const message = `Fetch retry ${attempt}/${maxAttempts} for ${url}`;

    const logEntry = createLogEntry('warn', message, error, {
        ...context,
        category: 'retry',
        attempt,
        maxAttempts,
        url,
    });

    if (!isProduction()) {
        console.warn('Retry Attempt:', {
            message: logEntry.message,
            attempt,
            maxAttempts,
            url,
            error: logEntry.error,
        });
    }
}

/**
 * Logs successful recovery after retries
 */
export function logRetrySuccess(
    attempt: number,
    url: string,
    context?: LogContext
): void {
    const message = `Fetch succeeded on attempt ${attempt} for ${url}`;

    const logEntry = createLogEntry('info', message, undefined, {
        ...context,
        category: 'retry-success',
        attempt,
        url,
    });

    if (!isProduction()) {
        console.info('Retry Success:', {
            message: logEntry.message,
            attempt,
            url,
        });
    }
}

/**
 * Logs API errors with response details
 */
export function logApiError(
    url: string,
    response: Response,
    context?: LogContext
): void {
    const message = `API error: ${response.status} ${response.statusText} for ${url}`;

    const logEntry = createLogEntry('error', message, undefined, {
        ...context,
        category: 'api',
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
    });

    console.error('API Error:', {
        message: logEntry.message,
        status: response.status,
        url,
        context: logEntry.context,
    });
}

/**
 * Creates a request context from current environment
 */
export function createRequestContext(): LogContext {
    const context: LogContext = {
        timestamp: new Date().toISOString(),
    };

    // Add browser context if available
    if (typeof window !== 'undefined') {
        context.userAgent = navigator.userAgent;
        context.url = window.location.href;
    }

    // Add Next.js request context if available
    if (typeof process !== 'undefined' && process.env) {
        context.nodeEnv = process.env.NODE_ENV;
        context.vercelRegion = process.env.VERCEL_REGION;
    }

    return context;
}
