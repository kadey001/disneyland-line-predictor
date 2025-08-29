"use client"

import { Database } from '@/lib/supabase'

type RideDataHistory = Database['public']['Tables']['ride_data_history']['Row']

interface RecentUpdatesProps {
    recentUpdates: RideDataHistory[]
}

export function RecentUpdates({ recentUpdates }: RecentUpdatesProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Recent Updates</h2>
            {recentUpdates.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">📡</div>
                    <p>Waiting for real-time updates...</p>
                    <p className="text-sm mt-2">Start your Go service or any system that inserts data into ride_data_history</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {recentUpdates.map((update, index) => (
                        <div key={`${update.id}-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{update.name}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${update.status === 'OPERATING' ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' :
                                    update.status === 'CLOSED' ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200' :
                                        'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                                    }`}>
                                    {update.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Ride ID:</span>
                                    <div className="font-mono text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded mt-1 text-gray-900 dark:text-gray-100">
                                        {update.ride_id}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Wait Time:</span>
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">{update.standby_wait_time || 0} min</div>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                                    <div className="font-mono text-xs text-gray-900 dark:text-gray-100">
                                        {new Date(update.last_updated).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Entity Type:</span>
                                    <div className="text-gray-900 dark:text-gray-100">{update.entity_type}</div>
                                </div>
                            </div>

                            {update.return_time_state && (
                                <div className="mt-2 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Return Time State:</span>
                                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{update.return_time_state}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
