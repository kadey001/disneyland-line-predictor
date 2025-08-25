'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <MapPin className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">Page Not Found</CardTitle>
                    <CardDescription>
                        The page you're looking for doesn't exist. It might have been moved, deleted, or the URL might be incorrect.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Go home
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={() => window.history.back()} className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
