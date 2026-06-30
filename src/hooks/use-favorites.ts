import { useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";

export type FavoritesMap = Record<string, true>;

/**
 * Persists the set of favorited ride ids in localStorage. Backed by
 * useLocalStorage so it shares the same SSR-safe hydration behaviour.
 */
export function useFavorites() {
    const [favs, setFavs, isHydrated] = useLocalStorage<FavoritesMap>("lineMagic.favs", {});

    const isFav = useCallback((rideId: string) => !!favs[rideId], [favs]);

    const toggleFav = useCallback((rideId: string) => {
        setFavs((prev) => {
            const next = { ...prev };
            if (next[rideId]) delete next[rideId];
            else next[rideId] = true;
            return next;
        });
    }, [setFavs]);

    return { favs, isFav, toggleFav, isHydrated };
}
