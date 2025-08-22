import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRefresh(interval: number) {
    const router = useRouter();

    useEffect(() => {
        const intervalId = setInterval(() => {
            router.refresh();
        }, interval);

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
