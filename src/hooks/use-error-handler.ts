'use client'

import { useEffect } from 'react'

export function useErrorHandler() {
    useEffect(() => {
        const handleError = (error: ErrorEvent) => {
            console.error('Global error caught:', error.error)
            // You can send this to your error reporting service
        }

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('Unhandled promise rejection:', event.reason)
            // You can send this to your error reporting service
        }

        window.addEventListener('error', handleError)
        window.addEventListener('unhandledrejection', handleUnhandledRejection)

        return () => {
            window.removeEventListener('error', handleError)
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        }
    }, [])
}
