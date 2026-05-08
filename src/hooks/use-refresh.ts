import { useEffect } from "react";

interface UseRefreshProps {
    refreshFn: () => void;
    interval: number;
    enabled?: boolean;
}

export function useRefresh({ interval, refreshFn, enabled = true }: UseRefreshProps) {
    useEffect(() => {
        if (!enabled) return;

        refreshFn();
        const intervalId = setInterval(() => {
            refreshFn();
        }, interval);

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, interval]);

    useEffect(() => {
        console.log(`Refreshing ${enabled ? 'enabled' : 'disabled'}`);
    }, [enabled]);
}
