"use client"

interface ConnectionStatusBarProps {
    isConnected: boolean
}

export function ConnectionStatusBar({ isConnected }: ConnectionStatusBarProps) {
    return (
        <div className={`w-full h-8 flex items-center justify-center text-sm font-medium text-white ${isConnected ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'}`}>
            <div className="flex items-center space-x-2">
                <span>
                    {isConnected ? 'Connected - Listening for updates...' : 'Disconnected - Waiting for connection...'}
                </span>
            </div>
        </div>
    )
}
