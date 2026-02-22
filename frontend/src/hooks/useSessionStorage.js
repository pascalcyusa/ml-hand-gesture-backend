import { useState, useEffect, useCallback, useRef } from 'react';

export function useSessionStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading sessionStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Sync to sessionStorage via a separate effect.
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        try {
            window.sessionStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error setting sessionStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const setValue = useCallback((value) => {
        setStoredValue((prev) => {
            const valueToStore = value instanceof Function ? value(prev) : value;
            // CRITICAL: Deep-compare to prevent infinite re-render loops.
            // If the new value is structurally identical to the old value,
            // return the SAME reference so React skips the re-render entirely.
            try {
                if (JSON.stringify(prev) === JSON.stringify(valueToStore)) {
                    return prev; // Same data → same ref → no re-render
                }
            } catch (e) {
                // If stringify fails, fall through to normal update
            }
            return valueToStore;
        });
    }, []);

    return [storedValue, setValue];
}
