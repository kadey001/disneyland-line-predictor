"use client"

import { useState, useEffect } from 'react'
import { useRealtimeRideUpdates } from '@/hooks/use-realtime-ride-updates'
import { Database, supabase } from '@/lib/supabase'
import { DebugInfo, Statistics, RecentUpdates, Instructions, ConnectionStatusBar } from '@/components/realtime-test'

type RideDataHistory = Database['public']['Tables']['ride_data_history']['Row']

const PARK_ID = "7340550b-c14d-4def-80bb-acdb51d49a66"

export default function TestRealtimePage() {
    const [recentUpdates, setRecentUpdates] = useState<RideDataHistory[]>([])
    const [rideStats, setRideStats] = useState({
        totalUpdates: 0,
        uniqueRides: new Set<string>(),
        lastUpdateTime: null as Date | null
    })

    const [debugInfo, setDebugInfo] = useState({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'Service Role (Testing)' : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Anon Key' : 'Not set',
        environment: process.env.NODE_ENV || 'development',
        keyType: (() => {
            if (process.env.NODE_ENV === 'production') {
                return 'Production (Anon Key - Secure)'
            }
            const hasServiceRole = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
            return hasServiceRole ? 'Development (Service Role - Testing)' : 'Development (Anon Key)'
        })(),
        connectionAttempts: 0,
        lastError: null as string | null,
        subscriptionStatus: 'Not started' as string,
        testResult: null as string | null
    })

    const [has401Error, setHas401Error] = useState(false)

    // Test Supabase connection
    const testSupabaseConnection = async () => {
        try {
            console.log('🧪 Testing Supabase connection...')
            setDebugInfo(prev => ({ ...prev, testResult: 'Testing...' }))

            // First, test basic authentication
            console.log('� Testing authentication...')
            const { data: authTest, error: authError } = await supabase.auth.getSession()

            if (authError) {
                console.error('❌ Authentication test failed:', authError)
                setDebugInfo(prev => ({
                    ...prev,
                    testResult: `Auth Error: ${authError.message}`,
                    lastError: authError.message
                }))
                // Check if it's a 401 error
                if (authError.message.includes('401') || authError.message.includes('Unauthorized') || authError.message.includes('JWT')) {
                    setHas401Error(true)
                }
                return
            }

            console.log('✅ Authentication test passed')

            // Test basic table access
            console.log('📊 Testing table access...')
            const { data, error } = await supabase
                .from('ride_data_history')
                .select('id, ride_id, park_id, name, status')
                .eq('park_id', PARK_ID)
                .limit(1)

            if (error) {
                console.error('❌ Table access test failed:', error)

                // Check if it's an auth issue
                if (error.message.includes('JWT') || error.message.includes('401') || error.message.includes('Unauthorized')) {
                    setDebugInfo(prev => ({
                        ...prev,
                        testResult: 'Auth Issue: Check your anon key',
                        lastError: 'Invalid or expired Supabase anon key'
                    }))
                    setHas401Error(true)
                } else {
                    setDebugInfo(prev => ({
                        ...prev,
                        testResult: `Table Error: ${error.message}`,
                        lastError: error.message
                    }))
                }
                return
            }

            console.log('✅ Table access test successful:', data)
            setDebugInfo(prev => ({
                ...prev,
                testResult: `Success: Found ${data?.length || 0} records`,
                lastError: null
            }))
            setHas401Error(false)

        } catch (error) {
            console.error('❌ Test error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            setDebugInfo(prev => ({
                ...prev,
                testResult: `Error: ${errorMessage}`,
                lastError: errorMessage
            }))
        }
    }

    const handleRealtimeUpdate = (newData: RideDataHistory) => {
        console.log('🎉 Real-time update received:', newData)
        console.log('Ride ID:', newData.ride_id, 'Park ID:', newData.park_id)

        setRecentUpdates(prev => [newData, ...prev.slice(0, 9)]) // Keep last 10 updates

        setRideStats(prev => ({
            totalUpdates: prev.totalUpdates + 1,
            uniqueRides: new Set([...prev.uniqueRides, newData.ride_id]),
            lastUpdateTime: new Date()
        }))

        setDebugInfo(prev => ({
            ...prev,
            lastError: null,
            subscriptionStatus: 'Active - receiving updates'
        }))
    }

    const { isConnected } = useRealtimeRideUpdates({
        parkId: PARK_ID,
        onRideUpdate: handleRealtimeUpdate,
        enabled: true
    })

    useEffect(() => {
        setDebugInfo(prev => ({
            ...prev,
            subscriptionStatus: isConnected ? 'Connected to Supabase' : 'Disconnected from Supabase'
        }))

        if (!isConnected) {
            console.warn('⚠️ Supabase real-time connection lost')
        } else {
            console.log('✅ Supabase real-time connection established')
            // Only increment attempts when we successfully connect (not on disconnects)
            setDebugInfo(prev => ({
                ...prev,
                connectionAttempts: prev.connectionAttempts + 1
            }))
        }
    }, [isConnected])

    // Removed testInsertData function - we're just listening for updates

    return (
        <>
            <div className="h-[100%] bg-gray-50 dark:bg-gray-900">
                {/* Connection Status Bar */}
                <ConnectionStatusBar isConnected={isConnected} />
                <div className="max-w-6xl mx-auto">
                    {/* Debug Information */}
                    <DebugInfo debugInfo={debugInfo} parkId={PARK_ID} onTestConnection={testSupabaseConnection} />

                    {/* Statistics */}
                    <Statistics rideStats={rideStats} />

                    {/* Recent Updates */}
                    <RecentUpdates recentUpdates={recentUpdates} />
                </div>
            </div>
        </>
    )
}
