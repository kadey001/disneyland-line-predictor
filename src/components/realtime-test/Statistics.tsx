"use client"

interface RideStats {
    totalUpdates: number
    uniqueRides: Set<string>
    lastUpdateTime: Date | null
}

interface StatisticsProps {
    rideStats: RideStats
}

export function Statistics({ rideStats }: StatisticsProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{rideStats.totalUpdates}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Updates</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{rideStats.uniqueRides.size}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Unique Rides</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {rideStats.lastUpdateTime ? rideStats.lastUpdateTime.toLocaleTimeString() : 'None'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Last Update</div>
                </div>
            </div>
        </div>
    )
}
