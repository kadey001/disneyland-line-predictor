import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Environment-aware key selection
const getSupabaseKey = () => {
    // In production, always use anon key (secure)
    if (process.env.NODE_ENV === 'production') {
        return supabaseAnonKey
    }

    // In development, use service role key for testing (bypasses RLS)
    // This allows testing without setting up complex RLS policies
    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    return serviceRoleKey || supabaseAnonKey
}

// Client-side Supabase client (safe for browser)
export const supabase = createClient(supabaseUrl, getSupabaseKey(), {
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
})

// Server-side Supabase client with service role (for API routes only)
// This should only be used in server-side code (API routes, server components)
export const createServerSupabaseClient = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    })
}

// Database types for type safety
export type Database = {
    public: {
        Tables: {
            ride_data_history: {
                Row: {
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
                Insert: {
                    id?: number
                    ride_id: string
                    external_id: string
                    park_id: string
                    entity_type: string
                    name: string
                    status: string
                    last_updated: string
                    created_at?: string
                    updated_at?: string
                    standby_wait_time?: number | null
                    return_time_state?: string | null
                    return_start?: string | null
                    return_end?: string | null
                    operating_hours?: Record<string, unknown> | null
                    forecast?: Record<string, unknown> | null
                }
                Update: {
                    id?: number
                    ride_id?: string
                    external_id?: string
                    park_id?: string
                    entity_type?: string
                    name?: string
                    status?: string
                    last_updated?: string
                    created_at?: string
                    updated_at?: string
                    standby_wait_time?: number | null
                    return_time_state?: string | null
                    return_start?: string | null
                    return_end?: string | null
                    operating_hours?: Record<string, unknown> | null
                    forecast?: Record<string, unknown> | null
                }
            }
        }
    }
}
