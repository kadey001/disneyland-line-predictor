'use client'

import { useEffect } from 'react'
import { logNetworkError, createRequestContext } from '@/lib/error-logger'

export function useErrorHandler() {
    useEffect(() => {
        const handleError = (error: ErrorEvent) => {
            logNetworkError('Global JavaScript error', error.error, {
                ...createRequestContext(),
                filename: error.filename,
                lineno: error.lineno,
                colno: error.colno,
            })
        }

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            // Check if this is a network-related error
            const isNetworkError = event.reason &&
                (event.reason.message?.includes('fetch failed') ||
                    event.reason.code === 'ECONNRESET' ||
                    event.reason.code === 'UND_ERR_SOCKET')

            if (isNetworkError) {
                logNetworkError('Unhandled network promise rejection', event.reason, createRequestContext())
            } else {
                console.error('Unhandled promise rejection:', event.reason)
            }
        }

        window.addEventListener('error', handleError)
        window.addEventListener('unhandledrejection', handleUnhandledRejection)

        return () => {
            window.removeEventListener('error', handleError)
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        }
    }, [])
}
