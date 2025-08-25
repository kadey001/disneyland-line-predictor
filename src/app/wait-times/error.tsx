'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function WaitTimesError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Wait times error:', error)
    }, [error])

    return (
        <div className="container mx-auto p-4">
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">Wait Times Unavailable</CardTitle>
                    <CardDescription>
                        We&apos;re having trouble loading the wait times data. This could be due to a temporary service issue.
                        Please try again later or click the button below to retry.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === 'development' && (
                        <div className="rounded-md bg-muted p-3">
                            <p className="text-xs text-muted-foreground font-mono">
                                {error.message}
                            </p>
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Button onClick={reset} className="w-full">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reload
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
