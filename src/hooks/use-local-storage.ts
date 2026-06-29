import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
    // State to store our value. Initialize with initialValue for SSR and hydration.
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    // Whether the persisted value has been read from localStorage yet. Lets
    // consumers hold off rendering until prefs are known, avoiding a flash where
    // the UI paints with the default then snaps to the stored value.
    const [isHydrated, setIsHydrated] = useState(false);

    // Read from local storage only on the client after mount to prevent hydration mismatch
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        } finally {
            setIsHydrated(true);
        }
    }, [key]);

    // Return a wrapped version of useState's setter function that persists the new value to localStorage
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have the same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            if (typeof window !== 'undefined') {
                if (valueToStore === null || valueToStore === undefined) {
                    window.localStorage.removeItem(key);
                } else {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue, isHydrated] as const;
}
