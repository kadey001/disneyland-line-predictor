'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { supabase, Database } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

type RideDataHistory = Database['public']['Tables']['ride_data_history']['Row']

interface SupabaseContextType {
    isConnected: boolean
    subscribeToRideUpdates: (
        onUpdate: (payload: RideDataHistory) => void,
        parkId?: string
    ) => () => void // Returns unsubscribe function
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false)
    const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())

    useEffect(() => {
        console.log('🔌 Setting up Supabase connection monitoring...')
        // Monitor connection status
        const channel = supabase.channel('connection-status')
        channel.subscribe((status) => {
            console.log(`🌐 Supabase connection status: ${status}`)
            setIsConnected(status === 'SUBSCRIBED')
        })

        return () => {
            console.log('🔌 Cleaning up Supabase connection monitoring')
            channel.unsubscribe()
        }
    }, [])

    // Cleanup all channels on unmount
    useEffect(() => {
        const channels = channelsRef.current
        return () => {
            channels.forEach((channel) => {
                channel.unsubscribe()
            })
            channels.clear()
        }
    }, [])

    const subscribeToRideUpdates = useCallback((
        onUpdate: (payload: RideDataHistory) => void,
        parkId?: string
    ) => {
        const channelKey = parkId ? `ride-updates-${parkId}` : 'ride-updates-all'

        console.log(`🔄 Setting up real-time subscription${parkId ? ` for park: ${parkId}` : ' for all parks'}`)
        console.log(`Channel key: ${channelKey}`)

        // If already subscribed to this park, return existing subscription
        if (channelsRef.current.has(channelKey)) {
            console.log(`📡 Reusing existing subscription for ${channelKey}`)
            return () => {
                const existingChannel = channelsRef.current.get(channelKey)
                if (existingChannel) {
                    console.log(`🧹 Unsubscribing from existing channel: ${channelKey}`)
                    existingChannel.unsubscribe()
                    channelsRef.current.delete(channelKey)
                }
            }
        }

        console.log(`📡 Creating new subscription for ${channelKey}`)

        const channel = supabase
            .channel(channelKey)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ride_data_history',
                    ...(parkId && { filter: `park_id=eq.${parkId}` }), // Only filter if parkId provided
                },
                (payload) => {
                    console.log(`🎉 Real-time update received for ${channelKey}:`, payload)
                    onUpdate(payload.new as RideDataHistory)
                }
            )
            .subscribe((status) => {
                console.log(`📊 Subscription status for ${channelKey}:`, status)
                if (status === 'SUBSCRIBED') {
                    console.log(`✅ Successfully subscribed to ${channelKey}`)
                } else if (status === 'CLOSED') {
                    console.log(`❌ Subscription closed for ${channelKey}`)
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`🚨 Channel error for ${channelKey}`)
                }
            })

        channelsRef.current.set(channelKey, channel)
        console.log(`💾 Stored channel ${channelKey}, total channels: ${channelsRef.current.size}`)

        // Return unsubscribe function
        return () => {
            console.log(`🧹 Unsubscribing from channel: ${channelKey}`)
            channel.unsubscribe()
            channelsRef.current.delete(channelKey)
        }
    }, [])

    return (
        <SupabaseContext.Provider value={{ isConnected, subscribeToRideUpdates }}>
            {children}
        </SupabaseContext.Provider>
    )
}

export function useSupabase() {
    const context = useContext(SupabaseContext)
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider')
    }
    return context
}
