import { useEffect, useCallback, useState } from 'react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { Database } from '@/lib/supabase'

type RideDataHistory = Database['public']['Tables']['ride_data_history']['Row']

interface UseRealtimeRideUpdatesOptions {
  parkId?: string
  onRideUpdate?: (rideData: RideDataHistory) => void
  enabled?: boolean
}

export function useRealtimeRideUpdates({
  parkId,
  onRideUpdate,
  enabled = true
}: UseRealtimeRideUpdatesOptions) {
  const { subscribeToRideUpdates, isConnected } = useSupabase()

  useEffect(() => {
    if (!enabled || !onRideUpdate) return

    const unsubscribe = subscribeToRideUpdates(onRideUpdate, parkId)

    return unsubscribe
  }, [parkId, onRideUpdate, enabled, subscribeToRideUpdates])

  return {
    isConnected,
    isEnabled: enabled
  }
}

// Hook for managing ride data state with real-time updates
export function useRideDataWithRealtime(parkId?: string) {
  const [rideData, setRideData] = useState<Map<string, RideDataHistory>>(new Map())

  const handleRideUpdate = useCallback((newRideData: RideDataHistory) => {
    setRideData(prev => {
      const updated = new Map(prev)
      updated.set(newRideData.ride_id, newRideData)
      return updated
    })
  }, [])

  const { isConnected } = useRealtimeRideUpdates({
    parkId,
    onRideUpdate: handleRideUpdate,
    enabled: true
  })

  const getRideData = useCallback((rideId: string) => {
    return rideData.get(rideId)
  }, [rideData])

  const getAllRideData = useCallback(() => {
    return Array.from(rideData.values())
  }, [rideData])

  return {
    rideData: getAllRideData(),
    getRideData,
    isConnected,
    totalRides: rideData.size
  }
}
