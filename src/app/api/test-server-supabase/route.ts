import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Use server-side client with service role key
        const supabase = createServerSupabaseClient()

        // This can perform operations that require elevated permissions
        const { data, error } = await supabase
            .from('ride_data_history')
            .select('id, name, status, standby_wait_time')
            .eq('park_id', '7340550b-c14d-4def-80bb-acdb51d49a66')
            .order('last_updated', { ascending: false })
            .limit(10)

        if (error) {
            console.error('Server-side query error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data,
            message: 'Server-side query successful'
        })
    } catch (error) {
        console.error('API route error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
