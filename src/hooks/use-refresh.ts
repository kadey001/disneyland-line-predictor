import { useEffect } from "react";

interface UseRefreshProps {
    refreshFn: () => void;
    interval: number;
}

export function useRefresh({ interval, refreshFn }: UseRefreshProps) {
    useEffect(() => {
        refreshFn();
        const intervalId = setInterval(() => {
            refreshFn();
        }, interval);

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
