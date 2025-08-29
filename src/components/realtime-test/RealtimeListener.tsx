"use client"

interface RealtimeListenerProps {
    isConnected: boolean
    parkId: string
}

export function RealtimeListener({ isConnected, parkId }: RealtimeListenerProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Real-time Listener</h2>
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {isConnected ? 'Listening for updates...' : 'Waiting for connection...'}
                    </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    This page is actively listening for new entries in the ride_data_history table for park: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-900 dark:text-gray-100">{parkId}</code>
                </p>
            </div>
        </div>
    )
}
