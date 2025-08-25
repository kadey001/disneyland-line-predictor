'use client'

import { useErrorHandler } from '@/hooks/use-error-handler'

export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
    useErrorHandler()
    return <>{children}</>
}
