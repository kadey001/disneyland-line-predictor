'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, RefreshCcw, TriangleAlert } from 'lucide-react'

export default function WaitTimesNotFound() {
    return (
        <div className="min-h-full w-full flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <TriangleAlert className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">Wait Time Data Not Found</CardTitle>
                    <CardDescription>
                        There was an issue fetching the wait time data. Please try again later.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                        {/* Reload Button */}
                        <Button onClick={() => window.location.reload()} className="w-full">
                            <RefreshCcw className="ml-2 h-4 w-4" />
                            Reload
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
