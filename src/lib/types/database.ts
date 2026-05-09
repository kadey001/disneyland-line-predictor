// Database types for type safety
// Migrated from Supabase SDK types — these are standalone TypeScript types
// that match the ride_data_history table schema

export type RideDataHistoryRow = {
    id: number
    ride_id: string
    external_id: string
    park_id: string
    entity_type: string
    name: string
    status: string
    last_updated: string
    created_at: string
    updated_at: string
    standby_wait_time: number | null
    return_time_state: string | null
    return_start: string | null
    return_end: string | null
    operating_hours: Record<string, unknown> | null
    forecast: Record<string, unknown> | null
}

// Legacy Database type wrapper for backwards compatibility during migration
// Components can import { Database } from here and use the same access pattern
export type Database = {
    public: {
        Tables: {
            ride_data_history: {
                Row: RideDataHistoryRow
                Insert: Partial<RideDataHistoryRow> & {
                    ride_id: string
                    external_id: string
                    park_id: string
                    entity_type: string
                    name: string
                    status: string
                    last_updated: string
                }
                Update: Partial<RideDataHistoryRow>
            }
        }
    }
}
