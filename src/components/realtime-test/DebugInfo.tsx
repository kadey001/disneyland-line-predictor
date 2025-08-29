"use client"

interface DebugInfoProps {
    debugInfo: {
        supabaseUrl: string
        supabaseKey: string
        environment: string
        keyType: string
        connectionAttempts: number
        lastError: string | null
        subscriptionStatus: string
        testResult: string | null
    }
    parkId: string
    onTestConnection: () => void
}

export function DebugInfo({ debugInfo, parkId, onTestConnection }: DebugInfoProps) {
    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-yellow-900 dark:text-yellow-100">Debug Information</h2>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Supabase URL:</span>
                    <span className="font-mono text-xs bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded text-yellow-800 dark:text-yellow-200">
                        {debugInfo.supabaseUrl}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Environment:</span>
                    <span className={`font-mono text-xs px-2 py-1 rounded ${debugInfo.environment === 'production' ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        }`}>
                        {debugInfo.environment}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Key Type:</span>
                    <span className={`font-mono text-xs px-2 py-1 rounded ${debugInfo.keyType.includes('Production') ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' : debugInfo.keyType.includes('Service Role') ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' : 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        }`}>
                        {debugInfo.keyType}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Park ID Filter:</span>
                    <span className="font-mono text-xs bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
                        {parkId}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Connection Attempts:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{debugInfo.connectionAttempts}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Subscription Status:</span>
                    <span className={`font-semibold ${debugInfo.subscriptionStatus.includes('Active') ? 'text-green-600 dark:text-green-400' :
                        debugInfo.subscriptionStatus.includes('Connected') ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                        {debugInfo.subscriptionStatus}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Connection Test:</span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onTestConnection}
                            className="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                            Test
                        </button>
                        <span className={`font-mono text-xs px-2 py-1 rounded ${debugInfo.testResult?.includes('Success') ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' :
                            debugInfo.testResult?.includes('Error') ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                            {debugInfo.testResult || 'Not tested'}
                        </span>
                    </div>
                </div>
                {debugInfo.supabaseKey === 'Service Role (Testing)' && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">🔧 Development Mode Active</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Using service role key for development testing. This bypasses RLS policies for easier testing.
                            In production, the app will automatically switch to anon key with proper security policies.
                        </p>
                    </div>
                )}
                {debugInfo.environment === 'production' && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">🔒 Production Mode Active</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            Using secure anon key with RLS policies. Service role key is properly secured server-side only.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
