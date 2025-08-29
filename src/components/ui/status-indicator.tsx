interface StatusIndicatorProps {
    isConnected: boolean;
}

export default function StatusIndicator({ isConnected }: StatusIndicatorProps) {
    return (
        <div className={`fixed bottom-4 right-4 w-3 h-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full z-50 shadow-lg`} />
    );
}
