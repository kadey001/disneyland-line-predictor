// Example component showing how to use real-time ride updates
// You can integrate this pattern into any component that needs live data

'use client'

import { useRealtimeRideUpdates } from '@/hooks/use-realtime-ride-updates'
import { Database } from '@/lib/supabase'
import { useState, useEffect } from 'react'

type RideDataHistory = Database['public']['Tables']['ride_data_history']['Row']

interface RideStatusCardProps {
    rideId: string
    parkId: string
    initialData?: RideDataHistory
}

export function RideStatusCard({ rideId, parkId, initialData }: RideStatusCardProps) {
    const [currentData, setCurrentData] = useState<RideDataHistory | undefined>(initialData)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const handleRealtimeUpdate = (newData: RideDataHistory) => {
        if (newData.ride_id === rideId) {
            setCurrentData(newData)
            setLastUpdate(new Date())
        }
    }

    const { isConnected } = useRealtimeRideUpdates({
        parkId,
        onRideUpdate: handleRealtimeUpdate,
        enabled: true
    })

    // Update current data when initial data changes
    useEffect(() => {
        if (initialData) {
            setCurrentData(initialData)
        }
    }, [initialData])

    if (!currentData) {
        return (
            <div className="p-4 border rounded-lg">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{currentData.name}</h3>
                {isConnected && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Live
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Wait Time:</span>
                    <span className="font-medium">
                        {currentData.standby_wait_time || 0} min
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-medium ${currentData.status === 'OPERATING'
                        ? 'text-green-600'
                        : currentData.status === 'CLOSED'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}>
                        {currentData.status}
                    </span>
                </div>

                {lastUpdate && (
                    <div className="text-xs text-gray-500 mt-2">
                        Updated: {lastUpdate.toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    )
}

// Hook for managing multiple rides with real-time updates
export function useMultipleRideUpdates(parkId: string, rideIds: string[]) {
    const [ridesData, setRidesData] = useState<Map<string, RideDataHistory>>(new Map())

    const handleRealtimeUpdate = (newData: RideDataHistory) => {
        if (rideIds.includes(newData.ride_id)) {
            setRidesData(prev => {
                const updated = new Map(prev)
                updated.set(newData.ride_id, newData)
                return updated
            })
        }
    }

    const { isConnected } = useRealtimeRideUpdates({
        parkId,
        onRideUpdate: handleRealtimeUpdate,
        enabled: rideIds.length > 0
    })

    return {
        ridesData,
        isConnected,
        getRideData: (rideId: string) => ridesData.get(rideId)
    }
}
